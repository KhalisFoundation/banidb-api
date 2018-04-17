const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./api/routes');

const app = express();
const port = process.env.PORT || 3000;

app.use('/v2', routes);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res) => {
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen(port, () => {
  console.log(`BaniDB API start on port ${port}`);
});

module.exports = app;
