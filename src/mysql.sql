/*id	title	created	changed	category	lat	lng	geohash	description	p0 p1 p2 p3 p4 country

node.nid = id = 3059 : int(10)
node.type = spot : varchar(32)
node.title = title : varchar(255)
node.created = created : int(11)
node.changed = changed : int(11)
node__body.entity_id = 3059
node__body.body_value = description : longtext
node__body.body_format : varchar(255>16) full_html/filtered_html
node__field_images.entity_id = 3059
node__field_images.delta < 5 : int(10)
node__field_images.field_images_target_id = 7907 : int(10)>varchar(100)
node__field_location.entity_id = 3059
node__field_location.field_location_lat = lat = 48.18 : decimal(18, 12)
node__field_location.field_location_lon = lng = 11.55 : decimal(18, 12)
node__field_location.ST_GeoHash(field_location_lon, field_location_lat, 16) = geohash = u284ng : varchar(16)
node__field_spot_type.entity_id = 3059
node__field_spot_type.field_spot_type_value = outdoor : varchar(255>16)
file_managed.fid = 7000
file_managed.filename = cimg2950.jpg
file_managed.uri = public://images/spots/cimg2950.jpg > /var/www/vhosts/parkour.org/httpdocs/sites/default/files/images/spots
> http://www.parkour.org/sites/default/files/images/spots/s1260048.jpg
> http://www.parkour.org/sites/default/files/styles/teaserfoto_150px/public/images/spots/s1260048.jpg*/

/*CREATE TABLE `spot` (
  `id` int(10) NOT NULL,
  `category` varchar(16) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `lat` decimal(18,12) NOT NULL,
  `lng` decimal(18,12) NOT NULL,
  `geohash` varchar(16) NOT NULL,
  `p0` varchar(100) NOT NULL,
  `p1` varchar(100) NOT NULL,
  `p2` varchar(100) NOT NULL,
  `p3` varchar(100) NOT NULL,
  `p4` varchar(100) NOT NULL,
  `description` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `spot`
ADD PRIMARY KEY (`id`),
ADD KEY `category` (`category`),
ADD KEY `created` (`created`),
ADD KEY `changed` (`changed`),
ADD KEY `lat` (`lat`),
ADD KEY `lng` (`lng`),
ADD KEY `geohash` (`geohash`);*/

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE `spot` (
  `id` int(10) NOT NULL,
  `type` varchar(31) NOT NULL,
  `category` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `lat` decimal(18,12) NOT NULL,
  `lng` decimal(18,12) NOT NULL,
  `geohash` varchar(16) NOT NULL,
  `zoom` tinyint(4) NOT NULL DEFAULT '-1',
  `p0` varchar(100) NOT NULL,
  `p1` varchar(100) NOT NULL,
  `p2` varchar(100) NOT NULL,
  `p3` varchar(100) NOT NULL,
  `p4` varchar(100) NOT NULL,
  `description` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ALTER TABLE `spot` ADD `type` VARCHAR(31) NOT NULL AFTER `id`;
-- ALTER TABLE `spot`
--  CHANGE COLUMN `category` `category` VARCHAR(255) NOT NULL AFTER `id`;


ALTER TABLE `spot`
ADD PRIMARY KEY(`zoom`,`id`),
ADD KEY `category` (`category`),
ADD KEY `created` (`created`),
ADD KEY `changed` (`changed`),
ADD KEY `lat` (`lat`),
ADD KEY `lng` (`lng`),
ADD KEY `geohash` (`geohash`),
ADD KEY `filter` (`zoom`,`geohash`);

DELETE FROM spot WHERE spot.zoom = -1 AND spot.id NOT IN (
  SELECT node.nid AS id
  FROM node
);

INSERT INTO
    spot
    (id, `type`, category, title, created, changed, description, lat, lng, geohash, p0, p1, p2, p3, p4)
SELECT
    node.nid AS id, node.type, COALESCE(field_spot_type_value, COALESCE(field_group_type_value, field_event_type_value)) as category, node_field_data.title, node_field_data.created, node_field_data.changed, body_value as description,
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

-- ALTER TABLE `spot` ADD `zoom` TINYINT NOT NULL DEFAULT '-1' AFTER `geohash`;

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
    spot.description = body_value
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

-- SELECT lat,lng,id,title,p0 INTO OUTFILE 'c:/software/spots.csv'
-- FIELDS TERMINATED BY ';' OPTIONALLY ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- FROM spot;

DELETE FROM `spot` WHERE geohash = '';

DELETE FROM `spot` WHERE zoom > -1;

/*SELECT Count(id) As CID, Left(geohash, 5) As CGH FROM `spot` GROUP BY CGH Having CID > 1 ORDER BY CID DESC;*/

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