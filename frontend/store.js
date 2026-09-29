const gatewayUrl = localStorage.getItem('gatewayUrl') || 'https://api-gateway-5ba1.onrender.com';

// ─── Session State ──────────────────────────────────────────────────────────
// Customer session stored in sessionStorage (cleared on tab close)
// Format: { id: 3, name: "John", email: "john@example.com" }
let currentUser = null;
try { currentUser = JSON.parse(sessionStorage.getItem('storeUser')); } catch {}

let allProducts = []; // cache for search filtering

// ─── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchProducts();
    if (currentUser) loadMyOrders();
});

// ─── Auth UI ─────────────────────────────────────────────────────────────────
function updateAuthUI() {
    const authArea = document.getElementById('authArea');
    const myOrdersLink = document.getElementById('myOrdersLink');
    const myOrdersSection = document.getElementById('my-orders');

    if (currentUser) {
        const initial = currentUser.name ? currentUser.name[0].toUpperCase() : '?';
        authArea.innerHTML = `
            <div style="display:flex;align-items:center;gap:.75rem">
                <button class="user-pill" onclick="showMyOrders()">
                    <div class="avatar">${initial}</div>
                    ${currentUser.name}
                </button>
                <button onclick="logoutUser()" style="background:none;border:1px solid #e5e7eb;color:#6b7280;padding:.4rem .75rem;border-radius:6px;font-size:.85rem;cursor:pointer">
                    Logout
                </button>
            </div>`;
        myOrdersLink.style.display = 'block';
        myOrdersSection.style.display = 'block';

        // Pre-fill customer ID if order modal is opened
        const cidField = document.getElementById('purchaseCustomerId');
        if (cidField) { cidField.value = currentUser.id; cidField.closest('.input-group').style.display='none'; }
    } else {
        authArea.innerHTML = `<a href="javascript:void(0)" onclick="showAuthModal()">Register / Login</a>`;
        myOrdersLink.style.display = 'none';
        myOrdersSection.style.display = 'none';
    }
}

function logoutUser() {
    sessionStorage.removeItem('storeUser');
    currentUser = null;
    updateAuthUI();
    showStoreToast('Logged out successfully', 'info');
}

function showMyOrders() {
    document.getElementById('my-orders').scrollIntoView({ behavior: 'smooth' });
    loadMyOrders();
}

// ─── Tabs in Auth Modal ───────────────────────────────────────────────────────
function switchTab(tab) {
    const isReg = tab === 'register';
    document.getElementById('registerTab').style.display = isReg ? 'block' : 'none';
    document.getElementById('loginTab').style.display    = isReg ? 'none' : 'block';
    document.getElementById('tabRegister').style.borderBottomColor = isReg ? 'var(--primary-color)' : 'transparent';
    document.getElementById('tabRegister').style.color = isReg ? 'var(--primary-color)' : '#9ca3af';
    document.getElementById('tabLogin').style.borderBottomColor = isReg ? 'transparent' : 'var(--primary-color)';
    document.getElementById('tabLogin').style.color = isReg ? '#9ca3af' : 'var(--primary-color)';
}

