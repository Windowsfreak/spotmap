<?php

header('Content-type: text/html; charset=UTF-8');

/**
 * Created by PhpStorm.
 * User: lazer
 * Date: 30.01.2016
 * Time: 13:00
 */
$pdo = new PDO("mysql:host=localhost;dbname=pkorgd8;charset=utf8", 'root');

$lat_l = (double) $_REQUEST['latl'];
$lat_h = (double) $_REQUEST['lath'];
$lng_l = (double) $_REQUEST['lngl'];
$lng_h = (double) $_REQUEST['lngh'];
//$zoom = (int) $_REQUEST['zoom'];
$zx = min($lat_h - $lat_l, $lng_h - $lng_l);
//echo $zx;
if ($zx > 23) {
    $zoom = 0;
} else if ($zx > 2.8) {
    $zoom = 1;
} else if ($zx > 0.7) {
    $zoom = 2;
} else if ($zx > 0.087) {
    $zoom = 3;
} else if ($zx > 0.022) {
    $zoom = 4;
} else if ($zx > 0.0027) {
    $zoom = 5;
} else {
    $zoom = 6;
}
//$zoom = $zx;
if ($zoom > 5 || $zoom < 0) $zoom = -1;

if ($lat_l === null || $lat_h === null || $lng_l === null || $lng_h === null) die('Missing parameters.');

require 'Geohash.php';

$geo_l = Geohash::encode($lat_l, $lng_l);
$geo_h = Geohash::encode($lat_h, $lng_h);

$len = strspn($geo_l ^ $geo_h, "\0");
if ($len == -1) $len = strlen($geo_l);

$geo1 = substr($geo_l, 0, $len);
$geo2 = $geo1;
// find $geo2, which is $geo1 lexically increased by 1 for indexed search.
$o = $len - 1;
while ($o >= 0) {
    $p = $geo2[$o];
    $q = strpos(Geohash::$base32, $p) + 1;
    if ($q > 31) {
        $geo2[$o] = '0';
        $o = $o - 1;
    } else {
        $geo2[$o] = Geohash::$base32[$q];
        break;
    }
}

if ($geo2 == '') $geo2 = '~';

$params = array(':zoom' => $zoom, ':geohash1' => $geo1, ':geohash2' => $geo2, ':latl' => $lat_l, ':lath' => $lat_h, ':lngl' => $lng_l, ':lngh' => $lng_h);

$stmt = $pdo->prepare('
    SELECT lat,lng,id,title,p0,category FROM spot
    WHERE zoom = :zoom AND geohash >= :geohash1 AND geohash < :geohash2 AND lat >= :latl AND lat <= :lath AND lng >= :lngl AND lng <= :lngh;');

if ($stmt->execute($params)) {
    $json = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $json[] = $row;
    }
    echo json_encode($json, JSON_NUMERIC_CHECK | JSON_PARTIAL_OUTPUT_ON_ERROR);
}


//SELECT Count(id) As CID, Left(geohash, 5) As CGH FROM `spot` GROUP BY CGH Having CID > 1 ORDER BY CID DESC;
//SELECT Count(id) As Num, Left(geohash, 3) As geohash FROM `spot` GROUP BY geohash ORDER BY Num DESC