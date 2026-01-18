// API URL (Backend address)
const API_URL = 'http://localhost:5000/api';

// --- GLOBAL VARIABLES (STATE) ---
var currentUser = null;
var authToken = null;
var cart = [];
var currentPage = 1;
var itemsPerPage = 6;

// --- INIT FUNCTION (Runs when page loads) ---
function init() {
    // Check if user is logged in from local storage
    var savedUser = localStorage.getItem('user');
    var savedToken = localStorage.getItem('token');

    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        authToken = savedToken;
    }

    // Load cart from local storage
    var savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }

    // Setup Navigation and Events
    setupEventListeners();
    renderNav();

    // Decide which page to show
    if (currentUser && currentUser.role === 'admin') {
        showSection('admin');
    } else {
        showSection('shop');
    }
}

// --- ROUTING (Showing and Hiding Sections) ---
function showSection(sectionId) {
    // Hide all sections
    var sections = document.querySelectorAll('.section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
    }

    // Logic to check permissions
    if (sectionId === 'admin') {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Access Denied. Admins only.');
            return;
        }
    }
    if (sectionId === 'cart') {
        if (!currentUser) {
            alert('Please login first.');
            showSection('auth');
            return;
        }
    }

    // Show the requested section
    document.getElementById(sectionId + '-section').classList.add('active');

    // Load data based on section
    if (sectionId === 'shop') {
        loadProducts();
    } else if (sectionId === 'cart') {
        renderCart();
    } else if (sectionId === 'admin') {
        loadAdminProducts();
    }
}

// --- NAVIGATION BAR ---
function renderNav() {
    var nav = document.getElementById('nav-links');
    nav.innerHTML = ''; // Clear nav

    if (currentUser) {
        // Count items in cart
        var totalQty = 0;
        for (var i = 0; i < cart.length; i++) {
            totalQty += cart[i].qty;
        }

        nav.innerHTML += '<li><a href="#" onclick="showSection(\'shop\')">Shop</a></li>';
        nav.innerHTML += '<li><a href="#" onclick="showSection(\'cart\')">Cart <span class="badge">' + totalQty + '</span></a></li>';

        if (currentUser.role === 'admin') {
            nav.innerHTML += '<li><a href="#" onclick="showSection(\'admin\')">Admin Panel</a></li>';
        }

        nav.innerHTML += '<li><a href="#" onclick="doLogout()">Logout</a></li>';
    } else {
        nav.innerHTML += '<li><a href="#" onclick="showSection(\'shop\')">Shop</a></li>';
        nav.innerHTML += '<li><a href="#" onclick="showSection(\'auth\')">Login</a></li>';
    }
}

function doLogout() {
    currentUser = null;
    authToken = null;
    cart = [];
    localStorage.clear();
    renderNav();
    showSection('auth');
}

// --- AUTHENTICATION (Login/Register) ---
var isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    var title = document.getElementById('auth-title');
    var btn = document.querySelector('#auth-form button');
    var emailInput = document.getElementById('email');
    var switchText = document.getElementById('auth-switch-text');

    if (isLoginMode) {
        title.innerText = 'Login';
        btn.innerText = 'Login';
        emailInput.style.display = 'none';
        switchText.innerText = "Don't have an account?";
    } else {
        title.innerText = 'Register';
        btn.innerText = 'Register';
        emailInput.style.display = 'block';
        switchText.innerText = "Already have an account?";
    }
}

function handleAuth(event) {
    event.preventDefault(); // Stop page reload

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var email = document.getElementById('email').value;

    var url = isLoginMode ? API_URL + '/auth/login' : API_URL + '/auth/register';

    var bodyData = {};
    if (isLoginMode) {
        bodyData = { username: username, password: password };
    } else {
        bodyData = { username: username, password: password, email: email };
    }

    // Send API Request
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (data.token) {
                // Success Login
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                alert('Welcome ' + data.user.username);
                renderNav();
                showSection('shop');
            } else if (data.message) {
                // Success Register or Error
                alert(data.message);
                if (data.message.includes('registered')) {
                    toggleAuthMode();
                }
            } else {
                alert('Error occurred');
            }
        })
        .catch(function (error) {
            console.error('Error:', error);
            alert('Server connection failed');
        });
}

// --- PRODUCT SHOP LOGIC ---
function loadProducts() {
    var url = API_URL + '/products?page=' + currentPage + '&limit=' + itemsPerPage;

    fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
            var grid = document.getElementById('product-list');
            grid.innerHTML = ''; // Clear existing

            if (data.products.length === 0) {
                grid.innerHTML = '<p>No products found.</p>';
                return;
            }

            // Loop through products
            for (var i = 0; i < data.products.length; i++) {
                var p = data.products[i];
                var cardHTML = `
                <div class="product-card">
                    <div class="product-info">
                        <span class="product-cat">${p.category}</span>
                        <h3 class="product-title">${p.name}</h3>
                        <div class="product-meta">${p.material} | ${p.carat}ct</div>
                        <div class="product-price">$${p.price}</div>
                        <button class="btn btn-primary add-to-cart-btn" onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
                    </div>
                </div>
            `;
                grid.innerHTML += cardHTML;
            }

            renderPagination(data.totalPages);
        });
}

function filterProducts() {
    currentPage = 1; // Reset to page 1
    loadProducts();
}

function renderPagination(totalPages) {
    var div = document.getElementById('pagination');
    div.innerHTML = '';
    for (var i = 1; i <= totalPages; i++) {
        div.innerHTML += '<div class="page-btn ' + (i === currentPage ? 'active' : '') + '" onclick="changePage(' + i + ')">' + i + '</div>';
    }
}

