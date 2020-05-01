import * as e from 'express';
import lib from '../lib';

export const letter = async (req: e.Request, res: e.Response) => {
  let conn;
  const letter = req.params.Letter;
  if (letter.length !== 1) {
    lib.error(
      'You must supply a single character to see the index for that letter.',
      res,
      422,
      false,
    );
  }
  try {
    conn = await req.app.locals.pool.getConnection();
    const q = `SELECT ID AS id, Word AS word, WordUni AS wordUni
                FROM MahanKoshWords
                WHERE FirstLetter=? OR FirstLetterUni=?
                ORDER BY ID`;
    const rows = await conn.query(q, [letter, letter]);
    res.json(rows);
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

export const word = async (req: e.Request, res: e.Response) => {
  let conn;
  const word = `${req.params.Word}%`;
  try {
    conn = await req.app.locals.pool.getConnection();
    const q = `SELECT w.ID AS id, w.Word AS word, w.WordUni AS wordUni,
                  d.DefGurmukhi AS definition, d.DefGurmukhiUni AS definitionUni
                FROM MahanKoshWords w
                LEFT JOIN MahanKoshDefinitions d ON w.Definition = d.ID
                WHERE w.Word LIKE ? OR w.WordUni LIKE BINARY ?
                ORDER BY w.ID`;
    const rows = await conn.query(q, [word, word]);
    res.json(rows);
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

export const search = async (req: e.Request, res: e.Response) => {
  let conn;
  const query = `%${req.params.query}%`;
  try {
    conn = await req.app.locals.pool.getConnection();
    const q = `SELECT w.ID AS id, w.Word AS word, w.WordUni AS wordUni,
                  d.DefGurmukhi AS definition, d.DefGurmukhiUni AS definitionUni
                FROM MahanKoshWords w
                LEFT JOIN MahanKoshDefinitions d ON w.Definition = d.ID
                WHERE
                  w.Word LIKE ? OR
                  w.WordUni LIKE BINARY ? OR
                  d.DefGurmukhi LIKE ? OR
                  d.DefGurmukhiUni LIKE BINARY ?
                ORDER BY w.ID`;
    const rows = await conn.query(q, [query, query, query, query]);
    res.json(rows);
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};
