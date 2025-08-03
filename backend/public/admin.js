// backend/public/admin.js

const API_BASE = 'http://localhost:5001/api/v1';
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let selectedTags = [];
let selectedImages = [];
let availableCategories = []; // ✅ Added for category management

// ✅ DEBUG: Add debugging variables
let eventListenersInitialized = false;
let isCreatingProduct = false;

// ✅ DEBUG: Test function to verify code is working
window.testProductCreation = function() {
    console.log('🧪 Testing product creation system...');
    console.log('1. Auth token exists:', !!authToken);
    console.log('2. Current user:', currentUser);
    console.log('3. Available categories:', availableCategories.length);
    console.log('4. Event listeners initialized:', eventListenersInitialized);
    console.log('5. Product form exists:', !!document.getElementById('productForm'));
    console.log('6. Add product button exists:', !!document.querySelector('[data-action="show-add-product"]'));
    
    // Test if we can access the form elements
    const formElements = {
        productName: document.getElementById('productName'),
        productSku: document.getElementById('productSku'),
        productDescription: document.getElementById('productDescription'),
        productPrice: document.getElementById('productPrice'),
        productCategory: document.getElementById('productCategory')
    };
    
    console.log('7. Form elements:', formElements);
    return 'Test complete - check console for results';
};

console.log('🔍 DEBUG: Admin.js loading with debugging enabled...');

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

// ===== CATEGORY MANAGEMENT FUNCTIONS =====

// Load categories when dashboard loads
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
        
        // Fallback: create a basic category if none exist
        await createDefaultCategory();
    }
}

// Populate the category dropdown
function populateCategoryDropdown() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;

    // Clear existing options
    categorySelect.innerHTML = '<option value="">Select a category</option>';

    if (availableCategories.length === 0) {
        // No categories found, show create option
        const option = document.createElement('option');
        option.value = 'create-new';
        option.textContent = 'Create First Category';
        option.style.color = '#667eea';
        categorySelect.appendChild(option);
        return;
    }

    // Add categories with ObjectIds as values
    availableCategories.forEach(category => {
        if (category.isActive) {
            const option = document.createElement('option');
            option.value = category._id; // ✅ This is the ObjectId
            option.textContent = category.name;
            categorySelect.appendChild(option);
        }
    });

    // Add create new option
    const createOption = document.createElement('option');
    createOption.value = 'create-new';
    createOption.textContent = '+ Create New Category';
    createOption.style.color = '#667eea';
    createOption.style.fontStyle = 'italic';
    categorySelect.appendChild(createOption);
}

// Create a default category
async function createDefaultCategory() {
    try {
        const categoryData = {
            name: "General",
            description: "General category for products",
            isActive: true
        };

        const response = await apiCall('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });

        console.log('Default category created:', response);
        availableCategories = [response.data.category];
        populateCategoryDropdown();
        showAlert('✅ Default category created!', 'success');
        
    } catch (error) {
        console.error('Error creating default category:', error);
        showAlert('❌ Could not create default category. Please contact support.', 'error');
    }
}

// Handle category selection
function handleCategorySelection() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;

    categorySelect.addEventListener('change', function() {
        if (this.value === 'create-new') {
            const categoryName = prompt('Enter new category name:');
            if (categoryName && categoryName.trim()) {
                createNewCategory(categoryName.trim());
            } else {
                this.value = ''; // Reset if cancelled
            }
        }
    });
}

// Create new categories
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
        await loadCategories(); // Reload categories
        
        // Select the newly created category
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect && response.data.category) {
            categorySelect.value = response.data.category._id;
        }

    } catch (error) {
        console.error('Category creation error:', error);
        showAlert('❌ Error creating category: ' + error.message, 'error');
        
        // Reset dropdown
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            categorySelect.value = '';
        }
    }
}

// Validate category selection
function validateCategorySelection(formData) {
    // Check if category is selected
    if (!formData.category || formData.category === '') {
        showAlert('❌ Please select a category', 'error');
        return false;
    }

    // Check if it's the create-new option
    if (formData.category === 'create-new') {
        showAlert('❌ Please create a category first', 'error');
        return false;
    }

    // Check if it's a valid ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(formData.category)) {
        showAlert('❌ Invalid category selected. Please refresh and try again.', 'error');
        return false;
    }

    return true;
}

