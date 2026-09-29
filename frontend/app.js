// State Management
let gatewayUrl = localStorage.getItem('gatewayUrl') || 'https://api-gateway-5ba1.onrender.com';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gatewayUrl').value = gatewayUrl;
    checkGatewayStatus();
});

// Navigation Logic
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');

    const titles = {
        'dashboard-section': ['Store Overview', 'Real-time management of your E-commerce platform.'],
        'users-section': ['Customer Management', 'Register and retrieve customer details.'],
        'products-section': ['Inventory Management', 'Manage product catalog.'],
        'orders-section': ['Order Management', 'Process and link customer orders.'],
        'settings-section': ['Gateway Configuration', 'Manage API connections and environment settings.']
    };

    document.getElementById('page-title').innerText = titles[sectionId][0];
    document.getElementById('page-subtitle').innerText = titles[sectionId][1];
}

/* API Interactions */

// 1. Create User
async function createUser(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Processing...';
    btn.disabled = true;

    const payload = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value
    };

    try {
        const response = await fetch(`${gatewayUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed');

        showToast(`Customer registered! ID: ${data.userId || data.id}`, 'success');
        event.target.reset();
    } catch (err) {
        showToast(`Error registering customer: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 2. Get User — fetches all users then finds by ID (service has no GET /users/:id)
async function getUser(event) {
    event.preventDefault();

    const userId = parseInt(document.getElementById('searchUserId').value);
    const resultBox = document.getElementById('userDetailsResult');
    resultBox.innerHTML = 'Searching...';
    resultBox.classList.remove('hidden');

    try {
        const response = await fetch(`${gatewayUrl}/users`, {
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw new Error('Could not reach user service');

        const users = await response.json();
        const data = users.find(u => u.id === userId);

        if (!data) {
            resultBox.innerHTML = `<p style="color:#ef4444">No customer found with ID ${userId}</p>`;
            return;
        }

        resultBox.innerHTML = `
            <div class="data-row"><span class="data-label">ID</span><span class="data-value">${data.id}</span></div>
            <div class="data-row"><span class="data-label">Name</span><span class="data-value">${data.name}</span></div>
            <div class="data-row"><span class="data-label">Email</span><span class="data-value">${data.email}</span></div>
        `;
    } catch (err) {
        resultBox.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
    }
}

// 3. Create Product
async function createProduct(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Adding...';
    btn.disabled = true;

    const payload = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDesc').value
    };

    try {
        const response = await fetch(`${gatewayUrl}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed');

        showToast(`Product added! ID: ${data.productId}`, 'success');
        event.target.reset();
    } catch (err) {
        showToast(`Error adding product: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 4. Create Order
async function createOrder(event) {
    event.preventDefault();

    const btn = event.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Placing...';
    btn.disabled = true;

    const payload = {
        user_id: parseInt(document.getElementById('orderUserId').value),
        product_id: parseInt(document.getElementById('orderProductId').value),
        quantity: parseInt(document.getElementById('orderQuantity').value)
    };

    try {
        const response = await fetch(`${gatewayUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed');

        showToast(`Order placed! Order ID: ${data.orderId}`, 'success');
        event.target.reset();
    } catch (err) {
        showToast(`Error creating order: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Save Gateway URL
function saveSettings(event) {
    event.preventDefault();
    const newUrl = document.getElementById('gatewayUrl').value.trim().replace(/\/$/, '');
    if (!newUrl) {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    gatewayUrl = newUrl;
    localStorage.setItem('gatewayUrl', gatewayUrl);
    showToast('Gateway URL saved!', 'success');
    checkGatewayStatus();
}

// FIX: toast now correctly targets #toast + #toast-message + #toast-icon (matching index.html)
function showToast(msg, type) {
    const toast = document.getElementById('toast');
    const message = document.getElementById('toast-message');
    const icon = document.getElementById('toast-icon');

    if (!toast || !message) { console.log(msg); return; }

    message.textContent = msg;

    if (icon) {
        icon.className = type === 'error'
            ? 'ri-error-warning-line'
            : 'ri-checkbox-circle-line';
    }

    toast.className = 'toast';
    toast.classList.add('show', type === 'error' ? 'error' : 'success');

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.classList.remove('show', 'error', 'success');
        toast.classList.add('hidden');
    }, 4000);
}

// FIX: gateway status now updates the dashboard stat cards AND header badge
async function checkGatewayStatus() {
    const gatewayBadge = document.getElementById('gateway-status');

    // Helper to update both the header badge and the dashboard stat card
    const setServiceStatus = (serviceId, ok, label) => {
        // Dashboard stat card <p> by id e.g. "users-status"
        const el = document.getElementById(`${serviceId}-status`);
        if (el) {
            el.textContent = ok ? 'Operational' : 'Unreachable';
            el.style.color = ok ? '' : '#ef4444';
        }
    };

    if (gatewayBadge) {
        gatewayBadge.innerHTML = '<span class="pulse-dot"></span> Checking...';
        gatewayBadge.style.color = '';
    }

    // Check gateway root
    let gatewayOk = false;
    try {
        const res = await fetch(`${gatewayUrl}/`, { signal: AbortSignal.timeout(8000) });
        gatewayOk = res.ok || res.status < 500;
    } catch {
        gatewayOk = false;
    }

    if (gatewayBadge) {
        gatewayBadge.innerHTML = gatewayOk
            ? '<span class="pulse-dot"></span> Gateway Online'
            : '<span class="pulse-dot" style="background:#ef4444"></span> Gateway Offline';
    }

    // Check each service via gateway and update dashboard cards
    const services = [
        { id: 'users',    url: `${gatewayUrl}/users` },
        { id: 'products', url: `${gatewayUrl}/products` },
        { id: 'orders',   url: `${gatewayUrl}/orders` },
    ];

    for (const svc of services) {
        try {
            const res = await fetch(svc.url, { signal: AbortSignal.timeout(8000) });
            setServiceStatus(svc.id, res.ok);
        } catch {
            setServiceStatus(svc.id, false);
        }
    }
}
