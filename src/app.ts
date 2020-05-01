require('dotenv').config();
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import cacheControl from 'express-cache-controller';
import { createPool } from 'mariadb';
import config from './api/config';
import routes from './api/routes';

const app = express();
const port = process.env.NODE_ENV === 'development' ? '3001' : '3000';

app.locals.pool = createPool(config.mysql as any);

app.use(cors());
app.use(cacheControl({ maxAge: 21600 }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/v2', routes);

app.use((req, res) => {
  res.cacheControl = { noCache: true };
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen(port, () => {
  console.log(`BaniDB API start on port ${port}`);
});

module.exports = app;
