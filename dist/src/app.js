'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
require('dotenv').config();
const body_parser_1 = __importDefault(require('body-parser'));
const cors_1 = __importDefault(require('cors'));
const express_1 = __importDefault(require('express'));
const express_cache_controller_1 = __importDefault(require('express-cache-controller'));
const mariadb_1 = require('mariadb');
const config_1 = __importDefault(require('./api/config'));
const routes_1 = __importDefault(require('./api/routes'));
const app = express_1.default();
const port = process.env.NODE_ENV === 'development' ? '3001' : '3000';
app.locals.pool = mariadb_1.createPool(config_1.default.mysql);
app.use(cors_1.default());
app.use(express_cache_controller_1.default({ maxAge: 21600 }));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use('/v2', routes_1.default);
app.use((req, res) => {
  res.cacheControl = { noCache: true };
  res.status(404).send({ url: `${req.originalUrl} not found` });
});
app.listen(port, () => {
  console.log(`BaniDB API start on port ${port}`);
});
module.exports = app;
