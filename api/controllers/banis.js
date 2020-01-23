const { createPool } = require('mariadb');
const config = require('../config');
const lib = require('../lib');

const lengthExistsMap = {
  s: 'existsSGPC',
  m: 'existsMedium',
  t: 'existsTaksal',
  b: 'existsBuddhaDal',
};

const pool = createPool(config.mysql);

const allColumns = `
b.Gurmukhi AS NameGurmukhi,
b.GurmukhiUni AS NameGurmukhiUni,
b.Transliterations AS NameTransliterations,
v.ID,
v.Gurmukhi,
v.Visraam,
v.GurmukhiUni,
v.Translations,
v.PageNo AS PageNo,
v.LineNo,
v.SourceID,
v.Transliterations,
v.WriterID,
w.WriterEnglish,
w.WriterGurmukhi,
w.WriterUnicode,
v.RaagID,
r.RaagGurmukhi,
r.RaagUnicode,
r.RaagEnglish,
r.RaagWithPage,
src.SourceGurmukhi,
src.SourceUnicode,
src.SourceEnglish,
v.header,
v.MangalPosition,
v.existsSGPC,
v.existsMedium,
v.existsTaksal,
v.existsBuddhaDal,
v.Paragraph,
v.Updated
FROM mv_Banis_Shabad v
LEFT JOIN Banis b ON b.ID=v.Bani
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

exports.all = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const q =
      'SELECT ID, Token as token, Gurmukhi as gurmukhi, GurmukhiUni as gurmukhiUni, Transliterations as transliterations, Updated as updated FROM Banis WHERE ID < 1000 ORDER BY ID ASC';
    const rows = await conn.query(q, []);
    res.json(rows.map(banis => lib.prepBanis(banis)));
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

exports.bani = async (req, res) => {
  let conn;
  try {
    const sinceDate = req.query.updatedsince ? lib.isValidDatetime(req.query.updatedsince) : null;
    conn = await pool.getConnection();
    const BaniID = parseInt(req.params.BaniID, 10);
    const exists = lengthExistsMap[req.query.length] || false;
    const parameters = [BaniID];

    let existsQuery = '';
    if (exists) {
      existsQuery = `AND v.${exists} = 1`;
    }
    let sinceQuery = '';
    if (sinceDate) {
      sinceQuery = 'AND v.Updated > ?';
      parameters.push(sinceDate);
    }
    const q = `SELECT ${allColumns} WHERE v.Bani = ? ${sinceQuery} ${existsQuery} ORDER BY Seq ASC`;
    console.log([q, parameters]);
    const rows = await conn.query(q, parameters);
    if (rows && rows.length > 0) {
      const nameTransliterations = JSON.parse(rows[0].NameTransliterations);
      const baniInfo = {
        baniID: BaniID,
        gurmukhi: rows[0].NameGurmukhi,
        unicode: rows[0].NameGurmukhiUni,
        english: nameTransliterations.en,
        hindi: nameTransliterations.hi,
        en: nameTransliterations.en,
        hi: nameTransliterations.hi,
        ipa: nameTransliterations.ipa,
        ur: nameTransliterations.ur,
        source: lib.getSource(rows[0]),
        raag: lib.getRaag(rows[0]),
        writer: lib.getWriter(rows[0]),
      };

      const verses = rows.map(row => prepBaniVerse(row, exists));

      res.json({
        baniInfo,
        verses,
      });
    } else {
      lib.error('Bani does not exist or no updates found for specified Bani.', res, 404, false);
    }
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

const prepBaniVerse = (row, existsFlag) => {
  const verse = lib.prepVerse(row);
  delete verse.firstLetters;
  const exists = {};
  if (!existsFlag) {
    exists.existsSGPC = row.existsSGPC;
    exists.existsMedium = row.existsMedium;
    exists.existsTaksal = row.existsTaksal;
    exists.existsBuddhaDal = row.existsBuddhaDal;
  }
  return {
    header: row.header,
    mangalPosition: row.MangalPosition,
    ...exists,
    paragraph: row.Paragraph,
    verse,
  };
};
