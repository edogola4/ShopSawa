// backend/public/admin.js

const API_BASE = 'http://localhost:5001/api/v1';
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let selectedTags = [];
let selectedImages = [];
let availableCategories = [];

// ✅ FIXED: Add duplicate prevention flags
let eventListenersInitialized = false;
let isCreatingProduct = false;

// ✅ FIXED: Enhanced currentUser restoration with error handling
try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
        currentUser = JSON.parse(storedUser);
        console.log('✅ currentUser restored from localStorage:', currentUser);
    } else {
        console.log('⚠️ No valid currentUser in localStorage');
    }
} catch (error) {
    console.log('⚠️ Could not restore currentUser from localStorage:', error);
    localStorage.removeItem('currentUser'); // Clear corrupted data
}

// ✅ NEW: Helper function to restore currentUser from API
async function restoreCurrentUser() {
    console.log('🔧 Attempting to restore currentUser from API...');
    
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('✅ currentUser restored from API:', currentUser);
            return true;
        } else {
            console.log('⚠️ Could not restore currentUser from API, status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error restoring currentUser:', error);
        return false;
    }
}

// ✅ FIXED: Enhanced DOM initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking auth token:', authToken ? 'exists' : 'none');
    console.log('currentUser restored from localStorage:', currentUser ? 'yes' : 'no');
    
    if (authToken) {
        // ✅ If we have token but no currentUser, try to restore it
        if (!currentUser) {
            console.log('Token exists but no currentUser, attempting to restore...');
            restoreCurrentUser().then((success) => {
                if (success) {
                    showDashboard();
                    loadDashboardData();
                } else {
                    console.log('❌ Failed to restore user session, redirecting to login');
                    logout(); // Clear invalid session
                }
            });
        } else {
            showDashboard();
            loadDashboardData();
        }
    }
    initializeEventListeners();
});

// ✅ ENHANCED login function (replace existing login event listener)
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
            
            // ✅ FIXED: Ensure currentUser is properly stored
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            console.log('✅ Login successful - currentUser set:', currentUser);
            console.log('✅ User ID:', currentUser._id);
            console.log('✅ User role:', currentUser.role);
            
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

