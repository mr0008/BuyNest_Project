const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const multer    = require('multer');
const db        = require('../config/db');
const { auth, adminAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../public/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// ─── GET all products (with optional search & category) ───
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];

    const conditions = [];
    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET categories ───────────────────────────
router.get('/categories', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET single product ───────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST upload product image (admin) ─────
router.post('/upload', adminAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Image upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose an image file' });
    }

    res.json({ image_url: `/uploads/${req.file.filename}` });
  });
});

// ─── POST create product (admin) ─────────────
router.post('/', adminAuth, async (req, res) => {
  const { name, description, price, image_url, category, stock } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', price, image_url || '', category || 'General', stock || 0]
    );
    res.json({ id: result.insertId, message: 'Product added successfully' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT update product (admin) ──────────────
router.put('/:id', adminAuth, async (req, res) => {
  const { name, description, price, image_url, category, stock } = req.body;
  try {
    await db.execute(
      'UPDATE products SET name=?, description=?, price=?, image_url=?, category=?, stock=? WHERE id=?',
      [name, description, price, image_url, category, stock, req.params.id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE product (admin) ───────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
