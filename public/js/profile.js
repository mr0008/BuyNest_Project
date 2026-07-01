/* ─── ShopHub – Profile JS ─────────────────── */

const currentUser = Api.getUser();
if (!currentUser) {
  window.location.href = '/login.html';
}

async function loadProfile() {
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avatarEl = document.getElementById('profile-avatar');
  const ordersCountEl = document.getElementById('profile-orders-count');
  const createdAtEl = document.getElementById('profile-created-date');
  const ordersListEl = document.getElementById('orders-list');

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

  try {
    const orders = await Api.get('/profile/orders');
    ordersCountEl.textContent = orders.length;

    if (!orders.length) {
      ordersListEl.innerHTML = '<p class="text-muted">No orders yet.</p>';
      return;
    }

    ordersListEl.innerHTML = orders.map(order => `
      <div class="order-card">
        <div>
          <strong>Order #${order.id}</strong>
          <div class="text-muted">${new Date(order.created_at).toLocaleString()}</div>
        </div>
        <div style="text-align:right;">
          <div>RS.${parseFloat(order.total_amount).toFixed(2)}</div>
          <span class="badge badge-blue">${order.status}</span>
        </div>
        <div class="order-items">${order.items_summary || 'No details available'}</div>
      </div>
    `).join('');
  } catch (err) {
    ordersListEl.innerHTML = `<p class="text-muted">Unable to load orders: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadProfile);
