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
exports.db = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    res.json('working');
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q = `SELECT 1 as ok FROM Verse WHERE ID=1 LIMIT 1`;
      const rows = yield conn.query(q);
      rows[0].ok = rows[0].ok === 1;
      res.json(rows[0]);
    } catch (err) {
      lib_1.default.error(err, res, 500, false);
    } finally {
      if (conn) {
        conn.end();
      }
    }
  });
