-- BaniDB subset for the tests: the tables banidb-api reads, with a few Angs of
-- each source, whole shabads for them, four banis, three Amrit Keertan
-- sections, four hukamnamas and some Mahan Kosh words. Taken from the public
-- khalisfoundation/banidb-dev image, with Raag, Writer, Source and Mahan Kosh
-- (missing or older there) from the dev API. Schema as there, adjusted to load
-- on MySQL 8 too.
-- MySQL's init client reads files as latin1 otherwise.
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS banidb DEFAULT CHARACTER SET utf8mb3;
USE banidb;
CREATE TABLE `AKHeaders` (
  `HeaderID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Transliteration` varchar(255) DEFAULT NULL,
  `Gurmukhi` varchar(255) DEFAULT NULL,
  `GurmukhiUni` varchar(255) DEFAULT NULL,
  `Translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `Transliterations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `Updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`HeaderID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `AKIndex` (
  `IndexID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `HeaderID` int(11) NOT NULL,
  `ShabadID` int(11) NOT NULL,
  `VerseID` int(11) DEFAULT NULL,
  `Page` int(11) DEFAULT NULL,
  PRIMARY KEY (`IndexID`),
  KEY `HeaderID` (`HeaderID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `Banis` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Token` varchar(255) NOT NULL,
  `Gurmukhi` varchar(255) NOT NULL,
  `GurmukhiUni` varchar(255) NOT NULL,
  `Translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `Transliterations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `Transliteration` varchar(255) DEFAULT NULL,
  `English` varchar(255) NOT NULL DEFAULT '',
  `Updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Token` (`Token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
CREATE TABLE `Hukamnama` (
  `ID` date NOT NULL,
  `ShabadID` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `MahanKoshDefinitions` (
  `ID` int(11) NOT NULL,
  `DefGurmukhi` longtext DEFAULT NULL,
  `DefGurmukhiUni` longtext DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `MahanKoshWords` (
  `ID` int(11) NOT NULL,
  `Word` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `WordUni` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `FirstLetter` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `FirstLetterUni` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `Definition` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `FirstLetter` (`FirstLetter`),
  KEY `FirstLetterUni` (`FirstLetterUni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `Raag` (
  `RaagID` int(11) NOT NULL,
  `RaagGurmukhi` longtext DEFAULT NULL,
  `RaagUnicode` longtext DEFAULT NULL,
  `RaagEnglish` longtext DEFAULT NULL,
  `RaagWithPage` longtext DEFAULT NULL,
  `Overview` longtext DEFAULT NULL,
  `Advanced` longtext DEFAULT NULL,
  `MusicalComposure` longtext DEFAULT NULL,
  `Root` longtext DEFAULT NULL,
  `Placement` longtext DEFAULT NULL,
  `SourceInfo` longtext DEFAULT NULL,
  `StartTime` longtext DEFAULT NULL,
  `EndTime` longtext DEFAULT NULL,
  `CommonThemes` longtext DEFAULT NULL,
  `Feeling` longtext DEFAULT NULL,
  `Sargun` longtext DEFAULT NULL,
  `Jaati` longtext DEFAULT NULL,
  `Season` longtext DEFAULT NULL,
  `WritersGuru` longtext DEFAULT NULL,
  `WritersBhagat` longtext DEFAULT NULL,
  `Writers` longtext DEFAULT NULL,
  PRIMARY KEY (`RaagID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `Shabad` (
  `VerseID` int(11) NOT NULL,
  `ShabadID` int(11) NOT NULL,
  `Updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ShabadID`,`VerseID`),
  KEY `VerseID` (`VerseID`,`ShabadID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `ShabadName` (
  `ShabadID` int(11) NOT NULL,
  `VerseID` int(11) DEFAULT NULL,
  `Updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ShabadID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `Source` (
  `UniqueID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `SourceID` char(1) NOT NULL,
  `SourceGurmukhi` longtext DEFAULT NULL,
  `SourceUnicode` longtext DEFAULT NULL,
  `SourceEnglish` longtext DEFAULT NULL,
  PRIMARY KEY (`UniqueID`),
  KEY `SourceID` (`SourceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `Verse` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `English` varchar(1024) DEFAULT NULL,
  `Gurmukhi` varchar(512) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,
  `GurmukhiBisram` varchar(256) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,
  `GurmukhiUni` varchar(1024) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,
  `Translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `Transliterations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `WriterID` int(11) DEFAULT NULL,
  `Punjabi` varchar(1024) DEFAULT NULL,
  `PunjabiUni` varchar(1024) DEFAULT NULL,
  `Spanish` varchar(1024) DEFAULT NULL,
  `RaagID` tinyint(3) DEFAULT NULL,
  `PageNo` int(5) DEFAULT NULL,
  `LineNo` int(4) DEFAULT NULL,
  `SourceID` char(1) NOT NULL,
  `FirstLetterStr` varchar(255) DEFAULT NULL,
  `MainLetters` varchar(255) DEFAULT NULL,
  `Bisram` varchar(50) DEFAULT NULL,
  `Visraam` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `igurbani_bisram1` varchar(50) DEFAULT NULL,
  `igurbani_bisram2` varchar(50) DEFAULT NULL,
  `FirstLetterEng` varchar(100) DEFAULT NULL,
  `Transliteration` varchar(512) DEFAULT NULL,
  `Updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `FirstLetterLen` tinyint(1) DEFAULT NULL COMMENT 'GENERATED ALWAYS AS (char_length(FirstLetterEng) > 2) STORED in BaniDB',
  PRIMARY KEY (`ID`),
  KEY `LineNo` (`LineNo`,`Updated`),
  KEY `WriterID` (`WriterID`),
  KEY `ShabadID` (`SourceID`,`PageNo`,`RaagID`,`WriterID`,`Updated`),
  KEY `RaagID` (`RaagID`,`WriterID`),
  KEY `PageNo` (`PageNo`,`RaagID`,`WriterID`,`SourceID`,`Updated`),
  KEY `FirstLetterStr` (`FirstLetterStr`,`SourceID`,`RaagID`,`WriterID`,`FirstLetterLen`),
  KEY `FirstLetterEng` (`FirstLetterEng`,`SourceID`,`RaagID`,`WriterID`,`FirstLetterLen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `Writer` (
  `WriterID` int(11) NOT NULL,
  `WriterEnglish` longtext DEFAULT NULL,
  `WriterGurmukhi` longtext DEFAULT NULL,
  `WriterUnicode` longtext DEFAULT NULL,
  PRIMARY KEY (`WriterID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `maryada_chapters` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `chapter_name` varchar(255) NOT NULL DEFAULT '',
  `chapter_content` longtext DEFAULT NULL,
  `maryada_id` int(11) NOT NULL,
  `alphabet` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `maryada_id` (`maryada_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `maryadas` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `maryada_name` text NOT NULL,
  `alphabet` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `mv_AK_Shabad` (
  `IndexID` int(11) unsigned NOT NULL,
  `HeaderID` int(11) NOT NULL,
  `ShabadID` int(11) NOT NULL,
  `AKPage` int(11) DEFAULT NULL,
  `VerseID` int(11) NOT NULL DEFAULT 0,
  `Gurmukhi` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,
  `Visraam` longtext DEFAULT NULL,
  `MainLetters` text DEFAULT NULL,
  `GurmukhiUni` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,
  `Translations` longtext DEFAULT NULL,
  `Transliterations` longtext DEFAULT NULL,
  `WriterID` int(11) DEFAULT NULL,
  `RaagID` tinyint(3) DEFAULT NULL,
  `PageNo` int(5) DEFAULT NULL,
  `LineNo` int(4) DEFAULT NULL,
  `SourceID` char(1) DEFAULT NULL,
  `MainLine` tinyint(1) NOT NULL DEFAULT 0,
  `Updated` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`IndexID`,`HeaderID`,`ShabadID`,`VerseID`),
  KEY `HeaderID` (`HeaderID`,`MainLine`),
  KEY `VerseID` (`VerseID`),
  KEY `IndexID` (`IndexID`,`VerseID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `mv_Banis_Shabad` (
  `ID` int(11) NOT NULL DEFAULT 0,
  `Bani` int(11) NOT NULL DEFAULT 0,
  `Seq` int(11) NOT NULL DEFAULT 0,
  `Gurmukhi` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,
  `Visraam` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `GurmukhiUni` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL,
  `Translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `WriterID` bigint(11) DEFAULT NULL,
  `RaagID` tinyint(3) DEFAULT NULL,
  `PageNo` int(5) DEFAULT NULL,
  `LineNo` int(4) DEFAULT NULL,
  `SourceID` char(1) DEFAULT NULL,
  `Transliteration` longtext DEFAULT NULL,
  `Transliterations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `header` tinyint(4) NOT NULL DEFAULT 0,
  `MangalPosition` enum('current','above') DEFAULT NULL,
  `existsSGPC` tinyint(1) DEFAULT 1,
  `existsMedium` tinyint(1) DEFAULT 1,
  `existsTaksal` tinyint(1) DEFAULT NULL,
  `existsBuddhaDal` tinyint(1) DEFAULT NULL,
  `Paragraph` int(11) NOT NULL,
  `Updated` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Bani` (`Bani`,`Seq`),
  KEY `Updated` (`Updated`,`Bani`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `tokenized_english` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `verseid` int(11) NOT NULL,
  `token` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`(1000),`verseid`),
  KEY `verseid` (`verseid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `tokenized_firstletters` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `verseid` int(11) NOT NULL,
  `token` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`(1000),`verseid`),
  KEY `verseid` (`verseid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
CREATE TABLE `tokenized_mainletters` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `verseid` int(11) NOT NULL,
  `token` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`(1000),`verseid`),
  KEY `verseid` (`verseid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