function changePage(pageNum) {
    currentPage = pageNum;
    loadProducts();
    window.scrollTo(0, 0);
}

// --- CART LOGIC ---
function addToCart(id, name, price) {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to add items to cart');
        showSection('auth');
        return;
    }

    var found = false;
    // Check if item already exists
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].productId === id) {
            cart[i].qty++;
            found = true;
            break;
        }
    }

    if (!found) {
        cart.push({ productId: id, name: name, price: price, qty: 1 });
    }

    saveCart();
    alert('Added to cart!');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderNav(); // Update badge count
}

function renderCart() {
    var container = document.getElementById('cart-content');
    if (cart.length === 0) {
        container.innerHTML = '<p>Cart is empty</p>';
        return;
    }

    var html = '<table class="cart-table"><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>';
    var grandTotal = 0;

    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var itemTotal = item.price * item.qty;
        grandTotal += itemTotal;

        html += '<tr>' +
            '<td>' + item.name + '</td>' +
            '<td>$' + item.price + '</td>' +
            '<td>' + item.qty + '</td>' +
            '<td>$' + itemTotal + '</td>' +
            '<td><button class="btn btn-danger" onclick="removeFromCart(' + i + ')">X</button></td>' +
            '</tr>';
    }

    html += '</tbody></table>' +
        '<div class="cart-summary">' +
        '<h3>Total: $' + grandTotal + '</h3>' +
        '<br>' +
        '<button class="btn btn-primary" onclick="placeOrder(' + grandTotal + ')">Place Order</button>' +
        '</div>';

    container.innerHTML = html;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function placeOrder(totalAmount) {
    if (!authToken) {
        alert('Please login to place an order');
        return;
    }

    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }

    // Debug: Log cart items
    console.log('Cart items being sent:', cart);
    console.log('Total amount:', totalAmount);

    fetch(API_URL + '/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ items: cart, total_amount: totalAmount })
    })
        .then(function (res) {
            console.log('Response status:', res.status);
            return res.json();
        })
        .then(function (data) {
            console.log('Response data:', data);
            if (data.orderId) {
                alert('Order Placed Successfully! Order ID: ' + data.orderId);
                cart = [];
                saveCart();
                renderCart();
            } else if (data.error) {
                alert('Order failed: ' + data.error);
            } else {
                alert('Order failed: ' + JSON.stringify(data));
            }
        })
        .catch(function (err) {
            console.error('Error:', err);
            alert('Server Error: ' + err.message);
        });
}

// --- ADMIN LOGIC ---
function loadAdminProducts() {
    fetch(API_URL + '/products')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            var tbody = document.getElementById('admin-table-body');
            tbody.innerHTML = '';

            var products = data.products;
            for (var i = 0; i < products.length; i++) {
                var p = products[i];
                var row = '<tr>' +
                    '<td>' + p.id + '</td>' +
                    '<td>' + p.name + '</td>' +
                    '<td>' + p.category + '</td>' +
                    '<td>' + p.material + '</td>' +
                    '<td>' + p.carat + '</td>' +
                    '<td>$' + p.price + '</td>' +
                    '<td>' +
                    '<button class="btn btn-secondary" onclick="editProduct(' + p.id + ')">Edit</button> ' +
                    '<button class="btn btn-danger" onclick="deleteProduct(' + p.id + ')">Del</button>' +
                    '</td>' +
                    '</tr>';
                tbody.innerHTML += row;
            }
        });
}

function openModal(isEdit) {
    document.getElementById('product-modal').classList.add('open');
    if (!isEdit) {
        document.getElementById('product-form').reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('modal-title').innerText = 'Add Product';
    }
}

function closeModal() {
    document.getElementById('product-modal').classList.remove('open');
}

function editProduct(id) {
    // Fetch all products then find the one we need (Simple approach)
    fetch(API_URL + '/products')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            var p = data.products.find(function (prod) { return prod.id === id; });
            if (p) {
                document.getElementById('edit-id').value = p.id;
                document.getElementById('p-name').value = p.name;
                document.getElementById('p-category').value = p.category;
                document.getElementById('p-material').value = p.material;
                document.getElementById('p-gem').value = p.gem_type;
                document.getElementById('p-color').value = p.color;
                document.getElementById('p-carat').value = p.carat;
                document.getElementById('p-cut').value = p.cut;
                document.getElementById('p-price').value = p.price;
                document.getElementById('p-stock').value = p.stock;

                document.getElementById('modal-title').innerText = 'Edit Product';
                openModal(true);
            }
        });
}

function saveProduct(event) {
    event.preventDefault();

    var id = document.getElementById('edit-id').value;
    var url = API_URL + '/products';
    var method = 'POST';

    if (id) {
        url = API_URL + '/products/' + id;
        method = 'PUT';
    }

    var body = {
        name: document.getElementById('p-name').value,
        category: document.getElementById('p-category').value,
        material: document.getElementById('p-material').value,
        gem_type: document.getElementById('p-gem').value,
        color: document.getElementById('p-color').value,
        carat: document.getElementById('p-carat').value,
        cut: document.getElementById('p-cut').value,
        price: document.getElementById('p-price').value,
        stock: document.getElementById('p-stock').value
    };

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify(body)
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            closeModal();
            loadAdminProducts();
            alert('Saved Successfully');
        })
        .catch(function (err) { alert('Error Saving'); });
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(API_URL + '/products/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                loadAdminProducts();
                alert('Product Deleted');
            });
    }
}

// --- EVENT LISTENERS SETUP ---
function setupEventListeners() {
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    document.getElementById('product-form').addEventListener('submit', saveProduct);
}

// Run Init when DOM loads
document.addEventListener('DOMContentLoaded', init);