// ✅ FIXED: Enhanced logout function
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('currentUser'); // ✅ Clear stored user
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
    
    // Get the latest auth token in case it was updated
    const token = localStorage.getItem('adminToken') || authToken;
    
    // Set up default headers
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(options.headers || {})
    };
    
    // Create config with defaults
    const config = {
        method: 'GET',
        credentials: 'include', // Important for cookies if using httpOnly
        ...options,
        headers
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        console.log('API response:', {
            url: `${API_BASE}${endpoint}`,
            status: response.status,
            statusText: response.statusText,
            data
        });
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.log('Authentication required, redirecting to login');
            logout();
            throw new Error('Your session has expired. Please log in again.');
        }
        
        // Handle other error statuses
        if (!response.ok) {
            throw new Error(data.message || `API request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API call error:', {
            url: `${API_BASE}${endpoint}`,
            error: error.message,
            stack: error.stack
        });
        
        // Show user-friendly error message
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check your connection and try again.');
        }
        
        throw error; // Re-throw the error for the caller to handle
    }
}

// ===== CATEGORY MANAGEMENT FUNCTIONS =====

async function loadCategories() {
    console.log('Loading categories...');
    try {
        const data = await apiCall('/categories');
        availableCategories = data.data.categories || [];
        console.log('Categories loaded:', availableCategories);
        populateCategoryDropdown();
    } catch (error) {
        console.error('Categories loading error:', error);
        showAlert('Error loading categories: ' + error.message, 'error');
    }
}

function populateCategoryDropdown() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;

    categorySelect.innerHTML = '<option value="">Select a category</option>';

    if (availableCategories.length === 0) {
        const option = document.createElement('option');
        option.value = 'create-new';
        option.textContent = 'Create First Category';
        option.style.color = '#667eea';
        categorySelect.appendChild(option);
        return;
    }

    availableCategories.forEach(category => {
        if (category.isActive) {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        }
    });

    const createOption = document.createElement('option');
    createOption.value = 'create-new';
    createOption.textContent = '+ Create New Category';
    createOption.style.color = '#667eea';
    createOption.style.fontStyle = 'italic';
    categorySelect.appendChild(createOption);
}

function handleCategorySelection() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;

    categorySelect.addEventListener('change', function() {
        if (this.value === 'create-new') {
            const categoryName = prompt('Enter new category name:');
            if (categoryName && categoryName.trim()) {
                createNewCategory(categoryName.trim());
            } else {
                this.value = '';
            }
        }
    });
}

async function createNewCategory(name) {
    try {
        const categoryData = {
            name: name,
            description: `${name} category`,
            isActive: true
        };

        const response = await apiCall('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });

        showAlert('✅ Category created successfully!', 'success');
        await loadCategories();
        
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect && response.data.category) {
            categorySelect.value = response.data.category._id;
        }

    } catch (error) {
        console.error('Category creation error:', error);
        showAlert('❌ Error creating category: ' + error.message, 'error');
        
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            categorySelect.value = '';
        }
    }
}

function validateCategorySelection(formData) {
    if (!formData.category || formData.category === '') {
        showAlert('❌ Please select a category', 'error');
        return false;
    }

    if (formData.category === 'create-new') {
        showAlert('❌ Please create a category first', 'error');
        return false;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(formData.category)) {
        showAlert('❌ Invalid category selected. Please refresh and try again.', 'error');
        return false;
    }

    return true;
}

// ===== DASHBOARD AND DATA LOADING =====

async function loadDashboardData() {
    console.log('Loading dashboard data...');
    try {
        const dashboardData = await apiCall('/admin/dashboard');
        const overview = dashboardData.data.overview;

        document.getElementById('totalUsers').textContent = overview.totalUsers.toLocaleString();
        document.getElementById('totalOrders').textContent = overview.totalOrders.toLocaleString();
        document.getElementById('totalProducts').textContent = overview.totalProducts.toLocaleString();
        document.getElementById('totalRevenue').textContent = overview.totalRevenue.toLocaleString();

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

        await loadCategories();

        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showAlert('Error loading dashboard data: ' + error.message, 'error');
    }
}

function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

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

// ===== DATA LOADING FUNCTIONS =====

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

async function loadProducts() {
    console.log('🔄 Loading products...');
    try {
        const data = await apiCall('/products');
        console.log('📦 Products API response:', data);
        
        const products = data.data.products || [];
        console.log(`📊 Found ${products.length} products:`);
        
        products.forEach((product, index) => {
            console.log(`${index + 1}. "${product.name}" - Status: ${product.status} - Category:`, product.category?.name || 'No category');
        });

        if (products.length === 0) {
            document.getElementById('productsTable').innerHTML = `
                <div class="alert alert-error">
                    <h4>📦 No Products Found</h4>
                    <p>No products have been created yet.</p>
                    <button class="btn btn-success" data-action="show-add-product">➕ Create Your First Product</button>
                </div>
            `;
            return;
        }

        const productsHtml = `
            <div style="margin-bottom: 15px;">
                <strong>📊 Total Products: ${products.length}</strong>
                <button class="btn btn-primary" onclick="loadProducts()" style="float: right;">🔄 Refresh</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Category</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><strong>${product.name}</strong></td>
                            <td>${product.sku || 'N/A'}</td>
                            <td>KES ${product.price ? product.price.toLocaleString() : '0'}</td>
                            <td>${product.inventory ? product.inventory.quantity : 'N/A'}</td>
                            <td><span class="status-badge status-${product.status}">${product.status}</span></td>
                            <td>${product.category?.name || 'No Category'}</td>
                            <td>${new Date(product.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-primary" onclick="editProduct('${product._id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('productsTable').innerHTML = productsHtml;
        console.log('✅ Products loaded and displayed successfully');
        
    } catch (error) {
        console.error('❌ Products loading error:', error);
        showAlert('Error loading products: ' + error.message, 'error');
        
        document.getElementById('productsTable').innerHTML = `
            <div class="alert alert-error">
                <h4>❌ Error Loading Products</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadProducts()">🔄 Retry</button>
            </div>
        `;
    }
}

async function loadAnalytics() {
    console.log('Loading analytics...');
    try {
        const period = document.getElementById('analyticsperiod').value;
        
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
                                <tr><th>Product</th><th>Revenue</th><th>Sold</th></tr>
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
                                <tr><th>Customer</th><th>Spent</th><th>Orders</th></tr>
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
            document.getElementById('analyticsContent').innerHTML = `
                <div class="alert alert-error">
                    <h4>📊 Analytics Coming Soon</h4>
                    <p>Advanced analytics features are not yet implemented.</p>
                </div>
            `;
        }
        
        console.log('Analytics loaded successfully');
    } catch (error) {
        console.error('Analytics loading error:', error);
        showAlert('Error loading analytics: ' + error.message, 'error');
    }
}

// ===== FIXED PRODUCT MANAGEMENT FUNCTIONS =====

function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
    document.getElementById('addProductForm').classList.add('active');
    
    document.getElementById('productForm').reset();
    selectedTags = [];
    selectedImages = [];
    updateTagDisplay();
    updateImagePreview();
    
    // ✅ Reset submit button state
    const submitButton = document.querySelector('#productForm button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Product';
    }
    
    if (availableCategories.length === 0) {
        loadCategories();
    } else {
        populateCategoryDropdown();
    }
}

function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    document.getElementById('addProductForm').classList.remove('active');
    document.getElementById('productForm').reset();
    selectedTags = [];
    selectedImages = [];
    updateTagDisplay();
    updateImagePreview();
    
    // ✅ Reset creation flag when closing form
    isCreatingProduct = false;
}

