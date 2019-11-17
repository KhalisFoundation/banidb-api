const { createPool } = require('mariadb');
const config = require('../config');
const { getRaag, getSource, getWriter, prepVerse, prepAKIndex } = require('./getJSON');

const pool = createPool(config.mysql);

const error = (err, res) => {
  res.status(400).json({ error: true, data: err });
};

const allColumns = `
aki.IndexID,
aki.HeaderID,
aki.ShabadID,
v.VerseID,
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
v.Updated
FROM mv_AK_Shabad v
LEFT JOIN AKIndex aki USING(IndexID)
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

const allIndexColumns = `
b.IndexID,
b.HeaderID,
b.ShabadID,
b.Page as PageNo,
v.Gurmukhi,
v.Visraam,
v.GurmukhiUni,
v.Translations,
v.PageNo AS Ang,
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
v.Updated
FROM AKIndex b
LEFT JOIN Verse v ON b.VerseID=v.ID
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

exports.headers = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const q =
      'SELECT HeaderID, Gurmukhi, GurmukhiUni, Translations, Transliterations, Updated FROM AKHeaders ORDER BY HeaderID ASC';
    const rows = await conn.query(q, []);
    res.json({
      headers: rows.map(items => prepAKIndex(items)),
    });
  } catch (err) {
    error(err, res);
  } finally {
    if (conn) conn.end();
  }
};

exports.index = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    let headerID = -1;
    let header = '';
    let out = {};
    if (req.params.HeaderID) {
      headerID = parseInt(req.params.HeaderID, 10);
      header = 'WHERE b.headerID = ?';
      out.header = await getHeaderInfo(headerID, conn);
    }
    const q = `SELECT ${allIndexColumns} ${header} ORDER BY IndexID ASC`;
    const rows = await conn.query(q, [headerID]);
    out.index = rows.map(items => prepAKIndex(items));
    res.json(out);
  } catch (err) {
    error(err, res);
  } finally {
    if (conn) conn.end();
  }
};

exports.shabad = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const ShabadID = parseInt(req.params.ShabadID, 10);
    const q = `SELECT ${allColumns} WHERE v.IndexID = ?`;
    const rows = await conn.query(q, [ShabadID]);

    if (rows && rows.length > 0) {
      const header = await getHeaderInfo(rows[0].HeaderID, conn);
      const verses = rows.map(row => prepVerse(row));

      res.json({
        header,
        verses,
      });
    } else {
      const err = 'Shabad does not exist';
      throw err;
    }
  } catch (err) {
    error(err, res);
  } finally {
    if (conn) conn.end();
  }
};

const getHeaderInfo = async (headerID, conn) => {
  try {
    const q =
      'SELECT HeaderID, Gurmukhi, GurmukhiUni, Translations, Transliterations, Updated FROM AKHeaders WHERE HeaderID = ? ORDER BY HeaderID ASC';
    const row = await conn.query(q, [headerID]);
    return row.map(items => prepAKIndex(items));
  } catch (err) {
    error(err, res);
  } finally {
    if (conn) conn.end();
  }
};
