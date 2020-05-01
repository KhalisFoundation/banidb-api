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
const lengthExistsMap = {
  s: 'existsSGPC',
  m: 'existsMedium',
  t: 'existsTaksal',
  b: 'existsBuddhaDal',
};
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
exports.all = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q =
        'SELECT ID, Token as token, Gurmukhi as gurmukhi, GurmukhiUni as gurmukhiUni, Transliterations as transliterations, Updated as updated FROM Banis WHERE ID < 1000 ORDER BY ID ASC';
      const rows = yield conn.query(q, []);
      res.json(rows.map(banis => lib_1.default.prepBanis(banis)));
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.bani = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    try {
      const sinceDate = req.query.updatedsince
        ? lib_1.default.isValidDatetime(req.query.updatedsince)
        : null;
      conn = yield req.app.locals.pool.getConnection();
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
      const rows = yield conn.query(q, parameters);
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
          source: lib_1.default.getSource(rows[0]),
          raag: lib_1.default.getRaag(rows[0]),
          writer: lib_1.default.getWriter(rows[0]),
        };
        const verses = rows.map(row => prepBaniVerse(row, exists));
        res.json({
          baniInfo,
          verses,
        });
      } else {
        lib_1.default.error(
          'Bani does not exist or no updates found for specified Bani.',
          res,
          404,
          false,
        );
      }
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
const prepBaniVerse = (row, existsFlag) => {
  const verse = lib_1.default.prepVerse(row);
  delete verse.firstLetters;
  const exists = {};
  if (!existsFlag) {
    exists.existsSGPC = row.existsSGPC;
    exists.existsMedium = row.existsMedium;
    exists.existsTaksal = row.existsTaksal;
    exists.existsBuddhaDal = row.existsBuddhaDal;
  }
  return Object.assign(
    Object.assign({ header: row.header, mangalPosition: row.MangalPosition }, exists),
    { paragraph: row.Paragraph, verse },
  );
};
