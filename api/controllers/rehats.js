const { createPool } = require('mysql');
const config = require('../config');

const pool = createPool(config.mysql);
const query = pool.query.bind(pool);

exports.all = (req, res) => {
  const q = 'SELECT id as rehatID, maryada_name as rehatName, alphabet FROM maryadas';
  query(
    q,
    [],
    (err, maryadas) => {
      if (err) {
        res.json(err);
      } else {
        res.json({
          count: maryadas.length,
          maryadas,
        });
      }
    },
  );
};

exports.chapterList = (req, res) => {
  const rehatID = parseInt(req.params.RehatID, 10);
  const q = 'SELECT id as chapterID, chapter_name as chapterName, alphabet FROM maryada_chapters WHERE maryada_id = ?';
  query(
    q,
    [rehatID],
    (err, chapters) => {
      res.json({
        count: chapters.length,
        rehatID,
        chapters,
      });
    },
  );
};

exports.chapters = (req, res) => {
  let { RehatID, ChapterID } = req.params;
  let where = '';
  RehatID = parseInt(RehatID, 10);
  const params = [RehatID];
  if (typeof ChapterID !== 'undefined') {
    ChapterID = parseInt(ChapterID, 10);
    if (ChapterID > 0) {
      where = 'AND id = ?';
      params.push(ChapterID);
    }
  }
  const q = `SELECT id as chapterID, chapter_name as chapterName, chapter_content as chapterContent, alphabet FROM maryada_chapters WHERE maryada_id = ? ${where}`;
  query(
    q,
    params,
    (err, chapters) => {
      res.json({
        count: chapters.length,
        rehatID: RehatID,
        chapters,
      });
    },
  );
};

exports.search = (req, res) => {
  const { string } = req.params;
  const q = 'SELECT c.id as chapterID, c.chapter_name as chapterName, c.chapter_content as chapterContent, c.maryada_id as rehatID, m.maryada_name as rehatName FROM maryada_chapters c JOIN maryadas m ON c.maryada_id = m.id WHERE chapter_content LIKE ?';
  query(
    q,
    [`%${string}%`],
    (err, rows) => {
      res.json({
        count: rows.length,
        rows,
      });
    },
  );
};
