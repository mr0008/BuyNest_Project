/* ─── ShopHub – Auth JS ──────────────────────── */

/* Redirect if already logged in */
if (Api.isLoggedIn()) window.location.href = '/';

/* ─── Login ───────────────────────────────────── */
const gmailBtn = document.getElementById('gmail-login-btn');

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

if (gmailBtn) {
  gmailBtn.addEventListener('click', () => {
    const clientId = window.GOOGLE_CLIENT_ID || '';
    if (!clientId || clientId === '__GOOGLE_CLIENT_ID__') {
      showToast('Add your Google Client ID in .env to enable Gmail sign-in.', 'error');
      return;
    }
    if (!window.google?.accounts?.id) {
      showToast('Google sign-in script is still loading. Please try again in a moment.', 'error');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleLogin,
      ux_mode: 'popup'
    });
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        showToast('Google account chooser did not open. Please try again.', 'info');
      }
    });
  });
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
