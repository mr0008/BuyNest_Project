const express = require('express');
const db = require('../config/db');
const { auth, adminAuth } = require('../middleware/authMiddleware');

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

router.post('/process', auth, async (req, res) => {
  const { amount, billing } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }

  if (!billing || !billing.name || !billing.card_number || !billing.expiry || !billing.cvv) {
    return res.status(400).json({ error: 'Incomplete payment information' });
  }

  const cardNumber = String(billing.card_number).replace(/\D/g, '');
  if (!/^\d{12,19}$/.test(cardNumber)) {
    return res.status(400).json({ error: 'Invalid card number' });
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(billing.expiry)) {
    return res.status(400).json({ error: 'Invalid card expiry' });
  }

  if (!/^\d{3,4}$/.test(String(billing.cvv))) {
    return res.status(400).json({ error: 'Invalid CVV' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT c.quantity, p.name, p.price
       FROM carts c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const subtotal = rows.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const shipping = subtotal > 0 ? 5.0 : 0;
    const expectedTotal = parseFloat((subtotal + shipping).toFixed(2));

    if (Math.abs(expectedTotal - amount) > 0.01) {
      return res.status(400).json({ error: 'Payment amount does not match cart total' });
    }

    await ensureOrdersTable();
    const itemsSummary = rows.map(item => `${item.name} x${item.quantity}`).join(', ');

    await db.execute(
      `INSERT INTO orders (user_id, total_amount, status, items_summary, billing_name)
       VALUES (?, ?, 'pending', ?, ?)`,
      [req.user.id, expectedTotal, itemsSummary, billing.name]
    );

    await db.execute('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to process payment' });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  try {
    await ensureOrdersTable();
    const [rows] = await db.execute(`
      SELECT o.id, o.user_id, o.total_amount, o.status, o.items_summary, o.billing_name, o.created_at,
             u.name AS customer_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load orders' });
  }
});

router.put('/orders/:id/status', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  try {
    await ensureOrdersTable();
    const [result] = await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to update order status' });
  }
});

module.exports = router;
