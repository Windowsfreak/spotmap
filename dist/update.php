<?php
if (!password_verify($_REQUEST['auth'], '$2y$10$8Iudk1gbvqPvKsFL9PUS9O3SjTk/l05aqB3F77tL69C6PxjDgyOX6')) {
    die('Permission denied');
}
$pdo = new PDO("mysql:host=localhost;dbname=pkorgd8;charset=utf8", 'root');
$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, 1);

$stmt = $pdo->prepare('SELECT count(id) AS c1, sum(if(zoom = -1, 1, 0)) AS c2 FROM spot');
if ($stmt->execute()) {
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Vorher: {$row['c1']} Zeilen ({$row['c2']} Nodes)<br />";
    }
}

$sql = /** @lang SQL */
    <<<"DONE"
DELETE FROM spot WHERE spot.zoom = -1 AND spot.id NOT IN (
  SELECT node.nid AS id
  FROM node
);

INSERT INTO
    spot
    (id, `type`, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4)
SELECT
    node.nid AS id, node.type, COALESCE(field_spot_type_value, COALESCE(field_group_type_value, field_event_type_value)) as category, node_field_data.title, node_field_data.created, node_field_data.changed, COALESCE(body_value, "") as description,
    field_location_lat as lat, field_location_lon as lng, ST_GeoHash(field_location_lon, field_location_lat, 16) as geohash,
    '' as p0, '' as p1, '' as p2, '' as p3, '' as p4
FROM
    (((node
LEFT OUTER JOIN
    spot
ON
    node.nid = spot.id)
LEFT OUTER JOIN
    node_field_data
ON
  node_field_data.nid = node.nid
    AND node_field_data.vid = node.vid
  AND node_field_data.langcode = node.langcode
LEFT OUTER JOIN
    node__body
ON
  node__body.entity_id = node.nid
    AND node__body.langcode = node.langcode
    AND node__body.revision_id = node.vid)
LEFT OUTER JOIN
    node__field_location
ON
    node__field_location.entity_id = node.nid
    AND node__field_location.langcode = node.langcode
    AND node__field_location.revision_id = node.vid)
LEFT OUTER JOIN
    node__field_spot_type
ON
    node__field_spot_type.entity_id = node.nid
    AND node__field_spot_type.langcode = node.langcode
    AND node__field_spot_type.revision_id = node.vid
LEFT OUTER JOIN
node__field_group_type
  ON
    node__field_group_type.entity_id = node.nid
    AND node__field_group_type.langcode = node.langcode
    AND node__field_group_type.revision_id = node.vid
LEFT OUTER JOIN
node__field_event_type
  ON
    node__field_event_type.entity_id = node.nid
    AND node__field_event_type.langcode = node.langcode
    AND node__field_event_type.revision_id = node.vid
WHERE
    node.`type` IN ('spot', 'event', 'group') AND field_location_lat IS NOT NULL AND field_location_lon IS NOT NULL AND spot.id IS NULL
ORDER BY
    node.nid ASC;

UPDATE
    (((spot
JOIN
    node ON spot.id = node.nid)
LEFT OUTER JOIN
    node_field_data
ON
  node_field_data.nid = node.nid
    AND node_field_data.vid = node.vid
  AND node_field_data.langcode = node.langcode
LEFT OUTER JOIN
      node__body
ON
  node__body.entity_id = node.nid
    AND node__body.langcode = node.langcode
    AND node__body.revision_id = node.vid)
LEFT OUTER JOIN
    node__field_location
ON
    node__field_location.entity_id = node.nid
    AND node__field_location.langcode = node.langcode
    AND node__field_location.revision_id = node.vid)
LEFT OUTER JOIN
    node__field_spot_type
ON
    node__field_spot_type.entity_id = node.nid
    AND node__field_spot_type.langcode = node.langcode
    AND node__field_spot_type.revision_id = node.vid
LEFT OUTER JOIN
node__field_group_type
  ON
    node__field_group_type.entity_id = node.nid
    AND node__field_group_type.langcode = node.langcode
    AND node__field_group_type.revision_id = node.vid
