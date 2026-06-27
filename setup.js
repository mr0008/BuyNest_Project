/**
 * ShopHub – Setup Script
 * Creates the database and admin account for the project.
 * Run once after starting MySQL/XAMPP:
 *   node setup.js
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  const dbName = process.env.DB_NAME || 'shopping_db';
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    multipleStatements: true
  };

  if (process.env.DB_PORT) connectionConfig.port = Number(process.env.DB_PORT);
  if (process.env.DB_PASSWORD) connectionConfig.password = process.env.DB_PASSWORD;

  const conn = await mysql.createConnection(connectionConfig);

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await conn.changeUser({ database: dbName });

    const schemaPath = path.join(__dirname, 'database', 'shopping_db.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schemaSql);

    const hash = await bcrypt.hash('admin123', 10);
    await conn.execute(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Admin', 'admin@shophub.com', ?, 'admin')
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [hash]
    );

    console.log('\n  ✅  Database and admin account are ready');
    console.log('      Database : ' + dbName);
    console.log('      Email    : admin@shophub.com');
    console.log('      Password : admin123\n');
    console.log('  🚀  Setup complete! Run "npm run dev" to start.\n');
  } catch (err) {
    console.error('Setup error:', err.message);
    console.error('Make sure MySQL is running in XAMPP and the root user has access.');
  } finally {
    await conn.end();
  }
}

setup();
