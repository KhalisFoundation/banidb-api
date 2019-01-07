const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./api/routes');
const makeGQL = require('./graphql');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/v2', routes);

const gqlServer = makeGQL(app);

app.use((req, res) => {
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen({ port }, () => {
  const gqlPath = `http://localhost:${port}${gqlServer.graphqlPath}`;

  console.log(`BaniDB API server started on http://localhost:${port}`);
  console.log(`GraphQL server on ${gqlPath}`);
});

module.exports = app;
