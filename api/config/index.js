const metadata = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.NODE_ENV === 'development' ? 'khajana_dev_khajana' : 'khajana_khajana',
  dateStrings: true,
  connectionLimit: process.env.DB_POOL_SIZE,
};

module.exports = {
  mysql0: {
    host: 'localhost',
    port: process.env.DB_PORT || 3306,
    ...metadata,
  },
  mysql2: {
    host: 'db1.khalis.net',
    port: 3306,
    ...metadata,
  },
  mysql2: {
    host: 'db2.khalis.net',
    port: 3306,
    ...metadata,
  },
  mysql2: {
    host: 'db3.khalis.net',
    port: 3306,
    ...metadata,
  },
};
