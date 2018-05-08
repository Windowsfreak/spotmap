<?php
$sql_delete_section = /** @lang SQL */
<<<"DONE"
DELETE FROM `spot` WHERE zoom = :zoom AND geohash >= :hash_start AND geohash < :hash_end;
DONE;

$sql_generate_groups = /** @lang SQL */
<<<"DONE"
INSERT INTO spot
(id, title, type, category, geohash, zoom, lat, lng, created, changed, description)
  SELECT t1.id, t1.title, t1.type, t1.category, t1.ghash as geohash, zoom, lat, lng, created, changed, description
  FROM (
    SELECT
      Min(spot.id) As id,
      Count(DISTINCT(spot.geohash)) As title,
      CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.type)) As type,
      CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.category)) As category,
      LEFT(spot.geohash, :length) As ghash,
      :zoom As zoom,
      ROUND(Avg(spot.lat), 12) As lat,
      ROUND(Avg(spot.lng), 12) As lng,
      Max(spot.created) As created,
      Max(spot.changed) As changed,
      '' As description
    FROM spot
    WHERE spot.zoom = -1
      AND spot.geohash >= :hash_start
      AND spot.geohash < :hash_end
    GROUP BY ghash
    HAVING title > 1
    ORDER BY title DESC
  ) as t1;
DONE;

$sql_generate_unicorns = /** @lang SQL */
<<<"DONE"
INSERT INTO spot
(id, type, category, title, created, changed, description, lat, lng, geohash, p0, zoom, user_id, url_alias, user_created, user_changed)
  SELECT id, type, category, title, created, changed, description, lat, lng, geohash, p0, zoom, user_id, url_alias, user_created, user_changed
  FROM (
    SELECT
      Min(spot.id) As id,
      GROUP_CONCAT(DISTINCT spot.type) as type,
      GROUP_CONCAT(DISTINCT spot.category) as category,
      Min(spot.title) as title,
      Min(spot.created) as created,
      Min(spot.changed) as changed,
      Min(description) as description,
      Min(lat) as lat,
      Min(lng) as lng,
      Min(geohash) as geohash,
      Min(p0) as p0,
      Count(DISTINCT(spot.geohash)) As num,
      LEFT(spot.geohash, :length) As ghash,
      :zoom As zoom,
      Min(user_id) as user_id,
      Min(url_alias) as url_alias,
      Min(user_created) as user_created,
      Min(user_changed) as user_changed
    FROM spot
    WHERE spot.zoom = -1
      AND spot.geohash >= :hash_start
      AND spot.geohash < :hash_end
    GROUP BY ghash
    HAVING num = 1
  ) as t1;
DONE;

function execute($geohash)
{
    global $sql_delete_section, $sql_generate_groups, $sql_generate_unicorns;

    echo ($geohash ? 'Regenerating pinpoints around ' . $geohash : 'Regenerating ALL pinpoints') . '...<br>';

    $zooms = [];

    foreach (range(0, 5) as $i) {
        $zoom = [];
        $zoom['zoom'] = $i;
        $zoom['length'] = $i + 3;
        $zoom['hash_start'] = substr($geohash, 0, $zoom['length']);
        $zoom['hash_end'] = $zoom['hash_start'] . '~';
        $zooms[$i] = $zoom;
    }

    $start = microtime(true);
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=pkorg_map;charset=utf8", 'root');

        // $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, 1);
        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $stmt_delete_section = $pdo->prepare($sql_delete_section);
        $stmt_generate_groups = $pdo->prepare($sql_generate_groups);
        $stmt_generate_unicorns = $pdo->prepare($sql_generate_unicorns);
        foreach ($zooms as $i => $zoom) {
            $subset = ['zoom' => $i, 'hash_start' => $zoom['hash_start'], 'hash_end' => $zoom['hash_end']];

            $stmt_delete_section->execute($subset) or die(print_r($pdo->errorInfo(), true));
            $deleted = $stmt_delete_section->rowCount();

            $stmt_generate_groups->execute($zoom) or die(print_r($pdo->errorInfo(), true));
            $magnifiers = $stmt_generate_groups->rowCount();

            $stmt_generate_unicorns->execute($zoom) or die(print_r($pdo->errorInfo(), true));
            $pinpoints = $stmt_generate_unicorns->rowCount();

            echo "Zoom level $i - ${zoom['hash_start']} - deleted $deleted rows, created $magnifiers magnifiers and $pinpoints pinpoints.<br>";
        }
    } catch (PDOException $e) {
        echo $e->getMessage();
        die();
    }
    $time_elapsed_secs = microtime(true) - $start;
    echo 'Queries executed in ' . $time_elapsed_secs . 's.';
}

// execute(@$_REQUEST['geohash']);