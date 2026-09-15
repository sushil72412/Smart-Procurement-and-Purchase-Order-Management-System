/* =========================================================
   EPMS PRODUCTS PAGE
   ========================================================= */

const API_BASE_URL = "http://localhost:8080";

const CART_STORAGE_KEY = "epmsCart";


// =========================================================
// USER ROLE
// =========================================================

const USER_ROLE =
    (localStorage.getItem("role") || "")
        .toUpperCase()
        .trim();

function isEmployee() {
    return USER_ROLE === "EMPLOYEE";
}

function isManager() {
    return USER_ROLE === "MANAGER";
}


/* =========================================================
   AUTHORIZATION HEADER
   ========================================================= */

function getAuthHeaders() {

    const token =
        localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };

}


/* =========================================================
   CART
   ========================================================= */

function getCart() {

    try {

        const cart =
            JSON.parse(
                localStorage.getItem(
                    CART_STORAGE_KEY
                )
            );

        return Array.isArray(cart)
            ? cart
            : [];

    }
    catch (error) {

        console.error(
            "Error reading cart:",
            error
        );

        return [];

    }

}


function saveCart(cart) {

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );

}


/* =========================================================
   CART COUNT
   ========================================================= */

function updateCartCount() {

    const cart = getCart();

    const totalQuantity =
        cart.reduce(
            function (total, item) {

                return total + item.quantity;

            },
            0
        );


    const cartCount =
        document.getElementById(
            "cartCount"
        );


    if (cartCount) {

        cartCount.textContent =
            totalQuantity;

    }

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(product, quantity) {

    const cart = getCart();


    const existingItem =
        cart.find(
            function (item) {

                return item.productId === product.id;

            }
        );


    if (existingItem) {

        const newQuantity =
            existingItem.quantity +
            quantity;


        if (newQuantity > product.stock) {

            alert(
                "Only "
                + product.stock
                + " units available in stock."
            );

            return;

        }


        existingItem.quantity =
            newQuantity;

    }
    else {

        cart.push({

            productId: product.id,

            name: product.name,

            price: Number(product.price),

            stock: Number(product.stock),

            category: product.category,

            quantity: quantity

        });

    }


    saveCart(cart);

    updateCartCount();


    console.log(
        "Cart updated:",
        cart
    );


    showCartMessage(
        product.name +
        " added to cart."
    );

}


/* =========================================================
   CART MESSAGE
   ========================================================= */

function showCartMessage(message) {

    let messageElement =
        document.getElementById(
            "cartMessage"
        );


    if (!messageElement) {

        messageElement =
            document.createElement("div");

        messageElement.id =
            "cartMessage";

        messageElement.className =
            "cart-message";

        document.body.appendChild(
            messageElement
        );

    }


    messageElement.textContent =
        message;


    messageElement.classList.add(
        "show"
    );


    setTimeout(
        function () {

            messageElement.classList.remove(
                "show"
            );

        },
        2000
    );

}


/* =========================================================
   CREATE CART HEADER
   ========================================================= */

function createCartHeader() {

    /*
     * Cart is only available to Employees.
     */

    if (!isEmployee()) {
        return;
    }


    const pageHeading =
        document.querySelector(
            ".page-heading"
        );


    if (!pageHeading) {

        return;

    }


    if (
        document.getElementById(
            "cartButton"
        )
    ) {

        return;

    }


    const cartButton =
        document.createElement("button");


    cartButton.id =
        "cartButton";


    cartButton.className =
        "cart-button";


    cartButton.innerHTML = `

        <span class="cart-icon">
            🛒
        </span>

        <span>
            Cart
        </span>

        <span
            id="cartCount"
            class="cart-count">
            0
        </span>

    `;


    cartButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "cart.html";

        }
    );


    pageHeading.appendChild(
        cartButton
    );


    updateCartCount();

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

    const container =
        document.getElementById(
            "productsContainer"
        );


    try {

        const token =
            localStorage.getItem(
                "token"
            );


        /* -------------------------------------------------
           CHECK LOGIN
           ------------------------------------------------- */

        if (!token) {

            window.location.href =
                "index.html";

            return;

        }


        /* -------------------------------------------------
           API REQUEST
           ------------------------------------------------- */

        const response =
            await fetch(
                API_BASE_URL +
                "/api/products",
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        /* -------------------------------------------------
           UNAUTHORIZED
           ------------------------------------------------- */

        if (response.status === 401) {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "index.html";

            return;

        }


        /* -------------------------------------------------
           OTHER ERRORS
           ------------------------------------------------- */

        if (!response.ok) {

            throw new Error(
                "Failed to load products. Status: "
                + response.status
            );

        }


        /* -------------------------------------------------
           READ PRODUCTS
           ------------------------------------------------- */

        const products =
            await response.json();


        console.log(
            "Products:",
            products
        );


        /* -------------------------------------------------
           EMPTY STATE
           ------------------------------------------------- */

        if (
            !products ||
            products.length === 0
        ) {

            container.innerHTML = `

                <div class="empty-state">

                    <h3>
                        No products available
                    </h3>

                    <p>
                        There are currently no products
                        available for procurement.
                    </p>

                </div>

            `;

            return;

        }


        /* -------------------------------------------------
           CREATE PRODUCT CARDS
           ------------------------------------------------- */

        container.innerHTML = "";


        products.forEach(
            function (product) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "product-card";


                const stock =
                    Number(product.stock);


                const outOfStock =
                    stock <= 0;


                card.innerHTML = `

                    <div class="product-card-header">

                        <span class="product-category">
                            ${escapeHtml(
                                product.category
                            )}
                        </span>

                    </div>


                    <h3 class="product-name">
                        ${escapeHtml(
                            product.name
                        )}
                    </h3>


                    <p class="product-description">
                        ${escapeHtml(
                            product.description
                        )}
                    </p>


                    <div class="product-details">

                        <div>

                            <span class="product-label">
                                Price
                            </span>

                            <strong>
                                ₹${Number(
                                    product.price
                                ).toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span class="product-label">
                                Stock
                            </span>

                            <strong>
                                ${stock}
                            </strong>

                        </div>

                    </div>


                    ${
                        isEmployee()
                        ? `

                        <!-- =================================
                             EMPLOYEE CART CONTROLS
                             ================================= -->

                        <div class="product-cart-section">

                            <div class="quantity-control">

                                <span class="quantity-label">
                                    Quantity
                                </span>

                                <div class="quantity-box">

                                    <button
                                        type="button"
                                        class="quantity-btn minus-btn"
                                        ${outOfStock ? "disabled" : ""}>
                                        −
                                    </button>


                                    <span class="quantity-value">
                                        1
                                    </span>


                                    <button
                                        type="button"
                                        class="quantity-btn plus-btn"
                                        ${outOfStock ? "disabled" : ""}>
                                        +
                                    </button>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="add-to-cart-btn"
                                ${outOfStock ? "disabled" : ""}>

                                <span>
                                    🛒
                                </span>

                                ${
                                    outOfStock
                                        ? "Out of Stock"
                                        : "Add to Cart"
                                }

                            </button>

                        </div>

                        `
                        : `

                        <!-- =================================
                             MANAGER INVENTORY STATUS
                             ================================= -->

                        <div class="manager-product-footer">

                            <span class="inventory-label">
                                Inventory Status
                            </span>

                            <span class="inventory-status ${
                                stock > 0
                                    ? "available"
                                    : "out"
                            }">

                                ${
                                    stock > 0
                                        ? "● In Stock"
                                        : "● Out of Stock"
                                }

                            </span>

                        </div>

                        `
                    }

                `;


                /* =================================================
                   EMPLOYEE CART CONTROLS
                   ================================================= */

                if (isEmployee()) {

                    const minusButton =
                        card.querySelector(
                            ".minus-btn"
                        );


                    const plusButton =
                        card.querySelector(
                            ".plus-btn"
                        );


                    const quantityValue =
                        card.querySelector(
                            ".quantity-value"
                        );


                    let quantity = 1;


                    /* ---------------------------------------------
                       MINUS
                       --------------------------------------------- */

                    minusButton.addEventListener(
                        "click",
                        function () {

                            if (quantity > 1) {

                                quantity--;

                                quantityValue.textContent =
                                    quantity;

                            }

                        }
                    );


                    /* ---------------------------------------------
                       PLUS
                       --------------------------------------------- */

                    plusButton.addEventListener(
                        "click",
                        function () {

                            if (quantity < stock) {

                                quantity++;

                                quantityValue.textContent =
                                    quantity;

                            }
                            else {

                                showCartMessage(
                                    "Maximum available stock reached."
                                );

                            }

                        }
                    );


                    /* ---------------------------------------------
                       ADD TO CART
                       --------------------------------------------- */

                    const addButton =
                        card.querySelector(
                            ".add-to-cart-btn"
                        );


                    addButton.addEventListener(
                        "click",
                        function () {

                            addToCart(
                                product,
                                quantity
                            );

                        }
                    );

                }


                container.appendChild(
                    card
                );

            }
        );


        /*
         * Update cart count only for Employee.
         */

        if (isEmployee()) {

            updateCartCount();

        }

    }


    catch (error) {

        console.error(
            "Error loading products:",
            error
        );


        if (container) {

            container.innerHTML = `

                <div class="empty-state">

                    <h3>
                        Unable to load products
                    </h3>

                    <p>
                        Please try again later.
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   CONFIGURE SIDEBAR BY ROLE
   ========================================================= */

function configureSidebar() {

    const nav =
        document.querySelector(
            ".sidebar-nav"
        );


    if (!nav) {

        return;

    }


    /* =====================================================
       MANAGER SIDEBAR
       ===================================================== */

    if (isManager()) {

        nav.innerHTML = `

            <div class="nav-section-title">
                MAIN MENU
            </div>


            <a href="manager-dashboard.html"
               class="nav-item">

                <span>⌂</span>
                <span>Dashboard</span>

            </a>


            <a href="purchase-requests.html"
               class="nav-item">

                <span>▣</span>
                <span>Purchase Requests</span>

            </a>


            <a href="products.html"
               class="nav-item active">

                <span>▤</span>
                <span>Products</span>

            </a>


            <a href="deliveries.html"
               class="nav-item">

                <span>▱</span>
                <span>Deliveries</span>

            </a>


            <a href="payments.html"
               class="nav-item">

                <span>₹</span>
                <span>Payments</span>

            </a>


            <a href="reports.html"
               class="nav-item">

                <span>📊</span>
                <span>Reports</span>

            </a>

        `;

    }


    /* =====================================================
       DISPLAY USER ROLE
       ===================================================== */

    const userRoleElement =
        document.getElementById(
            "userRole"
        );


    if (userRoleElement) {

        userRoleElement.textContent =
            USER_ROLE;

    }

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        configureSidebar();

        createCartHeader();

        loadProducts();

    }
);