// ✅ UPDATED Load dashboard data
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

        // ✅ Load categories
        await loadCategories();

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

// ✅ UPDATED Load products with enhanced debugging
async function loadProducts() {
    console.log('🔄 Loading products...');
    try {
        // ✅ Don't filter by status - get ALL products
        const data = await apiCall('/products');
        console.log('📦 Products API response:', data);
        
        const products = data.data.products || [];
        console.log(`📊 Found ${products.length} products:`);
        
        // ✅ Debug each product
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

// Load analytics
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

// ===== PRODUCT MANAGEMENT FUNCTIONS =====

// ✅ UPDATED Show/Hide Add Product Form
function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
    document.getElementById('addProductForm').classList.add('active');
    
    // Reset form
    document.getElementById('productForm').reset();
    selectedTags = [];
    selectedImages = [];
    updateTagDisplay();
    updateImagePreview();
    
    // ✅ Ensure categories are loaded and populated
    if (availableCategories.length === 0) {
        loadCategories();
    } else {
        populateCategoryDropdown();
    }
}

function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    document.getElementById('addProductForm').classList.remove('active');
    // Reset form
    document.getElementById('productForm').reset();
    selectedTags = [];
    selectedImages = [];
    updateTagDisplay();
    updateImagePreview();
}

// Tag Management
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

