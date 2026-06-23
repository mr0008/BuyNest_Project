/* ─── ShopHub API Helper ─────────────────────── */

const API_BASE = '/api';

const Api = {
  getToken: ()  => localStorage.getItem('token'),
  getUser:  ()  => JSON.parse(localStorage.getItem('user') || 'null'),
  isAdmin:  ()  => Api.getUser()?.role === 'admin',
  isLoggedIn:() => !!Api.getToken(),

  headers(json = true) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    const t = Api.getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  async upload(path, formData) {
    const opts = {
      method: 'POST',
      headers: { Authorization: `Bearer ${Api.getToken()}` },
      body: formData
    };
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  async request(method, path, body) {
    const opts = { method, headers: Api.headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get:    (path)        => Api.request('GET',    path),
  post:   (path, body)  => Api.request('POST',   path, body),
  put:    (path, body)  => Api.request('PUT',    path, body),
  delete: (path)        => Api.request('DELETE', path),
};

/* ─── Toast Notifications ───────────────────── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container')
    || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='.3s'; setTimeout(()=>t.remove(),300); }, 3000);
}

/* ─── Cart Badge ─────────────────────────────── */
async function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  if (!Api.isLoggedIn()) { badge.textContent = '0'; return; }
  try {
    const items = await Api.get('/cart');
    const count = items.reduce((s, i) => s + i.quantity, 0);
    badge.textContent = count;
    badge.style.display = count ? 'flex' : 'none';
  } catch { badge.style.display = 'none'; }
}

/* ─── Nav auth state ─────────────────────────── */
function initNav() {
  const user = Api.getUser();
  const loginBtn  = document.getElementById('nav-login-btn');
  const userMenu  = document.getElementById('nav-user-menu');
  const userName  = document.getElementById('nav-user-name');
  const adminLink = document.getElementById('nav-admin-link');
  const logoutBtn = document.getElementById('nav-logout-btn');

  if (user) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (userMenu)  userMenu.style.display  = 'flex';
    if (userName)  userName.textContent    = user.name.split(' ')[0];
    if (adminLink) adminLink.style.display = user.role === 'admin' ? 'flex' : 'none';
  } else {
    if (loginBtn)  loginBtn.style.display  = 'flex';
    if (userMenu)  userMenu.style.display  = 'none';
    if (adminLink && adminLink) adminLink.style.display = 'none';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    });
  }
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', initNav);
