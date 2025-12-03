// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5T0f-6GmmlmyqC_uZfQfAgsNq9HQOMy4",
    authDomain: "textile-online-order.firebaseapp.com",
    projectId: "textile-online-order",
    storageBucket: "textile-online-order.firebasestorage.app",
    messagingSenderId: "752903352914",
    appId: "1:752903352914:web:3092501d540297c1ade58b",
    measurementId: "G-DJRYE3DVBG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Application State
const state = {
    products: {},
    categories: {},
    cart: [],
    isAdmin: false,
    currentView: 'home',
    activeCategory: 'all'
};

// Sample Data for Seeding
// Sample Data Removed - Relying on Firebase


// App Controller
const app = {
    init: () => {
        app.fetchData();
        app.setupListeners();
        app.navigate('home');
    },



    fetchData: () => {
        db.ref('products').on('value', (snapshot) => {
            state.products = snapshot.val() || {};
            app.render();
        }, (error) => {
            console.error("Error fetching products:", error);
            app.showToast("Error loading products: " + error.message);
        });
        db.ref('categories').on('value', (snapshot) => {
            state.categories = snapshot.val() || {};
            app.render();
        }, (error) => {
            console.error("Error fetching categories:", error);
        });
    },

    setupListeners: () => {
        // Close modals on outside click
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('active');
            }
        };
    },

    // Navigation & Routing
    navigate: (view) => {
        state.currentView = view;
        window.scrollTo(0, 0);

        // Update Active Link
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.nav-links a[onclick*="${view}"]`);
        if (link) link.classList.add('active');

        app.render();
    },

    render: () => {
        const main = document.getElementById('main-content');

        if (state.isAdmin && state.currentView === 'admin') {
            main.innerHTML = app.views.admin();
        } else if (state.currentView === 'home') {
            main.innerHTML = app.views.home();
        } else if (state.currentView === 'shop') {
            main.innerHTML = app.views.shop();
        }

        app.updateUIState();
    },

    updateUIState: () => {
        // Auth Buttons
        if (state.isAdmin) {
            document.getElementById('admin-btn').classList.add('hidden');
            document.getElementById('logout-btn').classList.remove('hidden');
            document.getElementById('dashboard-btn').classList.remove('hidden');
        } else {
            document.getElementById('admin-btn').classList.remove('hidden');
            document.getElementById('logout-btn').classList.add('hidden');
            document.getElementById('dashboard-btn').classList.add('hidden');
        }

        // Cart Count
        const count = state.cart.reduce((acc, item) => acc + item.quantity, 0);
        document.getElementById('cart-count').innerText = count;
    },

    filterCategory: (catId) => {
        state.activeCategory = catId;
        app.render();
    },

    // Views
    views: {
        home: () => `
            <section class="hero">
                <div class="container">
                    <h1>Elevate Your Style with LuxeThreads</h1>
                    <p>Discover the finest collection of premium textiles, from formal wear to traditional elegance.</p>
                    <button class="btn-primary" onclick="app.navigate('shop')">Shop Collection</button>
                </div>
            </section>
            <section class="container">
                <div class="shop-header">
                    <h2>Featured Products</h2>
                </div>
                <div class="product-grid">
                    ${app.renderProductCards(Object.values(state.products).slice(0, 3))}
                </div>
            </section>
        `,
        shop: () => {
            const filteredProducts = state.activeCategory === 'all'
                ? Object.values(state.products)
                : Object.values(state.products).filter(p => p.categoryId === state.activeCategory);

            return `
            <section class="container">
                <div class="shop-header">
                    <h2>${state.activeCategory === 'all' ? 'All Products' : (state.categories[state.activeCategory]?.name || 'Products')}</h2>
                    <div class="filters">
                        <button class="${state.activeCategory === 'all' ? 'active' : ''}" onclick="app.filterCategory('all')">All</button>
                        ${Object.values(state.categories).map(cat => `
                            <button class="${state.activeCategory === cat.id ? 'active' : ''}" onclick="app.filterCategory('${cat.id}')">${cat.name}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="product-grid">
                    ${app.renderProductCards(filteredProducts)}
                </div>
            </section>
        `},
        admin: () => `
            <section class="container admin-dashboard">
                <div class="admin-header">
                    <h2>Admin Dashboard</h2>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" onclick="app.openCategoryModal()">Manage Categories</button>
                        <button class="btn-primary" onclick="app.openAddProductModal()">+ Add New Product</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(state.products).map(p => `
                                <tr>
                                    <td><img src="${p.imageUrl}" alt="${p.name}"></td>
                                    <td>${p.name}</td>
                                    <td>${p.categoryName}</td>
                                    <td>${p.currency} ${p.price}</td>
                                    <td>${p.stockQuantity}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="btn-secondary" onclick="app.editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                                            <button class="btn-danger" onclick="app.deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `
    },

    renderProductCards: (products) => {
        if (!products.length) return '<p>No products found.</p>';
        return products.map(p => `
            <div class="product-card">
                <img src="${p.imageUrl}" alt="${p.name}" class="product-image" onclick="app.showProductDetails('${p.id}')">
                <div class="product-info">
                    <span class="product-category">${p.categoryName}</span>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price">${p.currency} ${p.price}</div>
                    <div class="card-actions">
                        <button class="btn-secondary" onclick="app.showProductDetails('${p.id}')">View</button>
                        <button class="btn-icon" onclick="app.addToCart('${p.id}')"><i class="fas fa-shopping-cart"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Auth Logic
    toggleAdminModal: () => {
        document.getElementById('admin-modal').classList.toggle('active');
    },

    handleLogin: (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === 'admin' && pass === 'admin123') {
            state.isAdmin = true;
            app.toggleAdminModal();
            app.navigate('admin');
            app.showToast('Welcome Admin!');
        } else {
            alert('Invalid Credentials! (Try admin/admin123)');
        }
    },

    logout: () => {
        state.isAdmin = false;
        app.navigate('home');
        app.showToast('Logged out successfully');
    },

    // Product Logic
    showProductDetails: (id) => {
        const p = state.products[id];
        if (!p) return;

        const html = `
            <span class="close-modal" onclick="document.getElementById('product-modal').classList.remove('active')">&times;</span>
            <div class="form-row" style="gap: 30px; align-items: start;">
                <div style="flex: 1;">
                    <img src="${p.imageUrl}" style="width: 100%; border-radius: 10px;" alt="${p.name}">
                </div>
                <div style="flex: 1;">
                    <span class="product-category">${p.categoryName}</span>
                    <h2 style="margin: 10px 0;">${p.name}</h2>
                    <p style="color: var(--text-light); margin-bottom: 20px;">${p.description}</p>
                    <div class="form-row" style="margin-bottom: 20px;">
                        <div><strong>Make:</strong> ${p.make}</div>
                        <div><strong>Model:</strong> ${p.model}</div>
                    </div>
                    <div class="form-row" style="margin-bottom: 20px;">
                        <div><strong>Color:</strong> ${p.color}</div>
                        <div><strong>Size:</strong> ${p.size}</div>
                    </div>
                    <h3 style="color: var(--primary); margin-bottom: 20px;">${p.currency} ${p.price}</h3>
                    <button class="btn-primary full-width" onclick="app.addToCart('${p.id}'); document.getElementById('product-modal').classList.remove('active')">Add to Cart</button>
                </div>
            </div>
        `;
        document.getElementById('product-details-content').innerHTML = html;
        document.getElementById('product-modal').classList.add('active');
    },

    openAddProductModal: () => {
        document.getElementById('product-form').reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('edit-modal-title').innerText = 'Add Product';

        // Populate categories
        const catSelect = document.getElementById('prod-category');
        catSelect.innerHTML = Object.values(state.categories).map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        document.getElementById('edit-product-modal').classList.add('active');
    },

    editProduct: (id) => {
        const p = state.products[id];
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-stock').value = p.stockQuantity;
        document.getElementById('prod-color').value = p.color;
        document.getElementById('prod-size').value = p.size;
        document.getElementById('prod-image').value = p.imageUrl;
        document.getElementById('prod-desc').value = p.description;

        // Populate categories and select current
        const catSelect = document.getElementById('prod-category');
        catSelect.innerHTML = Object.values(state.categories).map(c => `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${c.name}</option>`).join('');

        document.getElementById('edit-modal-title').innerText = 'Edit Product';
        document.getElementById('edit-product-modal').classList.add('active');
    },

    closeEditModal: () => {
        document.getElementById('edit-product-modal').classList.remove('active');
    },

    saveProduct: (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value || 'prod_' + Date.now();
        const catId = document.getElementById('prod-category').value;
        const category = state.categories[catId];

        const productData = {
            id: id,
            categoryId: catId,
            categoryName: category ? category.name : 'Unknown',
            name: document.getElementById('prod-name').value,
            price: Number(document.getElementById('prod-price').value),
            stockQuantity: Number(document.getElementById('prod-stock').value),
            color: document.getElementById('prod-color').value,
            size: document.getElementById('prod-size').value,
            imageUrl: document.getElementById('prod-image').value,
            description: document.getElementById('prod-desc').value,
            currency: 'INR',
            make: 'Generic', // Simplified for demo
            model: 'Standard'
        };

        db.ref('products/' + id).set(productData)
            .then(() => {
                app.closeEditModal();
                app.showToast('Product Saved!');
            })
            .catch(err => alert('Error: ' + err.message));
    },

    deleteProduct: (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            db.ref('products/' + id).remove()
                .then(() => app.showToast('Product Deleted'))
                .catch(err => alert('Error: ' + err.message));
        }
    },

    // Category Logic
    openCategoryModal: () => {
        app.renderCategoryList();
        document.getElementById('category-modal').classList.add('active');
    },

    closeCategoryModal: () => {
        document.getElementById('category-modal').classList.remove('active');
    },

    renderCategoryList: () => {
        const tbody = document.getElementById('category-list-body');
        tbody.innerHTML = Object.values(state.categories).map(c => `
            <tr>
                <td>${c.name}</td>
                <td>
                    <button class="btn-danger" onclick="app.deleteCategory('${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    addCategory: () => {
        const name = document.getElementById('new-cat-name').value.trim();
        if (!name) return alert('Please enter a category name');

        const id = 'cat_' + Date.now();
        db.ref('categories/' + id).set({
            id: id,
            name: name
        })
            .then(() => {
                document.getElementById('new-cat-name').value = '';
                app.showToast('Category Added');
                app.renderCategoryList(); // Re-render list immediately
            })
            .catch(err => alert('Error: ' + err.message));
    },

    deleteCategory: (id) => {
        if (confirm('Delete this category?')) {
            db.ref('categories/' + id).remove()
                .then(() => {
                    app.showToast('Category Deleted');
                    app.renderCategoryList();
                })
                .catch(err => alert('Error: ' + err.message));
        }
    },

    // Cart Logic
    toggleCart: () => {
        document.getElementById('cart-modal').classList.toggle('active');
        app.renderCart();
    },

    addToCart: (id) => {
        const p = state.products[id];
        const existing = state.cart.find(item => item.productId === id);

        if (existing) {
            existing.quantity++;
        } else {
            state.cart.push({
                productId: id,
                productName: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                quantity: 1
            });
        }
        app.updateUIState();
        app.showToast('Added to Cart');
    },

    renderCart: () => {
        const container = document.getElementById('cart-items');
        let total = 0;

        if (state.cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">Your cart is empty.</p>';
            document.getElementById('cart-total-amount').innerText = '₹0';
            return;
        }

        container.innerHTML = state.cart.map((item, index) => {
            total += item.price * item.quantity;
            return `
                <div class="cart-item">
                    <img src="${item.imageUrl}" alt="${item.productName}">
                    <div class="cart-item-details">
                        <h4>${item.productName}</h4>
                        <div class="cart-item-price">₹${item.price}</div>
                        <div class="cart-controls">
                            <button class="qty-btn" onclick="app.updateCartQty(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="app.updateCartQty(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('cart-total-amount').innerText = '₹' + total;
    },

    updateCartQty: (index, change) => {
        state.cart[index].quantity += change;
        if (state.cart[index].quantity <= 0) {
            state.cart.splice(index, 1);
        }
        app.renderCart();
        app.updateUIState();
    },

    checkout: () => {
        if (state.cart.length === 0) return;

        // Simple checkout simulation
        const orderId = 'ord_' + Date.now();
        const order = {
            orderId: orderId,
            orderDate: new Date().toISOString(),
            status: 'Processing',
            totalAmount: state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            items: state.cart
        };

        db.ref('orders/' + orderId).set(order)
            .then(() => {
                state.cart = [];
                app.toggleCart();
                app.updateUIState();
                alert('Order Placed Successfully! Order ID: ' + orderId);
            })
            .catch(err => alert('Error placing order: ' + err.message));
    },

    showToast: (msg) => {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 3000);
    },

    toggleMobileMenu: () => {
        const nav = document.querySelector('.nav-links');
        const auth = document.querySelector('.nav-auth');
        if (nav.style.display === 'flex') {
            nav.style.display = 'none';
            auth.style.display = 'none';
        } else {
            nav.style.display = 'flex';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '60px';
            nav.style.left = '0';
            nav.style.width = '100%';
            nav.style.background = 'white';
            nav.style.padding = '20px';
            nav.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

            auth.style.display = 'flex';
            auth.style.flexDirection = 'column';
            auth.style.position = 'absolute';
            auth.style.top = '200px'; // Approximate
            auth.style.left = '0';
            auth.style.width = '100%';
            auth.style.background = 'white';
            auth.style.padding = '0 20px 20px';
        }
    }
};

// Start App
document.addEventListener('DOMContentLoaded', app.init);
