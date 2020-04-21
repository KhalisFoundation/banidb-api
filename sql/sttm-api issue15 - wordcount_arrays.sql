create or replace view v_Ceremonies_Shabad as
SELECT
  `cs`.`ID` AS `ID`,
  `cs`.`Ceremony` AS `Ceremony`,
  `cs`.`Seq` AS `Seq`,
  ifnull(`v`.`English`, ifnull(`cc`.`English`, (
        SELECT
          group_concat(`vs`.`English` separator ' ')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `English`,
  ifnull(`v`.`Translations`, ifnull(`cc`.`Translations`, (
        SELECT
          concat('[', group_concat(`vs`.`Translations` separator ','), ']')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `Translations`,
  ifnull(`v`.`Gurmukhi`, ifnull(`cc`.`Gurmukhi`, (
        SELECT
          group_concat(`vs`.`Gurmukhi` separator ' ')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `Gurmukhi`,
  concat('[',ifnull(wordcount(`v`.`Gurmukhi`), ifnull(wordcount(`cc`.`Gurmukhi`), (
        SELECT
          group_concat(wordcount(`vs`.`Gurmukhi`) separator ',')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))), ']') AS `WordCount`,
  concat('[', ifnull(`v`.`Visraam`, ifnull(`cc`.`Visraam`, (
          SELECT
            group_concat(`vs`.`Visraam` separator ',')
            FROM `khajana_khajana`.`Verse` `vs`
          WHERE
            `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
            AND `cs`.`VerseIDRangeEnd`
          GROUP BY
            `cs`.`ID`))), ']') AS `Visraam`,
  ifnull(`v`.`GurmukhiUni`, ifnull(`cc`.`GurmukhiUni`, (
        SELECT
          group_concat(`vs`.`GurmukhiUni` separator ' ')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `GurmukhiUni`,
  ifnull(`v`.`WriterID`, ifnull(`cc`.`WriterID`, (
        SELECT
          `vs`.`WriterID` FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` = `cs`.`VerseIDRangeStart`))) AS `WriterID`, ifnull(`v`.`Punjabi`, ifnull(`cc`.`Punjabi`, (
        SELECT
          group_concat(`vs`.`Punjabi` separator ' ')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `Punjabi`, ifnull(`v`.`PunjabiUni`, ifnull(`cc`.`PunjabiUni`, (
        SELECT
          group_concat(`vs`.`PunjabiUni` separator ' ')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `PunjabiUni`, ifnull(`v`.`Spanish`, ifnull(`cc`.`Spanish`, (
        SELECT
          group_concat(`vs`.`Spanish` separator ' ')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `Spanish`, `v`.`RaagID` AS `RaagID`, `v`.`PageNo` AS `PageNo`, `v`.`LineNo` AS `LineNo`, `v`.`SourceID` AS `SourceID`, ifnull(`v`.`Transliteration`, ifnull(`cc`.`Transliteration`, (
        SELECT
          group_concat(`vs`.`Transliteration` separator ' ')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `Transliteration`, ifnull(`v`.`Transliterations`, ifnull(`cc`.`Transliterations`, (
        SELECT
          concat('[', group_concat(`vs`.`Transliterations` separator ','), ']')
          FROM `khajana_khajana`.`Verse` `vs`
        WHERE
          `vs`.`ID` BETWEEN `cs`.`VerseIDRangeStart`
          AND `cs`.`VerseIDRangeEnd`
        GROUP BY
          `cs`.`ID`))) AS `Transliterations`, greatest(`v`.`Updated`, `cs`.`Updated`, `cc`.`Updated`) AS `Updated`
FROM ((`khajana_khajana`.`Ceremonies_Shabad` `cs`
  LEFT JOIN `khajana_khajana`.`Verse` `v` ON (`v`.`ID` = `cs`.`VerseID`))
  LEFT JOIN `khajana_khajana`.`Ceremonies_Custom` `cc` ON (`cc`.`ID` = `cs`.`Custom`))
ORDER BY
  `cs`.`Ceremony`,
  `cs`.`Seq`;


ALTER TABLE mv_Ceremonies_Shabad ADD COLUMN WordCount VARCHAR(128) AFTER Gurmukhi;

REPLACE INTO mv_Ceremonies_Shabad SELECT * FROM v_Ceremonies_Shabad;


