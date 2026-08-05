// ---- State ----
let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('gg_cart') || '{}'); // { productId: qty }

const money = (cents) => '$' + (cents / 100).toFixed(2);

// ---- Load products ----
async function loadProducts() {
  const res = await fetch('products.json');
  PRODUCTS = await res.json();
  renderProducts();
  renderCart();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const countLabel = document.getElementById('productCountLabel');
  countLabel.textContent = PRODUCTS.length + ' item' + (PRODUCTS.length === 1 ? '' : 's');

  grid.innerHTML = PRODUCTS.map(p => {
    const out = p.stock <= 0;
    const low = !out && p.stock <= 3;
    const tag = out ? '<span class="stock-tag out">Sold out</span>'
      : low ? `<span class="stock-tag low">Only ${p.stock} left</span>`
      : '';
    return `
      <div class="product-card">
        ${tag}
        <img class="product-media" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
        <div class="product-body">
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-desc">${escapeHtml(p.description)}</p>
          <div class="product-foot">
            <span class="product-price">${money(p.price)}</span>
            <button class="add-btn" data-id="${p.id}" ${out ? 'disabled' : ''}>
              ${out ? 'Sold out' : 'Add to slip'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id));
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---- Cart logic ----
function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const currentQty = cart[id] || 0;
  if (currentQty >= product.stock) return; // don't exceed stock
  cart[id] = currentQty + 1;
  saveCart();
  openCart();
}

function setQty(id, qty) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  qty = Math.max(0, Math.min(qty, product.stock));
  if (qty === 0) {
    delete cart[id];
  } else {
    cart[id] = qty;
  }
  saveCart();
}

function saveCart() {
  localStorage.setItem('gg_cart', JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find(p => p.id === id), qty }))
    .filter(i => i.product);

  const countEl = document.getElementById('cartCount');
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalItems;

  const slipItems = document.getElementById('slipItems');
  const slipTotals = document.getElementById('slipTotals');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (items.length === 0) {
    slipItems.innerHTML = '<p class="empty-note">Your slip is empty.</p>';
    slipTotals.innerHTML = '';
    checkoutBtn.disabled = true;
    return;
  }

  slipItems.innerHTML = items.map(({ product, qty }) => `
    <div class="slip-item">
      <span class="slip-item-name">${escapeHtml(product.name)}</span>
      <div class="qty-controls">
        <button data-id="${product.id}" data-delta="-1" aria-label="Decrease quantity">&minus;</button>
        <span>${qty}</span>
        <button data-id="${product.id}" data-delta="1" aria-label="Increase quantity" ${qty >= product.stock ? 'disabled' : ''}>+</button>
      </div>
      <span>${money(product.price * qty)}</span>
      <button class="slip-item-remove" data-remove="${product.id}">Remove</button>
    </div>
  `).join('');

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  slipTotals.innerHTML = `
    <div class="row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="row"><span>Shipping</span><span>Calculated at checkout</span></div>
    <div class="row total"><span>Total (before shipping)</span><span>${money(subtotal)}</span></div>
  `;
  checkoutBtn.disabled = false;

  slipItems.querySelectorAll('[data-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const delta = parseInt(btn.dataset.delta, 10);
      setQty(id, (cart[id] || 0) + delta);
    });
  });
  slipItems.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      delete cart[btn.dataset.remove];
      saveCart();
    });
  });
}

// ---- Drawer open/close ----
function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartScrim').classList.add('open');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartScrim').classList.remove('open');
}

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartScrim').addEventListener('click', closeCart);

// ---- Checkout ----
document.getElementById('checkoutBtn').addEventListener('click', async () => {
  const btn = document.getElementById('checkoutBtn');
  btn.disabled = true;
  btn.textContent = 'Preparing checkout…';

  const items = Object.entries(cart).map(([id, qty]) => ({ id, qty }));

  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    if (!res.ok) throw new Error('Checkout failed');
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // redirect to Stripe Checkout
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (err) {
    alert('Sorry, checkout could not start. Please try again in a moment.');
    btn.disabled = false;
    btn.textContent = 'Checkout';
  }
});

loadProducts();