function addTag(tagText) {
    const tag = tagText.trim();
    if (tag && !selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateTagDisplay();
    }
}

function removeTag(tagText) {
    selectedTags = selectedTags.filter(tag => tag !== tagText);
    updateTagDisplay();
}

function updateTagDisplay() {
    const tagInput = document.getElementById('tagInput');
    const existingTags = tagInput.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());

    selectedTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="remove-tag" onclick="removeTag('${tag}')">×</span>
        `;
        tagInput.insertBefore(tagElement, document.getElementById('tagInputField'));
    });
}

function handleImageUpload(files) {
    Array.from(files).forEach(file => {
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert('❌ Image too large. Max size is 5MB.', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImages.push({
                    file: file,
                    url: e.target.result,
                    name: file.name
                });
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

function updateImagePreview() {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = selectedImages.map((image, index) => `
        <div style="position: relative; display: inline-block;">
            <img src="${image.url}" alt="${image.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 2px solid #ddd;">
            <button type="button" onclick="removeImage(${index})" style="position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">×</button>
        </div>
    `).join('');
}

// ✅ COMPLETELY FIXED: Enhanced createProduct with all fixes
async function createProduct(formData) {
    // Prevent duplicate submissions
    if (isCreatingProduct) {
        console.log('⚠️ Product creation already in progress, ignoring duplicate call');
        return;
    }
    
    isCreatingProduct = true;
    console.log('🔄 Creating product...');
    
    // Disable submit button to prevent multiple clicks
    const submitButton = document.querySelector('#productForm button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating...';
    }
    
    try {
        // ✅ FIXED: Enhanced currentUser validation with restoration
        if (!currentUser || !currentUser._id) {
            console.log('⚠️ currentUser not available, attempting to restore...');
            
            if (authToken) {
                const restored = await restoreCurrentUser();
                if (!restored) {
                    console.error('❌ Could not restore currentUser');
                    showAlert('❌ Please login again - user session expired', 'error');
                    logout();
                    return;
                }
            } else {
                console.error('❌ No auth token available');
                showAlert('❌ Please login again', 'error');
                logout();
                return;
            }
        }
        
        console.log('✅ currentUser validated:', currentUser._id);
        
        if (!validateCategorySelection(formData)) {
            return;
        }

        if (!formData.name || !formData.description || !formData.price) {
            showAlert('❌ Please fill in all required fields', 'error');
            return;
        }

        let imageUrls = [];
        
        if (selectedImages.length > 0) {
            console.log('📤 Uploading', selectedImages.length, 'images...');
            for (const [index, imageData] of selectedImages.entries()) {
                const imageFormData = new FormData();
                imageFormData.append('image', imageData.file); // ✅ Use 'image' (singular) to match backend
                
                console.log(`📸 Uploading image ${index + 1}:`, {
                    name: imageData.file.name,
                    size: imageData.file.size,
                    type: imageData.file.type
                });
                
                try {
                    const imageResponse = await fetch(`${API_BASE}/products/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                            // ✅ FIXED: Don't set Content-Type for FormData
                        },
                        body: imageFormData
                    });
                    
                    console.log(`📸 Image ${index + 1} upload response:`, imageResponse.status);
                    
                    if (imageResponse.ok) {
                        const imageResult = await imageResponse.json();
                        if (imageResult.status === 'success' && imageResult.data.url) {
                            imageUrls.push(imageResult.data.url);
                            console.log('✅ Image uploaded successfully:', imageResult.data.url);
                        } else {
                            console.error('❌ Unexpected response format:', imageResult);
                        }
                    } else {
                        // ✅ Get detailed error info
                        const errorData = await imageResponse.json();
                        console.error('❌ Image upload failed:', {
                            status: imageResponse.status,
                            statusText: imageResponse.statusText,
                            error: errorData
                        });
                        showAlert(`⚠️ Image ${index + 1} upload failed: ${errorData.message || imageResponse.statusText}`, 'error');
                    }
                } catch (imageError) {
                    console.error('❌ Image upload network error:', imageError);
                    showAlert(`⚠️ Network error uploading image ${index + 1}`, 'error');
                }
            }
            
            console.log(`📸 Upload complete: ${imageUrls.length}/${selectedImages.length} images uploaded successfully`);
        }

        const cleanFormData = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            status: formData.status || 'active',
            inventory: {
                quantity: formData.inventory?.quantity || 0,
                lowStockThreshold: formData.inventory?.lowStockAlert || 5,
                trackQuantity: true
            },
            createdBy: currentUser._id // ✅ Now guaranteed to exist
        };

        if (formData.sku && formData.sku.trim()) {
            cleanFormData.sku = formData.sku.trim();
        }

        if (formData.comparePrice) cleanFormData.comparePrice = formData.comparePrice;
        if (formData.costPrice) cleanFormData.costPrice = formData.costPrice;
        if (formData.weight) cleanFormData.dimensions = { weight: formData.weight };
        if (formData.seo?.title || formData.seo?.description) cleanFormData.seo = formData.seo;

        if (imageUrls.length > 0) {
            cleanFormData.images = imageUrls.map((url, index) => ({
                public_id: `product_${Date.now()}_${index}`,
                url: url,
                alt: formData.name,
                isMain: index === 0
            }));
        }

        if (selectedTags.length > 0) {
            cleanFormData.tags = selectedTags;
        }

        console.log('📦 Sending product data to API:', cleanFormData);

        const response = await apiCall('/products', {
            method: 'POST',
            body: JSON.stringify(cleanFormData)
        });

        console.log('✅ Product created successfully:', response);
        showAlert('✅ Product created successfully!', 'success');
        hideAddProductForm();
        
        // Force refresh with delay to ensure backend processing
        setTimeout(() => {
            loadProducts();
        }, 500);

    } catch (error) {
        console.error('❌ Product creation error:', error);
        showAlert('❌ Error creating product: ' + error.message, 'error');
    } finally {
        // ✅ Always reset the flag and button state
        isCreatingProduct = false;
        
        const submitButton = document.querySelector('#productForm button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Product';
        }
    }
}

