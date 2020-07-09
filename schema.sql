-- (automatically) set in grafana dashboard
-- SET TIME_ZONE = 'Europe/Vienna';

-- done using env vars, UNCOMMENT IF YOU ARE NOT USING the
-- docker image with the env var
-- CREATE DATABASE `measurements`;
USE `measurements`;

CREATE TABLE `speedtest`
(
  `timestamp` timestamp NOT NULL,
  `latency` float
(53) DEFAULT NULL COMMENT 'latency in milliseconds',
  `download` float
(53) DEFAULT NULL COMMENT 'download speed in mbps',
  `upload` float
(53) DEFAULT NULL COMMENT 'upload speed in mbps',
  `server` varchar
(200) DEFAULT NULL COMMENT 'server used for testing',
  PRIMARY KEY
(`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `fast`
(
  `timestamp` timestamp NOT NULL,
  `download` float
(53) DEFAULT NULL COMMENT 'download speed in mbps',
  `upload` float
(53) DEFAULT NULL COMMENT 'upload speed in mbps',
  PRIMARY KEY
(`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- create a read only user for grafana
CREATE USER 'grafanaReader'@'%' IDENTIFIED
WITH mysql_native_password BY 'readOnly';
GRANT SELECT ON `measurements`.* TO 'grafanaReader'@'%';
FLUSH PRIVILEGES;