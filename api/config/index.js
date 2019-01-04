module.exports = {
  mysql: {
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: 'khajana_khajana',
    dateStrings: true
  }
};