// ─── Modals ──────────────────────────────────────────────────────────────────
function showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
    switchTab('register');
}
function showOrderModal(productId, productName) {
    document.getElementById('modalProductName').innerText = productName;
    document.getElementById('purchaseProductId').value = productId;
    document.getElementById('orderFormView').style.display = 'block';
    document.getElementById('orderSuccessView').style.display = 'none';
    // Auto-fill & hide customer ID field if logged in
    const cidGroup = document.getElementById('customerIdGroup');
    const cidField = document.getElementById('purchaseCustomerId');
    if (currentUser) { cidField.value = currentUser.id; cidGroup.style.display = 'none'; }
    else { cidField.value = ''; cidGroup.style.display = 'block'; }
    document.getElementById('purchaseQuantity').value = 1;
    document.getElementById('orderModal').classList.remove('hidden');
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// ─── Products ────────────────────────────────────────────────────────────────
async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = `<div class="product-card"><div class="product-img placeholder-img"><i class="ri-loader-4-line"></i></div><div class="product-info"><h3>Loading...</h3><p>Connecting — may take 30s on first load</p></div></div>`;
    try {
        const r = await fetch(`${gatewayUrl}/products`, { signal: AbortSignal.timeout(30000) });
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        allProducts = await r.json();
        renderProducts(allProducts);
    } catch(err) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#6b7280">
            <i class="ri-wifi-off-line" style="font-size:2.5rem;display:block;margin-bottom:.75rem"></i>
            <p>Could not load products. ${err.message}</p>
            <button onclick="fetchProducts()" class="btn btn-primary" style="margin-top:1rem;width:auto;padding:.7rem 1.5rem">Retry</button>
        </div>`;
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    const imageCache = {};
    try { Object.assign(imageCache, JSON.parse(localStorage.getItem('productImages') || '{}')); } catch {}

    if (!products.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#9ca3af"><i class="ri-box-3-line" style="font-size:2.5rem;display:block;margin-bottom:.75rem"></i><p>No products available yet.</p></div>`;
        return;
    }
    grid.innerHTML = products.map(p => {
        const safeName = p.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const imgUrl = imageCache[p.id];
        const imgHtml = imgUrl
            ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<i class=\\'ri-box-3-line\\'></i>'">`
            : `<i class="ri-box-3-line"></i>`;
        return `<div class="product-card">
            <div class="product-img placeholder-img">${imgHtml}</div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.description || 'No description provided'}</p>
                <p class="product-price">&#8377;${Number(p.price).toFixed(2)}</p>
                <button class="btn btn-buy" onclick="showOrderModal(${p.id},'${safeName}')">
                    <i class="ri-shopping-cart-line"></i> Buy Now
                </button>
            </div>
        </div>`;
    }).join('');
}

function filterProducts(query) {
    const q = query.toLowerCase().trim();
    if (!q) { renderProducts(allProducts); return; }
    renderProducts(allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    ));
}

// ─── Register ────────────────────────────────────────────────────────────────
async function submitRegistration(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.textContent = 'Creating account...'; btn.disabled = true;

    try {
        const r = await fetch(`${gatewayUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: document.getElementById('regName').value.trim(), email: document.getElementById('regEmail').value.trim() }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Registration failed');

        const newId = data.userId || data.id;
        // Save session
        currentUser = { id: newId, name: document.getElementById('regName').value.trim(), email: document.getElementById('regEmail').value.trim() };
        sessionStorage.setItem('storeUser', JSON.stringify(currentUser));

        closeModal('authModal');
        event.target.reset();
        updateAuthUI();
        loadMyOrders();
        showStoreToast(`Welcome! Your Customer ID is #${newId} — remember it for next login.`, 'success');
    } catch(e) {
        showStoreToast(`Registration failed: ${e.message}`, 'error');
    } finally {
        btn.textContent = 'Create Account'; btn.disabled = false;
    }
}

// ─── Login ───────────────────────────────────────────────────────────────────
async function submitLogin(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.textContent = 'Verifying...'; btn.disabled = true;

    const enteredId = parseInt(document.getElementById('loginCustomerId').value);
    const enteredEmail = document.getElementById('loginEmail').value.trim().toLowerCase();

    try {
        const r = await fetch(`${gatewayUrl}/users`, { signal: AbortSignal.timeout(10000) });
        const users = await r.json();
        const match = users.find(u => u.id === enteredId && u.email.toLowerCase() === enteredEmail);

        if (!match) {
            showStoreToast('No account found with that ID and email combination.', 'error');
            btn.textContent = 'Login'; btn.disabled = false;
            return;
        }

        currentUser = { id: match.id, name: match.name, email: match.email };
        sessionStorage.setItem('storeUser', JSON.stringify(currentUser));

        closeModal('authModal');
        document.getElementById('storeLoginForm').reset();
        updateAuthUI();
        loadMyOrders();
        showStoreToast(`Welcome back, ${match.name}!`, 'success');
    } catch(e) {
        showStoreToast(`Login failed: ${e.message}`, 'error');
    } finally {
        btn.textContent = 'Login'; btn.disabled = false;
    }
}

// ─── Place Order ─────────────────────────────────────────────────────────────
async function submitPurchase(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.textContent = 'Placing order...'; btn.disabled = true;

    const userId = currentUser ? currentUser.id : parseInt(document.getElementById('purchaseCustomerId').value);
    const productId = parseInt(document.getElementById('purchaseProductId').value);
    const quantity = parseInt(document.getElementById('purchaseQuantity').value);

    if (!userId || isNaN(userId)) {
        showStoreToast('Please enter your Customer ID', 'error');
        btn.textContent = 'Confirm Order'; btn.disabled = false;
        return;
    }

    try {
        const r = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, product_id: productId, quantity }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Order failed');

        // Show success state inside modal
        document.getElementById('orderFormView').style.display = 'none';
        document.getElementById('orderSuccessView').style.display = 'block';
        document.getElementById('orderSuccessMsg').textContent = `Order #${data.orderId} confirmed! ${currentUser ? 'View it in My Orders.' : ''}`;

        if (currentUser) loadMyOrders();
    } catch(e) {
        showStoreToast(`Order failed: ${e.message}`, 'error');
        btn.textContent = 'Confirm Order'; btn.disabled = false;
    }
}