LEFT OUTER JOIN
node__field_event_type
  ON
    node__field_event_type.entity_id = node.nid
    AND node__field_event_type.langcode = node.langcode
    AND node__field_event_type.revision_id = node.vid
SET
    spot.type = node.type,
    spot.title = node_field_data.title,
    spot.created = node_field_data.created,
    spot.changed = node_field_data.changed,
    spot.category = COALESCE(field_spot_type_value, COALESCE(field_group_type_value, field_event_type_value)),
    spot.lat = field_location_lat,
    spot.lng = field_location_lon,
    spot.geohash = ST_GeoHash(field_location_lon, field_location_lat, 16),
    spot.description = COALESCE(body_value, "")
WHERE
    field_location_lat IS NOT NULL AND field_location_lon IS NOT NULL AND spot.changed <> node_field_data.changed;

UPDATE
    ((spot
JOIN
    node ON spot.id = node.nid)
LEFT OUTER JOIN
    node__field_images ON node__field_images.entity_id = node.nid
      AND node__field_images.revision_id = node.vid
      AND node__field_images.delta = 0)
JOIN
    file_managed ON file_managed.fid = node__field_images.field_images_target_id
SET
    p0 = filename;

UPDATE
    ((spot
      JOIN
      node ON spot.id = node.nid)
      LEFT OUTER JOIN
      node__field_images ON node__field_images.entity_id = node.nid
                                AND node__field_images.revision_id = node.vid
                                AND node__field_images.delta = 1)
    JOIN
    file_managed ON file_managed.fid = node__field_images.field_images_target_id
SET
  p1 = filename;

UPDATE
    ((spot
      JOIN
      node ON spot.id = node.nid)
      LEFT OUTER JOIN
      node__field_images ON node__field_images.entity_id = node.nid
                                AND node__field_images.revision_id = node.vid
                                AND node__field_images.delta = 2)
    JOIN
    file_managed ON file_managed.fid = node__field_images.field_images_target_id
SET
  p2 = filename;

UPDATE
    ((spot
      JOIN
      node ON spot.id = node.nid)
      LEFT OUTER JOIN
      node__field_images ON node__field_images.entity_id = node.nid
                                AND node__field_images.revision_id = node.vid
                                AND node__field_images.delta = 3)
    JOIN
    file_managed ON file_managed.fid = node__field_images.field_images_target_id
SET
  p3 = filename;

UPDATE
    ((spot
      JOIN
      node ON spot.id = node.nid)
      LEFT OUTER JOIN
      node__field_images ON node__field_images.entity_id = node.nid
                                AND node__field_images.revision_id = node.vid
                                AND node__field_images.delta = 4)
    JOIN
    file_managed ON file_managed.fid = node__field_images.field_images_target_id
SET
  p4 = filename;

DELETE FROM `spot` WHERE geohash = '';

DELETE FROM `spot` WHERE zoom > -1;

/*********************************** ZOOM ***********************************/

INSERT INTO spot
(id, title, type, category, geohash, zoom, lat, lng)
  SELECT t1.id, t1.title, t1.type, t1.category, t1.ghash as geohash, zoom, lat, lng
  FROM (
       SELECT
         Min(spot.id) As id,
         Count(DISTINCT(spot.geohash)) As title,
         CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.type)) As type,
         CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.category)) As category,
         LEFT(spot.geohash, 3) As ghash,
         0 As zoom,
         Avg(spot.lat) As lat,
         Avg(spot.lng) As lng
       FROM spot
       WHERE spot.zoom = -1
       GROUP BY ghash
       HAVING title > 1
       ORDER BY title DESC
     ) as t1;

INSERT INTO spot
(id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom)
  SELECT id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom
FROM (
       SELECT
         Min(spot.id) As id,
         GROUP_CONCAT(DISTINCT spot.type) as type,
         GROUP_CONCAT(DISTINCT spot.category) as category,
         GROUP_CONCAT(DISTINCT spot.title) as title,
         Min(spot.created) as created,
         Min(spot.changed) as changed,
         Min(description) as description,
         Min(lat) as lat,
         Min(lng) as lng,
         Min(geohash) as geohash,
         Min(p0) as p0,
         Min(p1) as p1,
         Min(p2) as p2,
         Min(p3) as p3,
         Min(p4) as p4,
         Count(DISTINCT(spot.geohash)) As num,
         LEFT(spot.geohash, 3) As ghash,
         0 As zoom
       FROM spot
       WHERE spot.zoom = -1
       GROUP BY ghash
       HAVING num = 1
     ) as t1;

