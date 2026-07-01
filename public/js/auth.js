/* ─── ShopHub – Auth JS ──────────────────────── */

/* Redirect if already logged in */
if (Api.isLoggedIn()) {
  const user = Api.getUser();
  window.location.href = user?.role === 'admin' ? '/admin.html' : '/';
}

/* ─── Login ───────────────────────────────────── */
const gmailBtn = document.getElementById('gmail-login-btn');
const googleStatusEl = document.getElementById('google-status');

function setGoogleStatus(message, isError = false) {
  if (!googleStatusEl) return;
  googleStatusEl.textContent = message || '';
  googleStatusEl.style.color = isError ? '#dc2626' : 'var(--text-muted)';
}

function isValidGoogleClientId(value) {
  return typeof value === 'string' && value.trim() !== '' && !/your[_-]?google[_-]?client[_-]?id|example|placeholder/i.test(value) && /\.apps\.googleusercontent\.com$/i.test(value);
}

async function handleGoogleLogin(response) {
  try {
    const data = await Api.post('/auth/google', { credential: response.credential });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showToast('Welcome back, ' + data.user.name.split(' ')[0] + '! 👋', 'success');
    setTimeout(() => {
      window.location.href = data.user.role === 'admin' ? '/admin.html' : '/';
    }, 600);
  } catch (err) {
    const errEl = document.getElementById('auth-error');
    if (errEl) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
    showToast(err.message, 'error');
  }
}

async function initGoogleButton() {
  if (!gmailBtn) return;

  try {
    const res = await fetch('/api/auth/google-config');
    const data = await res.json();
    window.GOOGLE_CLIENT_ID = data.clientId || '';
  } catch {
    window.GOOGLE_CLIENT_ID = '';
  }

  if (!window.google?.accounts?.id) {
    setGoogleStatus('Loading Google sign-in…', false);
    window.setTimeout(initGoogleButton, 400);
    return;
  }

  if (!isValidGoogleClientId(window.GOOGLE_CLIENT_ID)) {
    setGoogleStatus('Google sign-in is not configured yet. Add a valid Google Client ID to the server environment.', true);
    gmailBtn.innerHTML = '<div style="padding:10px 16px;border:1px solid #d1d5db;border-radius:999px;color:#6b7280;background:#fff;">Google sign-in unavailable</div>';
    return;
  }

  setGoogleStatus('');
  window.google.accounts.id.initialize({
    client_id: window.GOOGLE_CLIENT_ID,
    callback: handleGoogleLogin,
    ux_mode: 'popup'
  });

  window.google.accounts.id.renderButton(gmailBtn, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    width: 320
  });
}

if (gmailBtn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleButton);
  } else {
    initGoogleButton();
  }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type=submit]');
    const errEl = document.getElementById('auth-error');
    errEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    try {
      const data = await Api.post('/auth/login', {
        email:    loginForm.email.value.trim(),
        password: loginForm.password.value
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Welcome back, ' + data.user.name.split(' ')[0] + '! 👋', 'success');
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? '/admin.html' : '/';
      }, 600);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

/* ─── Register ────────────────────────────────── */
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button[type=submit]');
    const errEl = document.getElementById('auth-error');
    errEl.classList.add('hidden');

    const password = registerForm.password.value;
    const confirm  = registerForm.confirm_password.value;
    if (password !== confirm) {
      errEl.textContent = 'Passwords do not match';
      errEl.classList.remove('hidden');
      return;
    }
    if (password.length < 6) {
      errEl.textContent = 'Password must be at least 6 characters';
      errEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      await Api.post('/auth/register', {
        name:     registerForm.fullname.value.trim(),
        email:    registerForm.email.value.trim(),
        password
      });
      showToast('Account created! Please sign in.', 'success');
      setTimeout(() => window.location.href = '/login.html', 1000);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}
