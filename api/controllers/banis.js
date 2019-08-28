const { createPool } = require('mariadb');
const config = require('../config');
const { getRaag, getSource, getWriter, prepVerse } = require('./getJSON');

const lengthExistsMap = {
  s: 'existsSGPC',
  m: 'existsMedium',
  t: 'existsTaksal',
  b: 'existsBuddhaDal',
};

const pool = createPool(config.mysql);

const error = (err, res) => {
  res.status(400).json({ error: true, data: err });
};

const allColumns = `
b.Gurmukhi AS NameGurmukhi,
b.GurmukhiUni AS NameGurmukhiUni,
b.Transliteration AS NameTransliteration,
v.ID,
v.Gurmukhi,
v.Visraam,
v.GurmukhiUni,
v.Translations,
v.PageNo AS PageNo,
v.LineNo,
v.SourceID,
v.Transliteration,
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
      'SELECT ID, Token as token, Gurmukhi as gurmukhi, GurmukhiUni as gurmukhiUni, Transliteration as transliteration, Updated as updated FROM Banis WHERE ID < 1000 ORDER BY ID ASC';
    const rows = await conn.query(q, []);
    res.json(rows);
  } catch (err) {
    error(err, res);
  } finally {
    if (conn) conn.end();
  }
};

exports.bani = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const BaniID = parseInt(req.params.BaniID, 10);
    const exists = lengthExistsMap[req.query.length] || false;
    let existsQuery = '';
    if (exists) {
      existsQuery = `AND v.${exists} = 1`;
    }
    const q = `SELECT ${allColumns} WHERE v.Bani = ? ${existsQuery} ORDER BY Seq ASC`;
    const rows = await conn.query(q, [BaniID]);
    if (rows && rows.length > 0) {
      const baniInfo = {
        baniID: BaniID,
        gurmukhi: rows[0].NameGurmukhi,
        unicode: rows[0].NameGurmukhiUni,
        english: rows[0].NameTransliteration,
        source: getSource(rows[0]),
        raag: getRaag(rows[0]),
        writer: getWriter(rows[0]),
      };

      const verses = rows.map(row => prepBaniVerse(row, exists));

      res.json({
        baniInfo,
        verses,
      });
    } else {
      const err = 'Bani does not exist';
      throw err;
    }
  } catch (err) {
    error(err, res);
  } finally {
    if (conn) conn.end();
  }
};

const prepBaniVerse = (row, existsFlag) => {
  const verse = prepVerse(row);
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