// Image Management
function handleImageUpload(files) {
    Array.from(files).forEach(file => {
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

// ✅ UPDATED Create Product with validation and detailed debugging
async function createProduct(formData) {
    console.log('🚀 Creating product...');
    console.log('📋 Input form data:', formData);
    
    // ✅ Validate category selection first
    console.log('🔍 Validating category selection...');
    if (!validateCategorySelection(formData)) {
        console.log('❌ Category validation failed');
        return; // Stop execution if validation fails
    }
    console.log('✅ Category validation passed');

    // ✅ Validate required fields (SKU is optional)
    console.log('🔍 Validating required fields...');
    if (!formData.name || !formData.description || !formData.price) {
        console.log('❌ Required field validation failed:', {
            name: !!formData.name,
            description: !!formData.description,
            price: !!formData.price,
            sku: !!formData.sku + ' (optional)'
        });
        showAlert('❌ Please fill in all required fields (Name, Description, Price)', 'error');
        return;
    }
    console.log('✅ Required fields validation passed');

    try {
        // If images are selected, we need to upload them first
        let imageUrls = [];
        
        if (selectedImages.length > 0) {
            console.log('📸 Uploading', selectedImages.length, 'images...');
            for (const imageData of selectedImages) {
                const imageFormData = new FormData();
                imageFormData.append('image', imageData.file);
                
                try {
                    const imageResponse = await fetch(`${API_BASE}/products/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: imageFormData
                    });
                    
                    if (imageResponse.ok) {
                        const imageResult = await imageResponse.json();
                        imageUrls.push(imageResult.data.url);
                        console.log('✅ Image uploaded:', imageResult.data.url);
                    } else {
                        console.log('❌ Image upload failed:', imageResponse.status);
                    }
                } catch (imageError) {
                    console.error('❌ Image upload error:', imageError);
                    showAlert('⚠️ Failed to upload some images', 'error');
                }
            }
        } else {
            console.log('📸 No images to upload');
        }

        // ✅ UPDATED: Prepare clean product data with fixed status default
        console.log('🔧 Preparing product data...');
        const cleanFormData = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category: formData.category, // ✅ This is now a valid ObjectId
            status: formData.status || 'active', // ✅ FIXED: Ensure default is 'active'
            inventory: {
                quantity: formData.inventory?.quantity || 0,
                lowStockThreshold: formData.inventory?.lowStockAlert || 5,
                trackQuantity: true
            }
        };

        // Add SKU only if provided
        if (formData.sku && formData.sku.trim()) {
            cleanFormData.sku = formData.sku.trim();
            console.log('➕ Added SKU:', formData.sku);
        } else {
            console.log('📝 No SKU provided - will auto-generate');
        }

        // Add optional fields if they exist
        if (formData.comparePrice) {
            cleanFormData.comparePrice = formData.comparePrice;
            console.log('➕ Added comparePrice:', formData.comparePrice);
        }
        if (formData.costPrice) {
            cleanFormData.costPrice = formData.costPrice;
            console.log('➕ Added costPrice:', formData.costPrice);
        }
        if (formData.weight) {
            cleanFormData.dimensions = { weight: formData.weight };
            console.log('➕ Added weight:', formData.weight);
        }
        if (formData.seo?.title || formData.seo?.description) {
            cleanFormData.seo = formData.seo;
            console.log('➕ Added SEO data:', formData.seo);
        }

        // Add images if uploaded
        if (imageUrls.length > 0) {
            cleanFormData.images = imageUrls.map((url, index) => ({
                public_id: `product_${Date.now()}_${index}`,
                url: url,
                alt: formData.name,
                isMain: index === 0
            }));
            console.log('➕ Added', imageUrls.length, 'images');
        }

        // Add tags if selected
        if (selectedTags.length > 0) {
            cleanFormData.tags = selectedTags;
            console.log('➕ Added', selectedTags.length, 'tags:', selectedTags);
        }

        // ✅ Add createdBy field (required)
        if (currentUser && currentUser._id) {
            cleanFormData.createdBy = currentUser._id;
            console.log('➕ Added createdBy:', currentUser._id);
        } else {
            console.log('⚠️ No currentUser._id found:', currentUser);
        }

        console.log('📤 Final product data being sent:', cleanFormData);
        console.log('🌐 Making API call to create product...');

        const response = await apiCall('/products', {
            method: 'POST',
            body: JSON.stringify(cleanFormData)
        });

        console.log('✅ Product creation API response:', response);
        showAlert('✅ Product created successfully!', 'success');
        hideAddProductForm();
        loadProducts(); // Refresh products list
        
        console.log('🎉 Product created successfully:', response);

    } catch (error) {
        console.error('❌ Product creation error details:', error);
        console.error('❌ Error stack:', error.stack);
        showAlert('❌ Error creating product: ' + error.message, 'error');
        
        // Add more detailed error logging
        if (error.message.includes('fetch')) {
            console.log('🌐 Network error - check if backend is running');
        }
        if (error.message.includes('validation')) {
            console.log('📝 Validation error - check required fields');
        }
        if (error.message.includes('auth')) {
            console.log('🔐 Authentication error - check login status');
        }
    }
}

// ===== EXISTING ADMIN ACTIONS =====

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

// ✅ UPDATED Initialize all event listeners
function initializeEventListeners() {
    console.log('🔧 Initializing event listeners...');
    
    // ✅ DEBUG: Mark as initialized
    eventListenersInitialized = true;
    
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
        
        console.log('🎯 Action clicked:', action);
        
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
            case 'show-add-product':
                console.log('🚀 Show add product clicked!');
                showAddProductForm();
                break;
            case 'hide-add-product':
                console.log('❌ Hide add product clicked!');
                hideAddProductForm();
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

    // ✅ ENHANCED Product form submission with debugging
    const productForm = document.getElementById('productForm');
    if (productForm) {
        console.log('✅ Product form found, adding event listener...');
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Product form submitted!');
            
            // ✅ Prevent double submissions
            if (isCreatingProduct) {
                console.log('⚠️ Already creating product, ignoring submission');
                return;
            }
            
            isCreatingProduct = true;
            
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
                category: document.getElementById('productCategory').value, // ✅ This will be an ObjectId
                status: document.getElementById('productStatus').value,
                seo: {
                    title: document.getElementById('productMetaTitle').value || undefined,
                    description: document.getElementById('productMetaDescription').value || undefined
                }
            };

            console.log('📋 Form data collected:', formData);
            
            try {
                await createProduct(formData);
            } catch (error) {
                console.error('❌ Product creation failed:', error);
                showAlert('❌ Failed to create product: ' + error.message, 'error');
            } finally {
                isCreatingProduct = false;
            }
        });
    } else {
        console.log('❌ Product form not found!');
    }

    // Tag input handling
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

    // Image upload handling
    const productImages = document.getElementById('productImages');
    if (productImages) {
        productImages.addEventListener('change', function(e) {
            handleImageUpload(e.target.files);
        });
    }

    // ✅ Add category selection handling
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
    
    console.log('✅ Event listeners initialized successfully');
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

console.log('✅ Category management functions loaded!');