CREATE DATABASE /*!32312 IF NOT EXISTS*/ `conference` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `conference`;
DROP TABLE IF EXISTS `guests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guests` (
  `id` int(32) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `state` enum('open','paid') NOT NULL,
  `price` decimal(9,2) NOT NULL,
  `hotel` varchar(32) NOT NULL,
  `address` varchar(128) NOT NULL,
  `telephone` varchar(16) NOT NULL,
  `email` varchar(255) NOT NULL,
  `remark` text NOT NULL,
  `partnerName` varchar(64) NOT NULL,
  `partnerAddress` varchar(128) NOT NULL,
  `partner` varchar(32) NOT NULL,
  `editHash` varchar(32) NOT NULL,
  `presentationTitle` varchar(255) NOT NULL DEFAULT '',
  `presentationLength` varchar(64) NOT NULL DEFAULT '',
  `presentationDescription` text NOT NULL,
  `extraDays` varchar(255) NOT NULL,
  `vip` tinyint(1) NOT NULL,
  `helping` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `presentations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `presentations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `session` int(11) NOT NULL,
  `number` int(11) NOT NULL,
  `minutes` int(11) NOT NULL,
  `guest` int(11) NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `onAir` tinyint(1) NOT NULL DEFAULT 1,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `previousSession` int(11) NOT NULL,
  `pauseBefore` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

