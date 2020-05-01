import * as e from 'express';
import lib from '../lib';

export const all = async (req: e.Request, res: e.Response) => {
  let conn;

  try {
    conn = await req.app.locals.pool.getConnection();
    const q = 'SELECT id as rehatID, maryada_name as rehatName, alphabet FROM maryadas';
    const maryadas = await conn.query(q, []);
    res.json({
      count: maryadas.length,
      maryadas,
    });
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

export const chapterList = async (req: e.Request, res: e.Response) => {
  let conn;
  try {
    conn = await req.app.locals.pool.getConnection();
    const rehatID = parseInt(req.params.RehatID, 10);
    const q =
      'SELECT id as chapterID, chapter_name as chapterName, alphabet FROM maryada_chapters WHERE maryada_id = ?';
    const chapters = await conn.query(q, [rehatID]);
    res.json({
      count: chapters.length,
      rehatID,
      chapters,
    });
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

export const chapters = async (req: e.Request, res: e.Response) => {
  let { RehatID, ChapterID } = req.params;
  let where = '';
  RehatID = parseInt(RehatID, 10) as any;
  const params = [RehatID];
  if (typeof ChapterID !== 'undefined') {
    ChapterID = parseInt(ChapterID, 10) as any;
    if ((ChapterID as any) > 0) {
      where = 'AND id = ?';
      params.push(ChapterID);
    }
  }
  let conn;
  try {
    conn = await req.app.locals.pool.getConnection();
    const q = `SELECT id as chapterID, chapter_name as chapterName, chapter_content as chapterContent, alphabet FROM maryada_chapters WHERE maryada_id = ? ${where}`;
    const chapters = await conn.query(q, params);
    res.json({
      count: chapters.length,
      rehatID: RehatID,
      chapters,
    });
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

export const search = async (req: e.Request, res: e.Response) => {
  let conn;
  try {
    conn = await req.app.locals.pool.getConnection();
    const { string } = req.params;
    const q =
      'SELECT c.id as chapterID, c.chapter_name as chapterName, c.chapter_content as chapterContent, c.maryada_id as rehatID, m.maryada_name as rehatName FROM maryada_chapters c JOIN maryadas m ON c.maryada_id = m.id WHERE chapter_content LIKE ?';
    const rows = await conn.query(q, [`%${string}%`]);
    res.json({
      count: rows.length,
      rows,
    });
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};
