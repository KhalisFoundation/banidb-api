'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const lib_1 = __importDefault(require('../lib'));
exports.all = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q = 'SELECT id as rehatID, maryada_name as rehatName, alphabet FROM maryadas';
      const maryadas = yield conn.query(q, []);
      res.json({
        count: maryadas.length,
        maryadas,
      });
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.chapterList = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const rehatID = parseInt(req.params.RehatID, 10);
      const q =
        'SELECT id as chapterID, chapter_name as chapterName, alphabet FROM maryada_chapters WHERE maryada_id = ?';
      const chapters = yield conn.query(q, [rehatID]);
      res.json({
        count: chapters.length,
        rehatID,
        chapters,
      });
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.chapters = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
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
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q = `SELECT id as chapterID, chapter_name as chapterName, chapter_content as chapterContent, alphabet FROM maryada_chapters WHERE maryada_id = ? ${where}`;
      const chapters = yield conn.query(q, params);
      res.json({
        count: chapters.length,
        rehatID: RehatID,
        chapters,
      });
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.search = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const { string } = req.params;
      const q =
        'SELECT c.id as chapterID, c.chapter_name as chapterName, c.chapter_content as chapterContent, c.maryada_id as rehatID, m.maryada_name as rehatName FROM maryada_chapters c JOIN maryadas m ON c.maryada_id = m.id WHERE chapter_content LIKE ?';
      const rows = yield conn.query(q, [`%${string}%`]);
      res.json({
        count: rows.length,
        rows,
      });
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
