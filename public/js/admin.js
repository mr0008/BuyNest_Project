/* ─── ShopHub – Admin JS ─────────────────────── */

/* Guard: admin only */
const currentUser = Api.getUser();
if (!currentUser || currentUser.role !== 'admin') {
  alert('Admin access required.');
  window.location.href = '/login.html';
}

let products = [];
let editingId = null;

/* ─── Load Stats ─────────────────────────────── */
async function loadStats() {
  try {
    const prods = await Api.get('/products');
    products = prods;
    document.getElementById('stat-products').textContent = prods.length;
    document.getElementById('stat-value').textContent =
      '$' + prods.reduce((s,p) => s + parseFloat(p.price), 0).toFixed(0);
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
            $${parseFloat(p.price).toFixed(2)}</td>
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
