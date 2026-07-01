/* ─── ShopHub – Admin JS ─────────────────────── */

/* Guard: admin only */
const currentUser = Api.getUser();
if (!currentUser || currentUser.role !== 'admin') {
  alert('Admin access required.');
  window.location.href = '/login.html';
}

let products = [];
let orders = [];
let editingId = null;

const orderStatusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

/* ─── Load Stats ─────────────────────────────── */
async function loadStats() {
  try {
    const prods = await Api.get('/products');
    products = prods;
    document.getElementById('stat-products').textContent = prods.length;
    document.getElementById('stat-value').textContent =
      'RS.' + prods.reduce((s,p) => s + parseFloat(p.price), 0).toFixed(0);
    const cats = [...new Set(prods.map(p=>p.category))];
    document.getElementById('stat-categories').textContent = cats.length;
    document.getElementById('stat-stock').textContent = prods.reduce((s,p)=>s+p.stock,0);
  } catch {}
}

/* ─── Load Products Table ────────────────────── */
async function loadProductsTable() {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">Loading…</td></tr>';
  try {
    products = await Api.get('/products');
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No products yet</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img class="product-thumb"
                 src="${p.image_url||'https://placehold.co/44x44/1a1a1f/f59e0b?text=?'}"
                 alt="${p.name}"
                 onerror="this.src='https://placehold.co/44x44/1a1a1f/f59e0b?text=?'"></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-blue">${p.category}</span></td>
        <td style="color:var(--primary);font-weight:700;font-family:'Syne',sans-serif">
            RS.${parseFloat(p.price).toFixed(2)}</td>
        <td>
          <span class="badge ${p.stock > 10 ? 'badge-green' : p.stock > 0 ? 'badge-amber' : 'badge-red'}">
            ${p.stock}
          </span>
        </td>
        <td class="td-actions">
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${p.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
  }
}

/* ─── Load Orders ───────────────────────────── */
async function loadOrdersTable() {
  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Loading…</td></tr>';

  try {
    orders = await Api.get('/payment/orders');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(order => `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>${order.customer_name || order.billing_name || 'Customer'}</td>
        <td>${order.items_summary || '—'}</td>
        <td style="color:var(--primary);font-weight:700;font-family:'Syne',sans-serif">RS.${parseFloat(order.total_amount).toFixed(2)}</td>
        <td>${new Date(order.created_at).toLocaleString()}</td>
        <td>
          <select class="form-input" style="min-width:140px" onchange="updateOrderStatus(${order.id}, this.value)">
            ${orderStatusOptions.map(status => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${orderStatusLabels[status]}</option>`).join('')}
          </select>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(id, status) {
  try {
    await Api.put(`/payment/orders/${id}/status`, { status });
    showToast('Order status updated ✅', 'success');
    loadOrdersTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ─── Modal ──────────────────────────────────── */
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title-text').textContent = 'Add Product';
  const f = document.getElementById('product-form');
  f.reset();
  f.prod_image_current.value = '';
  document.getElementById('product-modal').classList.remove('hidden');
}

function openEditModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  const f = document.getElementById('product-form');
  f.prod_name.value        = p.name;
  f.prod_desc.value        = p.description || '';
  f.prod_price.value       = p.price;
  f.prod_image_current.value = p.image_url || '';
  f.prod_category.value    = p.category || '';
  f.prod_stock.value       = p.stock;
  document.getElementById('modal-title-text').textContent = 'Edit Product';
  document.getElementById('product-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

/* ─── Save Product ───────────────────────────── */
async function saveProduct(e) {
  e.preventDefault();
  const f    = document.getElementById('product-form');
  const btn  = f.querySelector('button[type=submit]');
  let image_url = (f.prod_image_current.value || '').trim();

  if (f.prod_image_file?.files?.length) {
    const formData = new FormData();
    formData.append('image', f.prod_image_file.files[0]);
    const uploadResult = await Api.upload('/products/upload', formData);
    image_url = uploadResult.image_url || image_url;
  }

  const body = {
    name:        f.prod_name.value.trim(),
    description: f.prod_desc.value.trim(),
    price:       parseFloat(f.prod_price.value),
    image_url,
    category:    f.prod_category.value.trim(),
    stock:       parseInt(f.prod_stock.value)
  };

  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    if (editingId) {
      await Api.put(`/products/${editingId}`, body);
      showToast('Product updated ✅', 'success');
    } else {
      await Api.post('/products', body);
      showToast('Product added ✅', 'success');
    }
    closeModal();
    loadProductsTable();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Product';
  }
}

/* ─── Delete ─────────────────────────────────── */
async function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!confirm(`Delete "${p?.name}"? This cannot be undone.`)) return;
  try {
    await Api.delete(`/products/${id}`);
    showToast('Product deleted', 'info');
    loadProductsTable();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ─── Search Table ───────────────────────────── */
function filterTable(query) {
  const rows = document.querySelectorAll('#products-tbody tr');
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
  });
}

/* ─── Init ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-name').textContent = currentUser.name.split(' ')[0];
  loadStats();
  loadProductsTable();
  loadOrdersTable();

  document.getElementById('add-product-btn')?.addEventListener('click', openAddModal);
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('product-form')?.addEventListener('submit', saveProduct);
  document.getElementById('product-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('admin-search')?.addEventListener('input', (e) => filterTable(e.target.value));
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  });
});