// ─── My Orders ───────────────────────────────────────────────────────────────
async function loadMyOrders() {
    if (!currentUser) return;
    const body = document.getElementById('myOrdersBody');
    const count = document.getElementById('myOrdersCount');
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af"><i class="ri-loader-4-line"></i> Loading your orders...</div>';

    try {
        const [oRes, pRes] = await Promise.all([
            fetch(`${gatewayUrl}/orders`,   { signal: AbortSignal.timeout(10000) }),
            fetch(`${gatewayUrl}/products`, { signal: AbortSignal.timeout(10000) }),
        ]);
        const allOrders = await oRes.json();
        const products  = await pRes.json();
        const pMap = Object.fromEntries(products.map(p => [p.id, p]));
        const imageCache = {};
        try { Object.assign(imageCache, JSON.parse(localStorage.getItem('productImages') || '{}')); } catch {}

        const myOrders = allOrders.filter(o => Number(o.user_id) === Number(currentUser.id));
        count.textContent = `${myOrders.length} order${myOrders.length !== 1 ? 's' : ''}`;

        if (!myOrders.length) {
            body.innerHTML = '<div style="text-align:center;padding:3rem;color:#9ca3af"><i class="ri-shopping-cart-line" style="font-size:2.5rem;display:block;margin-bottom:.75rem"></i><p>You haven\'t placed any orders yet.</p></div>';
            return;
        }

        body.innerHTML = `<table class="orders-table">
            <thead><tr><th>Order #</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>${myOrders.reverse().map(o => {
                const p = pMap[o.product_id];
                const total = p ? `₹${(Number(p.price) * Number(o.quantity)).toFixed(2)}` : '—';
                const badgeClass = o.status === 'completed' ? 'badge-completed' : 'badge-pending';
                const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—';
                const imgUrl = imageCache[o.product_id];
                const thumb = imgUrl ? `<img src="${imgUrl}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;margin-right:.5rem;vertical-align:middle">` : '';
                return `<tr>
                    <td><strong>#${o.id}</strong></td>
                    <td>${thumb}${p ? p.name : `Product #${o.product_id}`}</td>
                    <td>${o.quantity}</td>
                    <td style="font-weight:600;color:var(--primary-color)">${total}</td>
                    <td><span class="badge ${badgeClass}">${o.status || 'pending'}</span></td>
                    <td style="color:#6b7280;font-size:.85rem">${date}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>`;
    } catch(e) {
        body.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444">${e.message}</div>`;
    }
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function showStoreToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    if (!toast || !msgEl) { console.log(message); return; }

    msgEl.textContent = message;
    iconEl.className = type === 'error' ? 'ri-error-warning-line' : type === 'info' ? 'ri-information-line' : 'ri-checkbox-circle-line';
    iconEl.style.color = type === 'error' ? '#ef4444' : type === 'info' ? '#3b82f6' : '#10b981';

    toast.classList.remove('hidden');
    toast.style.display = 'flex';
    void toast.offsetWidth;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => { toast.style.display = 'none'; }, 350);
    }, 4500);
}