INSERT INTO spot
(id, title, type, category, geohash, zoom, lat, lng)
  SELECT t1.id, t1.title, t1.type, t1.category, t1.ghash as geohash, zoom, lat, lng
  FROM (
         SELECT
           Min(spot.id) As id,
           Count(DISTINCT(spot.geohash)) As title,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.type)) As type,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.category)) As category,
           LEFT(spot.geohash, 4) As ghash,
           1 As zoom,
           Avg(spot.lat) As lat,
           Avg(spot.lng) As lng
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING title > 1
         ORDER BY title DESC
       ) as t1;

INSERT INTO spot
(id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom)
  SELECT id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom
  FROM (
         SELECT
           Min(spot.id) As id,
           GROUP_CONCAT(DISTINCT spot.type) as type,
           GROUP_CONCAT(DISTINCT spot.category) as category,
           GROUP_CONCAT(DISTINCT spot.title) as title,
           Min(spot.created) as created,
           Min(spot.changed) as changed,
           Min(description) as description,
           Min(lat) as lat,
           Min(lng) as lng,
           Min(geohash) as geohash,
           Min(p0) as p0,
           Min(p1) as p1,
           Min(p2) as p2,
           Min(p3) as p3,
           Min(p4) as p4,
           Count(DISTINCT(spot.geohash)) As num,
           LEFT(spot.geohash, 4) As ghash,
           1 As zoom
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING num = 1
       ) as t1;

INSERT INTO spot
(id, title, type, category, geohash, zoom, lat, lng)
  SELECT t1.id, t1.title, t1.type, t1.category, t1.ghash as geohash, zoom, lat, lng
  FROM (
         SELECT
           Min(spot.id) As id,
           Count(DISTINCT(spot.geohash)) As title,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.type)) As type,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.category)) As category,
           LEFT(spot.geohash, 5) As ghash,
           2 As zoom,
           Avg(spot.lat) As lat,
           Avg(spot.lng) As lng
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING title > 1
         ORDER BY title DESC
       ) as t1;

INSERT INTO spot
(id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom)
  SELECT id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom
  FROM (
         SELECT
           Min(spot.id) As id,
           GROUP_CONCAT(DISTINCT spot.type) as type,
           GROUP_CONCAT(DISTINCT spot.category) as category,
           GROUP_CONCAT(DISTINCT spot.title) as title,
           Min(spot.created) as created,
           Min(spot.changed) as changed,
           Min(description) as description,
           Min(lat) as lat,
           Min(lng) as lng,
           Min(geohash) as geohash,
           Min(p0) as p0,
           Min(p1) as p1,
           Min(p2) as p2,
           Min(p3) as p3,
           Min(p4) as p4,
           Count(DISTINCT(spot.geohash)) As num,
           LEFT(spot.geohash, 5) As ghash,
           2 As zoom
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING num = 1
       ) as t1;

INSERT INTO spot
(id, title, type, category, geohash, zoom, lat, lng)
  SELECT t1.id, t1.title, t1.type, t1.category, t1.ghash as geohash, zoom, lat, lng
  FROM (
         SELECT
           Min(spot.id) As id,
           Count(DISTINCT(spot.geohash)) As title,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.type)) As type,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.category)) As category,
           LEFT(spot.geohash, 6) As ghash,
           3 As zoom,
           Avg(spot.lat) As lat,
           Avg(spot.lng) As lng
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING title > 1
         ORDER BY title DESC
       ) as t1;

