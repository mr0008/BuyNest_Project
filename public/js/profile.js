/* ─── ShopHub – Profile JS ─────────────────── */

const currentUser = Api.getUser();
if (!currentUser) {
  window.location.href = '/login.html';
}

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
}

function getInitials(name) {
  return (name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'U';
}

function renderOrders(orders) {
  const list = document.getElementById('orders-list');
  const countEl = document.getElementById('profile-orders-count');

  if (!list || !countEl) return;

  if (!orders.length) {
    countEl.textContent = '0 orders';
    list.innerHTML = '<div class="orders-empty">You have not placed any orders yet.</div>';
    return;
  }

  countEl.textContent = `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`;
  list.innerHTML = orders.map((order) => {
    const status = (order.status || 'pending').toLowerCase();
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return `
      <article class="order-card">
        <div class="order-card-header">
          <div>
            <h3>Order #${order.id}</h3>
            <p>${formatDate(order.created_at)}</p>
          </div>
          <span class="order-status ${status}">${statusLabel}</span>
        </div>
        <div class="order-summary">
          <span>Items: ${order.items_summary || 'No details available'}</span>
          <strong>Total: RS.${parseFloat(order.total_amount || 0).toFixed(2)}</strong>
        </div>
      </article>
    `;
  }).join('');
}

async function loadProfile() {
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avatarEl = document.getElementById('profile-avatar');
  const createdAtEl = document.getElementById('profile-created-date');

  try {
    const user = await Api.get('/profile/me');
    if (user) {
      nameEl.textContent = user.name || 'User';
      emailEl.textContent = user.email || 'No email available';
      avatarEl.textContent = getInitials(user.name);
      createdAtEl.textContent = formatDate(user.created_at);
    }
  } catch {
    nameEl.textContent = currentUser.name || 'User';
    emailEl.textContent = currentUser.email || 'No email available';
    avatarEl.textContent = getInitials(currentUser.name);
    createdAtEl.textContent = formatDate(currentUser.created_at);
  }

  try {
    const orders = await Api.get('/profile/orders');
    renderOrders(orders || []);
  } catch {
    renderOrders([]);
  }
}

document.addEventListener('DOMContentLoaded', loadProfile);
