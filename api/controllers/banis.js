const { createPool } = require('mysql');
const config = require('../config');
const {
  prepVerse,
  getSource,
  getRaag,
  getWriter,
} = require('./getJSON');

const pool = createPool(config.mysql);
const query = pool.query.bind(pool);

const allColumns = `b.Gurmukhi AS NameGurmukhi,
  b.GurmukhiUni AS NameGurmukhiUni, b.Transliteration AS NameTransliteration,
  v.Gurmukhi, v.GurmukhiUni, v.English, v.Punjabi,
  v.PunjabiUni, v.Spanish, v.PageNo AS PageNo, v.LineNo,
  v.SourceID, v.Bisram, v.igurbani_bisram1, v.igurbani_bisram2,
  v.Transliteration, v.WriterID, w.WriterEnglish,
  w.WriterGurmukhi, w.WriterUnicode, v.RaagID, r.RaagGurmukhi,
  r.RaagUnicode, r.RaagEnglish, r.RaagWithPage, src.SourceGurmukhi,
  src.SourceUnicode, src.SourceEnglish, v.header, v.MangalPosition,
  v.existsStandard, v.existsTaksal, v.existsBuddhaDal, v.Paragraph,
  v.Updated
FROM mv_Banis_Shabad v
LEFT JOIN Banis b ON b.ID=v.Bani
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

exports.all = (req, res) => {
  const q = 'SELECT ID, Token as token, Gurmukhi as gurmukhi, GurmukhiUni as gurmukhiUni, Transliteration as transliteration, Updated as updated FROM Banis WHERE ID < 1000 ORDER BY ID ASC';
  query(
    q,
    [],
    (err, rows) => {
      res.json(rows);
    },
  );
};

exports.bani = (req, res) => {
  const BaniID = parseInt(req.params.BaniID, 10);
  const q = `SELECT ${allColumns} WHERE v.Bani = ? ORDER BY Seq ASC`;
  query(
    q,
    [BaniID],
    (err, rows) => {
      const baniInfo = {
        baniID: BaniID,
        gurmukhi: rows[0].NameGurmukhi,
        unicode: rows[0].NameGurmukhiUni,
        english: rows[0].NameTransliteration,
        source: getSource(rows[0]),
        raag: getRaag(rows[0]),
        writer: getWriter(rows[0]),
      };

      const verses = rows.map(prepBaniVerse);

      res.json({
        baniInfo,
        verses,
      });
    },
  );
};

function prepBaniVerse(row) {
  const verse = prepVerse(row);
  delete verse.firstLetters;
  return Object.assign(verse, {
    header: row.header,
    mangalPosition: row.MangalPosition,
    existsStandard: row.existsStandard,
    existsTaksal: row.existsTaksal,
    existsBuddhaDal: row.existsBuddhaDal,
    paragraph: row.Paragraph,
  });
}