INSERT INTO spot
(id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom)
  SELECT id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom
  FROM (
         SELECT
           Min(spot.id) As id,
           GROUP_CONCAT(DISTINCT spot.type) as type,
           GROUP_CONCAT(DISTINCT spot.category) as category,
           GROUP_CONCAT(DISTINCT spot.title) as title,
           Min(spot.created) as created,
           Min(spot.changed) as changed,
           Min(description) as description,
           Min(lat) as lat,
           Min(lng) as lng,
           Min(geohash) as geohash,
           Min(p0) as p0,
           Min(p1) as p1,
           Min(p2) as p2,
           Min(p3) as p3,
           Min(p4) as p4,
           Count(DISTINCT(spot.geohash)) As num,
           LEFT(spot.geohash, 6) As ghash,
           3 As zoom
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING num = 1
       ) as t1;

INSERT INTO spot
(id, title, type, category, geohash, zoom, lat, lng)
  SELECT t1.id, t1.title, t1.type, t1.category, t1.ghash as geohash, zoom, lat, lng
  FROM (
         SELECT
           Min(spot.id) As id,
           Count(DISTINCT(spot.geohash)) As title,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.type)) As type,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.category)) As category,
           LEFT(spot.geohash, 7) As ghash,
           4 As zoom,
           Avg(spot.lat) As lat,
           Avg(spot.lng) As lng
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING title > 1
         ORDER BY title DESC
       ) as t1;

INSERT INTO spot
(id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom)
  SELECT id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom
  FROM (
         SELECT
           Min(spot.id) As id,
           GROUP_CONCAT(DISTINCT spot.type) as type,
           GROUP_CONCAT(DISTINCT spot.category) as category,
           GROUP_CONCAT(DISTINCT spot.title) as title,
           Min(spot.created) as created,
           Min(spot.changed) as changed,
           Min(description) as description,
           Min(lat) as lat,
           Min(lng) as lng,
           Min(geohash) as geohash,
           Min(p0) as p0,
           Min(p1) as p1,
           Min(p2) as p2,
           Min(p3) as p3,
           Min(p4) as p4,
           Count(DISTINCT(spot.geohash)) As num,
           LEFT(spot.geohash, 7) As ghash,
           4 As zoom
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING num = 1
       ) as t1;

INSERT INTO spot
(id, title, type, category, geohash, zoom, lat, lng)
  SELECT t1.id, t1.title, t1.type, t1.category, t1.ghash as geohash, zoom, lat, lng
  FROM (
         SELECT
           Min(spot.id) As id,
           Count(DISTINCT(spot.geohash)) As title,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.type)) As type,
           CONCAT('multi,', GROUP_CONCAT(DISTINCT spot.category)) As category,
           LEFT(spot.geohash, 8) As ghash,
           5 As zoom,
           Avg(spot.lat) As lat,
           Avg(spot.lng) As lng
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING title > 1
         ORDER BY title DESC
       ) as t1;

INSERT INTO spot
(id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom)
  SELECT id, type, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4, zoom
  FROM (
         SELECT
           Min(spot.id) As id,
           GROUP_CONCAT(DISTINCT spot.type) as type,
           GROUP_CONCAT(DISTINCT spot.category) as category,
           GROUP_CONCAT(DISTINCT spot.title) as title,
           Min(spot.created) as created,
           Min(spot.changed) as changed,
           Min(description) as description,
           Min(lat) as lat,
           Min(lng) as lng,
           Min(geohash) as geohash,
           Min(p0) as p0,
           Min(p1) as p1,
           Min(p2) as p2,
           Min(p3) as p3,
           Min(p4) as p4,
           Count(DISTINCT(spot.geohash)) As num,
           LEFT(spot.geohash, 8) As ghash,
           5 As zoom
         FROM spot
         WHERE spot.zoom = -1
         GROUP BY ghash
         HAVING num = 1
       ) as t1;
DONE;

try {
    $pdo->exec($sql);
}
catch (PDOException $e)
{
    echo $e->getMessage();
    die();
}

$stmt = $pdo->prepare('SELECT count(id) AS c1, sum(if(zoom = -1, 1, 0)) AS c2 FROM spot');
if ($stmt->execute()) {
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Hinterher: {$row['c1']} Zeilen ({$row['c2']} Nodes)";
    }
}

?>