/**
 * ShopHub – Setup Script
 * Run once after importing shopping_db.sql:
 *   node setup.js
 *
 * Creates admin account: admin@shophub.com / admin123
 */

const bcrypt  = require('bcryptjs');
const mysql   = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'shopping_db'
  });

  try {
    // Create admin user
    const hash = await bcrypt.hash('admin123', 10);
    await conn.execute(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Admin', 'admin@shophub.com', ?, 'admin')
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [hash]
    );
    console.log('\n  ✅  Admin user created / updated');
    console.log('      Email    : admin@shophub.com');
    console.log('      Password : admin123\n');
    console.log('  🚀  Setup complete! Run "npm run dev" to start.\n');
  } catch (err) {
    console.error('Setup error:', err.message);
  } finally {
    await conn.end();
  }
}

setup();
