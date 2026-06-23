const express = require('express');
const db      = require('../config/db');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── GET cart items ───────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.id, c.quantity, c.product_id,
              p.name, p.price, p.image_url, p.stock
       FROM   carts c
       JOIN   products p ON c.product_id = p.id
       WHERE  c.user_id = ?
       ORDER  BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST add to cart ─────────────────────────
router.post('/', auth, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id is required' });

  try {
    const [existing] = await db.execute(
      'SELECT * FROM carts WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length) {
      await db.execute(
        'UPDATE carts SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, req.user.id, product_id]
      );
    } else {
      await db.execute(
        'INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }
    res.json({ message: 'Added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT update quantity ──────────────────────
router.put('/:id', auth, async (req, res) => {
  const { quantity } = req.body;
  try {
    if (quantity <= 0) {
      await db.execute(
        'DELETE FROM carts WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
    } else {
      await db.execute(
        'UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?',
        [quantity, req.params.id, req.user.id]
      );
    }
    res.json({ message: 'Cart updated' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE single item ───────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM carts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Removed from cart' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE clear whole cart ──────────────────
router.delete('/', auth, async (req, res) => {
  try {
    await db.execute('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
