/* ─── ShopHub – Profile JS ─────────────────── */

const currentUser = Api.getUser();
if (!currentUser) {
  window.location.href = '/login.html';
}

async function loadProfile() {
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avatarEl = document.getElementById('profile-avatar');
  const createdAtEl = document.getElementById('profile-created-date');

  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  nameEl.textContent = currentUser.name;
  emailEl.textContent = currentUser.email;
  avatarEl.textContent = initials;
  createdAtEl.textContent = currentUser.created_at
    ? new Date(currentUser.created_at).toLocaleDateString()
    : 'Unknown';
}

document.addEventListener('DOMContentLoaded', loadProfile);
