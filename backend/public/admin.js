// backend/public/admin.js

const API_BASE = 'http://localhost:5001/api/v1';
let authToken = localStorage.getItem('adminToken');
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking auth token:', authToken ? 'exists' : 'none');
    if (authToken) {
        showDashboard();
        loadDashboardData();
    }
    initializeEventListeners();
});

// Authentication
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Attempting login for:', email);

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);

        if (data.status === 'success') {
            authToken = data.token;
            currentUser = data.data.user;
            localStorage.setItem('adminToken', authToken);
            
            console.log('User role:', currentUser.role);
            
            if (['admin', 'super_admin'].includes(currentUser.role)) {
                showDashboard();
                loadDashboardData();
                showAlert('✅ Login successful!', 'success');
            } else {
                showAlert('❌ Access denied. Admin privileges required.', 'error');
            }
        } else {
            showAlert('❌ ' + (data.message || 'Login failed'), 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('❌ Network error: ' + error.message, 'error');
    }
});

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('adminToken');
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    showAlert('✅ Logged out successfully', 'success');
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

// API helper function
async function apiCall(endpoint, options = {}) {
    console.log('API call to:', `${API_BASE}${endpoint}`);
    
    const config = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    console.log('API response:', response.status, data);
    
    if (!response.ok) {
        throw new Error(data.message || 'API call failed');
    }
    
    return data;
}

// Load dashboard data
async function loadDashboardData() {
    console.log('Loading dashboard data...');
    try {
        const dashboardData = await apiCall('/admin/dashboard');
        const overview = dashboardData.data.overview;

        document.getElementById('totalUsers').textContent = overview.totalUsers.toLocaleString();
        document.getElementById('totalOrders').textContent = overview.totalOrders.toLocaleString();
        document.getElementById('totalProducts').textContent = overview.totalProducts.toLocaleString();
        document.getElementById('totalRevenue').textContent = overview.totalRevenue.toLocaleString();

        // Load recent orders
        const recentOrdersHtml = dashboardData.data.recentActivity.orders.map(order => `
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>#${order.orderNumber}</strong> - ${order.customer.firstName} ${order.customer.lastName}
                <br>
                <span class="status-badge status-${order.status}">${order.status}</span>
                KES ${order.summary.total.toLocaleString()}
                <small style="color: #666;">(${new Date(order.createdAt).toLocaleDateString()})</small>
            </div>
        `).join('');
        document.getElementById('recentOrders').innerHTML = recentOrdersHtml || '<p>No recent orders</p>';

        // Load recent users
        const recentUsersHtml = dashboardData.data.recentActivity.users.map(user => `
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${user.firstName} ${user.lastName}</strong>
                <br>
                ${user.email} - <span style="color: #667eea;">${user.role}</span>
                <br>
                <small style="color: #666;">${new Date(user.createdAt).toLocaleDateString()}</small>
            </div>
        `).join('');
        document.getElementById('recentUsers').innerHTML = recentUsersHtml || '<p>No recent users</p>';

        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showAlert('Error loading dashboard data: ' + error.message, 'error');
    }
}

// Tab management
function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    // Show selected tab
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Load tab-specific data
    switch(tabName) {
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Load orders
async function loadOrders() {
    console.log('Loading orders...');
    try {
        const data = await apiCall('/admin/orders');
        const orders = data.data.orders;

        const ordersHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>#${order.orderNumber}</td>
                            <td>${order.customer.firstName} ${order.customer.lastName}</td>
                            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                            <td>KES ${order.summary.total.toLocaleString()}</td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-primary" onclick="updateOrderStatus('${order._id}', 'confirmed')">Confirm</button>
                                <button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'shipped')">Ship</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('ordersTable').innerHTML = ordersHtml;
        console.log('Orders loaded successfully');
        
    } catch (error) {
        console.error('Orders loading error:', error);
        showAlert('Error loading orders: ' + error.message, 'error');
    }
}

