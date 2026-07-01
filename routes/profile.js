const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

async function ensureOrdersTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      items_summary TEXT DEFAULT '',
      billing_name VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load profile' });
  }
});

router.get('/orders', auth, async (req, res) => {
  try {
    await ensureOrdersTable();
    const [rows] = await db.execute(
      `SELECT id, total_amount, status, items_summary, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load orders' });
  }
});

module.exports = router;
