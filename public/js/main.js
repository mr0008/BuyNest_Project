/* ─── ShopHub – Main Page JS ─────────────────── */

let allProducts  = [];
let activeCategory = 'All';
let searchQuery    = '';

async function loadCategories() {
  try {
    const cats = await Api.get('/products/categories');
    const wrap = document.getElementById('category-filter');
    if (!wrap) return;
    wrap.innerHTML = `<button class="cat-btn active" data-cat="All">All</button>`;
    cats.forEach(c => {
      wrap.innerHTML += `<button class="cat-btn" data-cat="${c}">${c}</button>`;
    });
    wrap.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        renderProducts();
      });
    });
  } catch {}
}

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner"></div>';
  try {
    allProducts = await Api.get('/products');
    renderProducts();
  } catch {
    grid.innerHTML = `<p class="text-muted text-center">Failed to load products.</p>`;
  }
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let filtered = allProducts.filter(p => {
    const matchCat  = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.description?.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🔍</div>
        <h3>No products found</h3>
        <p>Try a different search or category</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="openProduct(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image_url || 'https://placehold.co/400x400/1a1a1f/f59e0b?text=Product'}"
             alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1a1a1f/f59e0b?text=Product'">
        <span class="product-category-tag badge badge-amber">${p.category}</span>
      </div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${(p.description||'').slice(0,80)}${p.description?.length>80?'…':''}</div>
        <div class="product-footer">
          <span class="product-price">RS.${parseFloat(p.price).toFixed(2)}</span>
          <button class="add-cart-btn" onclick="event.stopPropagation();addToCart(${p.id})">
            + Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-img').src         = p.image_url || '';
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-desc').textContent = p.description || '';
  document.getElementById('modal-price').textContent = `RS.${parseFloat(p.price).toFixed(2)}`;
  document.getElementById('modal-stock').textContent = p.stock > 0 ? `${p.stock} in stock` : 'Out of stock';
  document.getElementById('modal-cat').textContent  = p.category;
  document.getElementById('modal-add-btn').onclick  = () => { addToCart(id); closeProductModal(); };
  document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

async function addToCart(productId) {
  if (!Api.isLoggedIn()) {
    showToast('Please log in to add items to cart', 'error');
    setTimeout(() => window.location.href = '/login.html', 1200);
    return;
  }
  try {
    await Api.post('/cart', { product_id: productId, quantity: 1 });
    showToast('Added to cart! 🛒', 'success');
    updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ─── Search ─────────────────────────────────── */
function initSearch() {
  const input = document.getElementById('nav-search-input');
  if (!input) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = input.value.toLowerCase().trim();
      renderProducts();
    }, 300);
  });
}

function initNavLinks() {
  const navLinks = document.querySelectorAll('.nav-link');
  if (!navLinks.length) return;

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

/* ─── Init ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCategories(), loadProducts()]);
  initSearch();
  initNavLinks();
  document.getElementById('close-product-modal')?.addEventListener('click', closeProductModal);
  document.getElementById('product-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeProductModal();
  });
});