// Load users
async function loadUsers() {
    console.log('Loading users...');
    try {
        const data = await apiCall('/admin/users');
        const users = data.data.users;

        const usersHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.firstName} ${user.lastName}</td>
                            <td>${user.email}</td>
                            <td><span style="color: #667eea;">${user.role}</span></td>
                            <td>
                                <span class="status-badge ${user.isActive ? 'status-confirmed' : 'status-cancelled'}">
                                    ${user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn ${user.isActive ? 'btn-danger' : 'btn-success'}" 
                                        onclick="toggleUserStatus('${user._id}', ${user.isActive})">
                                    ${user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('usersTable').innerHTML = usersHtml;
        console.log('Users loaded successfully');
        
    } catch (error) {
        console.error('Users loading error:', error);
        showAlert('Error loading users: ' + error.message, 'error');
    }
}

// Load products - FIXED: Removed double /api/v1/ path
async function loadProducts() {
    console.log('Loading products...');
    try {
        const data = await apiCall('/products'); // ✅ FIXED: Was '/api/v1/products'
        const products = data.data.products;

        const productsHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.sku}</td>
                            <td>KES ${product.price.toLocaleString()}</td>
                            <td>${product.inventory ? product.inventory.quantity : 'N/A'}</td>
                            <td><span class="status-badge status-${product.status}">${product.status}</span></td>
                            <td>${product.category.name}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editProduct('${product._id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('productsTable').innerHTML = productsHtml;
        console.log('Products loaded successfully');
        
    } catch (error) {
        console.error('Products loading error:', error);
        showAlert('Error loading products: ' + error.message, 'error');
        
        // Show fallback message
        document.getElementById('productsTable').innerHTML = `
            <div class="alert alert-error">
                <p>Unable to load products: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadProducts()">Retry</button>
            </div>
        `;
    }
}

// Load analytics
async function loadAnalytics() {
    console.log('Loading analytics...');
    try {
        const period = document.getElementById('analyticsperiod').value;
        
        // Note: These endpoints may not exist yet in your minimal admin routes
        // If they fail, we'll show a placeholder
        try {
            const [salesData, customerData] = await Promise.all([
                apiCall(`/admin/dashboard/sales?period=${period}`),
                apiCall(`/admin/dashboard/customers?period=${period}`)
            ]);

            const analyticsHtml = `
                <div class="grid-2">
                    <div>
                        <h4>Top Selling Products</h4>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Revenue</th>
                                    <th>Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${salesData.data.topSellingProducts.map(product => `
                                    <tr>
                                        <td>${product.productName}</td>
                                        <td>KES ${product.totalRevenue.toLocaleString()}</td>
                                        <td>${product.totalSold}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h4>Top Customers</h4>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Spent</th>
                                    <th>Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${customerData.data.topCustomers.map(customer => `
                                    <tr>
                                        <td>${customer.customerName}</td>
                                        <td>KES ${customer.totalSpent.toLocaleString()}</td>
                                        <td>${customer.orderCount}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            document.getElementById('analyticsContent').innerHTML = analyticsHtml;
        } catch (analyticsError) {
            // Fallback if advanced analytics endpoints don't exist
            document.getElementById('analyticsContent').innerHTML = `
                <div class="alert alert-error">
                    <h4>📊 Analytics Coming Soon</h4>
                    <p>Advanced analytics features are not yet implemented in your current admin routes.</p>
                    <p>You can view basic statistics in the Overview tab.</p>
                </div>
            `;
        }
        
        console.log('Analytics loaded successfully');
    } catch (error) {
        console.error('Analytics loading error:', error);
        showAlert('Error loading analytics: ' + error.message, 'error');
    }
}

// Admin actions
async function updateOrderStatus(orderId, status) {
    console.log('Updating order status:', orderId, status);
    try {
        await apiCall(`/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, note: `Order ${status} by admin` })
        });
        showAlert(`✅ Order status updated to ${status}`, 'success');
        loadOrders();
    } catch (error) {
        console.error('Order update error:', error);
        showAlert('❌ Error updating order: ' + error.message, 'error');
    }
}

async function toggleUserStatus(userId, isActive) {
    console.log('Toggling user status:', userId, isActive);
    try {
        const action = isActive ? 'deactivate' : 'activate';
        await apiCall(`/admin/users/${userId}/${action}`, {
            method: 'PATCH'
        });
        showAlert(`✅ User ${action}d successfully`, 'success');
        loadUsers();
    } catch (error) {
        console.error('User toggle error:', error);
        showAlert('❌ Error updating user: ' + error.message, 'error');
    }
}

// Create admin user functions
function showCreateUserForm() {
    document.getElementById('createUserForm').style.display = 'block';
}

function hideCreateUserForm() {
    document.getElementById('createUserForm').style.display = 'none';
    document.getElementById('adminUserForm').reset();
}

function editProduct(productId) {
    showAlert('🔧 Product editing feature coming soon!', 'success');
}

// Initialize all event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Tab navigation using data-tab attributes
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab') || this.textContent.toLowerCase().replace(/\s+/g, '');
            showTab(tabName);
        });
    });
    
    // Action buttons using data-action attributes
    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        if (!action) return;
        
        switch(action) {
            case 'refresh-orders':
                loadOrders();
                break;
            case 'refresh-users':
                loadUsers();
                break;
            case 'refresh-products':
                loadProducts();
                break;
            case 'refresh-analytics':
                loadAnalytics();
                break;
            case 'show-create-user':
                showCreateUserForm();
                break;
            case 'hide-create-user':
                hideCreateUserForm();
                break;
            case 'logout':
                logout();
                break;
        }
    });
    
    // Admin user form submission
    const adminUserForm = document.getElementById('adminUserForm');
    if (adminUserForm) {
        adminUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('adminEmail').value,
                phone: document.getElementById('adminPhone').value,
                password: document.getElementById('adminPassword').value,
                role: document.getElementById('role').value
            };

            try {
                await apiCall('/admin/users', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                showAlert('✅ Admin user created successfully', 'success');
                hideCreateUserForm();
                loadUsers();
            } catch (error) {
                console.error('User creation error:', error);
                showAlert('❌ Error creating user: ' + error.message, 'error');
            }
        });
    }
    
    console.log('Event listeners initialized');
}

// Utility functions
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Global functions for onclick handlers (backward compatibility)
window.updateOrderStatus = updateOrderStatus;
window.toggleUserStatus = toggleUserStatus;
window.showCreateUserForm = showCreateUserForm;
window.hideCreateUserForm = hideCreateUserForm;
window.editProduct = editProduct;
window.loadOrders = loadOrders;
window.loadUsers = loadUsers;
window.loadProducts = loadProducts;
window.loadAnalytics = loadAnalytics;
window.logout = logout;
window.showTab = showTab;