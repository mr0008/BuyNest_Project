const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const paymentRoutes = require('./routes/payment');

const app = express();

// ─── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());

app.get('/login.html', (_req, res) => {
  const filePath = path.join(__dirname, 'public', 'login.html');
  const html = fs.readFileSync(filePath, 'utf8')
    .replace(/__GOOGLE_CLIENT_ID__/g, process.env.GOOGLE_CLIENT_ID || '');
  res.send(html);
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ─────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/payment',  paymentRoutes);

app.get('/api/auth/google-config', (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const isPlaceholder = !clientId || /your[_-]?google[_-]?client[_-]?id|example|placeholder/i.test(clientId);
  res.json({ clientId: isPlaceholder ? '' : clientId });
});

// ─── Catch-all → serve index.html ───────────
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🛒  BuyNest running at → http://localhost:${PORT}\n`);
});
