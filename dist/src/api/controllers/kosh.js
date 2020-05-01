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
exports.letter = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    const letter = req.params.Letter;
    if (letter.length !== 1) {
      lib_1.default.error(
        'You must supply a single character to see the index for that letter.',
        res,
        422,
        false,
      );
    }
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q = `SELECT ID AS id, Word AS word, WordUni AS wordUni
                FROM MahanKoshWords
                WHERE FirstLetter=? OR FirstLetterUni=?
                ORDER BY ID`;
      const rows = yield conn.query(q, [letter, letter]);
      res.json(rows);
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.word = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    const word = `${req.params.Word}%`;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q = `SELECT w.ID AS id, w.Word AS word, w.WordUni AS wordUni,
                  d.DefGurmukhi AS definition, d.DefGurmukhiUni AS definitionUni
                FROM MahanKoshWords w
                LEFT JOIN MahanKoshDefinitions d ON w.Definition = d.ID
                WHERE w.Word LIKE ? OR w.WordUni LIKE BINARY ?
                ORDER BY w.ID`;
      const rows = yield conn.query(q, [word, word]);
      res.json(rows);
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.search = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    const query = `%${req.params.query}%`;
    try {
      conn = yield req.app.locals.pool.getConnection();
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
      const rows = yield conn.query(q, [query, query, query, query]);
      res.json(rows);
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