// ===== ADMIN ACTIONS =====

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

// ===== FIXED EVENT LISTENERS =====

function initializeEventListeners() {
    // Prevent duplicate initialization
    if (eventListenersInitialized) {
        console.log('⚠️ Event listeners already initialized, skipping...');
        return;
    }
    
    console.log('🔧 Initializing event listeners...');
    
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab') || this.textContent.toLowerCase().replace(/\s+/g, '');
            showTab(tabName);
        });
    });
    
    // Global click handlers
    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        if (!action) return;
        
        switch(action) {
            case 'refresh-orders': loadOrders(); break;
            case 'refresh-users': loadUsers(); break;
            case 'refresh-products': loadProducts(); break;
            case 'refresh-analytics': loadAnalytics(); break;
            case 'show-create-user': showCreateUserForm(); break;
            case 'hide-create-user': hideCreateUserForm(); break;
            case 'show-add-product': showAddProductForm(); break;
            case 'hide-add-product': hideAddProductForm(); break;
            case 'logout': logout(); break;
        }
    });
    
    // Admin user form
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

    // ✅ FIXED: Product form with duplicate prevention
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Prevent duplicate submissions
            if (isCreatingProduct) {
                console.log('⚠️ Form submission ignored - product creation in progress');
                return;
            }
            
            console.log('📝 Product form submitted');
            
            const formData = {
                name: document.getElementById('productName').value,
                sku: document.getElementById('productSku').value || undefined,
                description: document.getElementById('productDescription').value,
                price: parseFloat(document.getElementById('productPrice').value),
                comparePrice: parseFloat(document.getElementById('productComparePrice').value) || undefined,
                costPrice: parseFloat(document.getElementById('productCostPrice').value) || undefined,
                inventory: {
                    quantity: parseInt(document.getElementById('productStock').value),
                    lowStockAlert: parseInt(document.getElementById('productMinStock').value) || 5,
                    trackQuantity: true
                },
                weight: parseFloat(document.getElementById('productWeight').value) || undefined,
                category: document.getElementById('productCategory').value,
                status: document.getElementById('productStatus').value,
                seo: {
                    title: document.getElementById('productMetaTitle').value || undefined,
                    description: document.getElementById('productMetaDescription').value || undefined
                }
            };

            await createProduct(formData);
        });
    }

    // Tag input
    const tagInputField = document.getElementById('tagInputField');
    if (tagInputField) {
        tagInputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = this.value.trim();
                if (tag) {
                    addTag(tag);
                    this.value = '';
                }
            }
        });
    }

    // Product images
    const productImages = document.getElementById('productImages');
    if (productImages) {
        productImages.addEventListener('change', function(e) {
            handleImageUpload(e.target.files);
        });
    }

    // Category selection
    handleCategorySelection();

    // Drag and drop for images
    const imageUploadArea = document.querySelector('.image-upload-area');
    if (imageUploadArea) {
        imageUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#667eea';
            this.style.background = '#f0f4ff';
        });

        imageUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ccc';
            this.style.background = '#fafafa';
        });

        imageUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ccc';
            this.style.background = '#fafafa';
            handleImageUpload(e.dataTransfer.files);
        });
    }
    
    // ✅ Mark as initialized
    eventListenersInitialized = true;
    console.log('✅ Event listeners initialized successfully');
}

