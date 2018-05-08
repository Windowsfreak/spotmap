<?php
header('Content-type: text/html; charset=UTF-8');

$tiles = explode(',', $_REQUEST['tiles']);
$zoom = (int) $_REQUEST['zoom'];

if (count($tiles) == 0) die('[]');

$pdo = new PDO("mysql:host=localhost;dbname=pkorg_map;charset=utf8", 'root');
$base32 = '0123456789bcdefghjkmnpqrstuvwxyz';

$stmt = $pdo->prepare('
    SELECT lat,lng,id,title,p0,type,category FROM spot
    WHERE zoom = :zoom AND geohash >= :geohash1 AND geohash < :geohash2');

$json = [];

foreach ($tiles as $tile) {
    $o = strlen($tile) - 1;
    $tile_end = $tile;
    while ($o >= 0) {
        $p = $tile_end[$o];
        $q = strpos($base32, $p) + 1;
        if ($q > 31) {
            $tile_end[$o] = '0';
            $o = $o - 1;
        } else {
            $tile_end[$o] = $base32[$q];
            break;
        }
    }
    if ($tile_end == '') $tile_end = '~';

    $params = array(':zoom' => $zoom, ':geohash1' => $tile, ':geohash2' => $tile_end);

    if ($stmt->execute($params)) {
        $json[$tile] = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $json[$tile][] = $row;
        }
    }
}
echo json_encode($json, JSON_NUMERIC_CHECK | JSON_PARTIAL_OUTPUT_ON_ERROR);