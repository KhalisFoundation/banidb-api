const { createPool } = require('mariadb');
const config = require('../config');
const lib = require('../lib');

exports.db = async (req, res) => {
  let conn;
  try {
    const pool = createPool({ ...config.mysql, connectTimeout: 3000 });
    conn = await pool.getConnection();
    const q = `SELECT 1 as ok FROM Verse WHERE ID=1 LIMIT 1`;
    const rows = await conn.query(q);
    rows[0].ok = rows[0].ok === 1;
    res.json(rows[0]);
  } catch (err) {
    lib.error(err, res, 500, false);
  } finally {
    if (conn) {
      conn.end();
    }
  }
};
