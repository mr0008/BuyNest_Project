/* ─── ShopHub – Cart JS ──────────────────────── */

if (!Api.isLoggedIn()) {
  showToast('Please log in to view your cart', 'error');
  setTimeout(() => window.location.href = '/login.html', 800);
}

let cartItems = [];

async function loadCart() {
  const listEl  = document.getElementById('cart-list');
  const emptyEl = document.getElementById('cart-empty');
  const mainEl  = document.getElementById('cart-main');
  if (!listEl) return;

  listEl.innerHTML = '<div class="spinner"></div>';
  try {
    cartItems = await Api.get('/cart');
    renderCart();
  } catch (err) {
    listEl.innerHTML = `<p class="text-muted">Failed to load cart: ${err.message}</p>`;
  }
}

function renderCart() {
  const listEl  = document.getElementById('cart-list');
  const emptyEl = document.getElementById('cart-empty');
  const summaryEl = document.getElementById('cart-summary');

  if (!cartItems.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    summaryEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  summaryEl.classList.remove('hidden');

  listEl.innerHTML = cartItems.map(item => `
    <div class="cart-item" id="cart-item-${item.id}">
      <img class="cart-item-img"
           src="${item.image_url || 'https://placehold.co/80x80/1a1a1f/f59e0b?text=?'}"
           alt="${item.name}"
           onerror="this.src='https://placehold.co/80x80/1a1a1f/f59e0b?text=?'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">RS.${parseFloat(item.price).toFixed(2)}</div>
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.quantity - 1})">−</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.quantity + 1})">+</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.05rem;">
          RS.${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </span>
        <button class="btn btn-danger btn-sm" onclick="removeItem(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');

  updateSummary();
}

function updateSummary() {
  const subtotal = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const shipping  = subtotal > 0 ? 5.00 : 0;
  const total     = subtotal + shipping;

  document.getElementById('subtotal').textContent  = `Rs.${subtotal.toFixed(2)}`;
  document.getElementById('shipping').textContent  = shipping ? `RS.${shipping.toFixed(2)}` : 'Free';
  document.getElementById('cart-total').textContent = `RS.${total.toFixed(2)}`;
  document.getElementById('item-count').textContent =
    `${cartItems.reduce((s,i)=>s+i.quantity,0)} item(s)`;
  updateCartBadge();
}

async function changeQty(cartId, newQty) {
  try {
    await Api.put(`/cart/${cartId}`, { quantity: newQty });
    if (newQty <= 0) {
      cartItems = cartItems.filter(i => i.id !== cartId);
    } else {
      const item = cartItems.find(i => i.id === cartId);
      if (item) item.quantity = newQty;
    }
    renderCart();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeItem(cartId) {
  try {
    await Api.delete(`/cart/${cartId}`);
    cartItems = cartItems.filter(i => i.id !== cartId);
    renderCart();
    showToast('Item removed', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function clearCart() {
  if (!confirm('Clear your entire cart?')) return;
  try {
    await Api.delete('/cart');
    cartItems = [];
    renderCart();
    showToast('Cart cleared', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function checkout() {
  if (!cartItems.length) return;
  showToast('Order placed successfully! Thank you 🎉', 'success');
  setTimeout(async () => {
    await Api.delete('/cart');
    cartItems = [];
    renderCart();
  }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  document.getElementById('clear-cart-btn')?.addEventListener('click', clearCart);
  document.getElementById('checkout-btn')?.addEventListener('click', checkout);
});
