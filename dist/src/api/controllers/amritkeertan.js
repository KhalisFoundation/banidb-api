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
exports.headers = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q =
        'SELECT HeaderID, Gurmukhi, GurmukhiUni, Translations, Transliterations, Updated FROM AKHeaders ORDER BY HeaderID ASC';
      const rows = yield conn.query(q, []);
      res.json({
        headers: rows.map(items => lib_1.default.prepAKIndex(items)),
      });
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.index = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    const sinceDate = req.query.updatedsince
      ? lib_1.default.isValidDatetime(req.query.updatedsince)
      : null;
    try {
      conn = yield req.app.locals.pool.getConnection();
      let headerID = -1;
      let header = '';
      const out = {};
      const parameters = [];
      if (req.params.HeaderID) {
        headerID = parseInt(req.params.HeaderID, 10);
        header = 'AND b.headerID = ?';
        parameters.push(headerID);
        out.header = yield getHeaderInfo(headerID, conn, res);
      }
      let sinceQuery = '';
      if (sinceDate) {
        sinceQuery = 'AND v.Updated > ?';
        parameters.push(sinceDate);
      }
      const q = `SELECT ${allIndexColumns} WHERE 1 ${header} ${sinceQuery} ORDER BY IndexID ASC`;
      const rows = yield conn.query(q, parameters);
      out.index = rows.map(items => lib_1.default.prepAKIndex(items));
      res.json(out);
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.shabad = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    try {
      const sinceDate = req.query.updatedsince
        ? lib_1.default.isValidDatetime(req.query.updatedsince)
        : null;
      conn = yield req.app.locals.pool.getConnection();
      const ShabadID = parseInt(req.params.ShabadID, 10);
      const parameters = [ShabadID];
      let sinceQuery = '';
      if (sinceDate) {
        sinceQuery = 'AND v.Updated > ?';
        parameters.push(sinceDate);
      }
      const q = `SELECT ${allColumns} WHERE v.IndexID = ? ${sinceQuery}`;
      const rows = yield conn.query(q, parameters);
      if (rows && rows.length > 0) {
        const header = yield getHeaderInfo(rows[0].HeaderID, conn);
        const verses = rows.map(row => lib_1.default.prepVerse(row));
        res.json({
          header,
          verses,
        });
      } else {
        lib_1.default.error('Shabad does not exist or has no updates.', res, 404, false);
      }
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
// eslint-disable-next-line consistent-return
const getHeaderInfo = (headerID, conn, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    try {
      const q =
        'SELECT HeaderID, Gurmukhi, GurmukhiUni, Translations, Transliterations, Updated FROM AKHeaders WHERE HeaderID = ? ORDER BY HeaderID ASC';
      const row = yield conn.query(q, [headerID]);
      return row.map(items => lib_1.default.prepAKIndex(items));
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
