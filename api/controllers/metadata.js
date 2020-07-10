const lib = require('../lib');

exports.writers = async (req, res) => {
  let conn;
  try {
    conn = await req.app.locals.pool.getConnection();

    const q = 'SELECT * FROM Writer ORDER BY WriterID';

    const rows = await conn.query(q);

    res.json({
      rows,
    });
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

exports.raags = async (req, res) => {
  let conn;
  try {
    conn = await req.app.locals.pool.getConnection();

    const q = 'SELECT * FROM Raag ORDER BY RaagID';

    const rows = await conn.query(q);

    res.json({
      rows,
    });
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};

exports.sources = async (req, res) => {
  let conn;
  try {
    conn = await req.app.locals.pool.getConnection();

    const q = 'SELECT * FROM Source ORDER BY SourceID';

    const rows = await conn.query(q);

    res.json({
      rows,
    });
  } catch (err) {
    lib.error(err, res, 500);
  } finally {
    if (conn) conn.end();
  }
};
