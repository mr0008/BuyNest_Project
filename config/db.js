const mysql = require('mysql2');
require('dotenv').config();

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'shopping_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_PORT) connectionConfig.port = Number(process.env.DB_PORT);
if (process.env.DB_PASSWORD) connectionConfig.password = process.env.DB_PASSWORD;

const pool = mysql.createPool(connectionConfig);

module.exports = pool.promise();
