const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db      = require('../config/db');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// ─── Register ────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );
    res.json({ message: 'Account created successfully! Please log in.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Login ───────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'shophub_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Google login ─────────────────────────────
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential is required' });
  if (!process.env.GOOGLE_CLIENT_ID || !googleClient) {
    return res.status(500).json({ error: 'Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID to your .env file.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();

    if (!email) return res.status(400).json({ error: 'Google account email not found' });

    const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!existing.length) {
      const tempHash = await bcrypt.hash(`google-${Date.now()}-${Math.random()}`, 10);
      await db.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [payload.name || email.split('@')[0], email, tempHash, 'customer']
      );
    }

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'shophub_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

// ─── Get current user ─────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
