const lib = require('../lib');

exports.letter = async (req, res) => {
  let conn;
  const letter = req.params.Letter;
  if (letter.length !== 1) {
    lib.error(
      'You must supply a single character to see the index for that letter.',
      res,
      413,
      false,
    );
  }
  try {
    conn = await req.app.locals.pool.getConnection();
    const q = `SELECT ID AS id, Word AS word, WordUni AS wordUni
                FROM MahanKoshWords
                WHERE FirstLetter='${letter}' OR FirstLetterUni='${letter}'
                ORDER BY ID`;
    const rows = await conn.query(q, []);
    res.json(rows);
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

exports.word = async (req, res) => {
  let conn;
  const word = req.params.Word;
  try {
    conn = await req.app.locals.pool.getConnection();
    const q = `SELECT w.ID AS id, w.Word AS word, w.WordUni AS wordUni,
                  d.DefGurmukhi AS definition, d.DefGurmukhiUni AS definitionUni
                FROM MahanKoshWords w
                LEFT JOIN MahanKoshDefinitions d ON w.Definition = d.ID
                WHERE w.Word LIKE '${word}%' OR w.WordUni LIKE BINARY '${word}%'
                ORDER BY w.ID`;
    const rows = await conn.query(q, []);
    res.json(rows);
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

exports.search = async (req, res) => {
  let conn;
  const { query } = req.params;
  try {
    conn = await req.app.locals.pool.getConnection();
    const q = `SELECT w.ID AS id, w.Word AS word, w.WordUni AS wordUni,
                  d.DefGurmukhi AS definition, d.DefGurmukhiUni AS definitionUni
                FROM MahanKoshWords w
                LEFT JOIN MahanKoshDefinitions d ON w.Definition = d.ID
                WHERE
                  w.Word LIKE '%${query}%' OR
                  w.WordUni LIKE BINARY '%${query}%' OR
                  d.DefGurmukhi LIKE '%${query}%' OR
                  d.DefGurmukhiUni LIKE BINARY '%${query}%'
                ORDER BY w.ID`;
    const rows = await conn.query(q, []);
    res.json(rows);
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};
