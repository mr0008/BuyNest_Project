const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

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
      `SELECT c.quantity, p.price
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

    await db.execute('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to process payment' });
  }
});

module.exports = router;