// ===== UTILITY FUNCTIONS =====

function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// ===== DEBUG FUNCTION =====

window.debugProductCreation = function() {
    console.log('=== COMPREHENSIVE PRODUCT CREATION DEBUG ===');
    console.log('1. Auth token exists:', !!authToken);
    console.log('2. Auth token value:', authToken ? authToken.substring(0, 20) + '...' : 'null');
    console.log('3. currentUser:', currentUser);
    console.log('4. currentUser._id:', currentUser?._id);
    console.log('5. Categories loaded:', availableCategories.length);
    console.log('6. Available categories:', availableCategories.map(c => c.name));
    console.log('7. isCreatingProduct flag:', isCreatingProduct);
    console.log('8. eventListenersInitialized:', eventListenersInitialized);
    console.log('9. Product form exists:', !!document.getElementById('productForm'));
    console.log('10. Category dropdown exists:', !!document.getElementById('productCategory'));
    console.log('11. Selected images:', selectedImages.length);
    console.log('12. Selected tags:', selectedTags);
    console.log('13. localStorage adminToken:', !!localStorage.getItem('adminToken'));
    console.log('14. localStorage currentUser:', !!localStorage.getItem('currentUser'));
    console.log('===============================================');
    
    // Test API connection
    if (authToken) {
        console.log('🧪 Testing API connection...');
        fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            console.log('🌐 API test response:', response.status, response.ok ? 'SUCCESS' : 'FAILED');
            return response.json();
        }).then(data => {
            console.log('🌐 API test data:', data);
        }).catch(error => {
            console.log('🌐 API test error:', error);
        });
    }
};

// ===== GLOBAL FUNCTIONS =====

window.updateOrderStatus = updateOrderStatus;
window.toggleUserStatus = toggleUserStatus;
window.showCreateUserForm = showCreateUserForm;
window.hideCreateUserForm = hideCreateUserForm;
window.showAddProductForm = showAddProductForm;
window.hideAddProductForm = hideAddProductForm;
window.editProduct = editProduct;
window.loadOrders = loadOrders;
window.loadUsers = loadUsers;
window.loadProducts = loadProducts;
window.loadAnalytics = loadAnalytics;
window.logout = logout;
window.showTab = showTab;
window.addTag = addTag;
window.removeTag = removeTag;
window.removeImage = removeImage;

console.log('✅ Admin.js loaded successfully!');