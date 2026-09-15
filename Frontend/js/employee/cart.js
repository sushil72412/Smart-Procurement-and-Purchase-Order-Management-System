// ===============================
// EPMS - Shopping Cart
// ===============================

const CART_KEY = "epmsCart";


// ===============================
// AUTH CHECK
// ===============================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}


// ===============================
// DOM ELEMENTS
// ===============================

const cartContainer = document.getElementById("cartContainer");
const cartItemCount = document.getElementById("cartItemCount");

const summaryItems = document.getElementById("summaryItems");
const summarySubtotal = document.getElementById("summarySubtotal");
const summaryTotal = document.getElementById("summaryTotal");

const continueShoppingButton =
    document.getElementById("continueShoppingButton");

const proceedButton =
    document.getElementById("proceedButton");

const logoutButton =
    document.getElementById("logoutButton");


// ===============================
// LOAD CART
// ===============================

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY));

        if (!Array.isArray(cart)) {
            return [];
        }

        return cart;
    } catch (error) {
        console.error("Error reading cart:", error);
        return [];
    }
}


// ===============================
// SAVE CART
// ===============================

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}


// ===============================
// FORMAT PRICE
// ===============================

function formatPrice(price) {
    return Number(price).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ===============================
// RENDER CART
// ===============================

function renderCart() {

    const cart = getCart();

    // Update top item count
    const totalQuantity = cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    if (cartItemCount) {
        cartItemCount.textContent =
            `${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`;
    }


    // Empty cart
    if (cart.length === 0) {

        cartContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>

                <h3>Your cart is empty</h3>

                <p>
                    Add products to your cart to create a purchase request.
                </p>

                <button
                    type="button"
                    class="continue-shopping-btn"
                    onclick="window.location.href='products.html'"
                >
                    Browse Products
                </button>
            </div>
        `;

        updateSummary([]);

        if (proceedButton) {
            proceedButton.disabled = true;
        }

        return;
    }


    // Enable proceed button
    if (proceedButton) {
        proceedButton.disabled = false;
    }


    // Render cart items
    cartContainer.innerHTML = cart.map((item, index) => {

        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const stock = Number(item.stock);

        const itemTotal = price * quantity;

        const description =
            item.description ||
            "Product available for procurement.";

        return `
            <div class="cart-item">

                <div class="cart-item-info">

                    <div class="cart-item-category">
                        ${escapeHtml(item.category || "General")}
                    </div>

                    <h3 class="cart-item-name">
                        ${escapeHtml(item.name)}
                    </h3>

                    <p class="cart-item-description">
                        ${escapeHtml(description)}
                    </p>

                    <div class="cart-item-price">
                        ${formatPrice(price)}
                        <span class="unit-label">per unit</span>
                    </div>

                </div>


                <div class="cart-item-actions">

                    <div class="quantity-section">

                        <span class="quantity-label">
                            Quantity
                        </span>

                        <div class="quantity-control">

                            <button
                                type="button"
                                class="quantity-btn"
                                data-action="decrease"
                                data-index="${index}"
                                ${quantity <= 1 ? "disabled" : ""}
                            >
                                −
                            </button>

                            <span class="quantity-value">
                                ${quantity}
                            </span>

                            <button
                                type="button"
                                class="quantity-btn"
                                data-action="increase"
                                data-index="${index}"
                                ${quantity >= stock ? "disabled" : ""}
                            >
                                +
                            </button>

                        </div>

                        <span class="stock-label">
                            ${stock} available
                        </span>

                    </div>


                    <div class="cart-item-total">

                        <span class="item-total-label">
                            Item Total
                        </span>

                        <strong>
                            ${formatPrice(itemTotal)}
                        </strong>

                    </div>


                    <button
                        type="button"
                        class="remove-item-btn"
                        data-action="remove"
                        data-index="${index}"
                    >
                        Remove
                    </button>

                </div>

            </div>
        `;
    }).join("");


    updateSummary(cart);
}


// ===============================
// UPDATE SUMMARY
// ===============================

function updateSummary(cart) {

    const totalQuantity = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 0),
        0
    );

    const subtotal = cart.reduce(
        (total, item) =>
            total +
            Number(item.price || 0) *
            Number(item.quantity || 0),
        0
    );


    if (summaryItems) {
        summaryItems.textContent =
            `${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`;
    }

    if (summarySubtotal) {
        summarySubtotal.textContent =
            formatPrice(subtotal);
    }

    if (summaryTotal) {
        summaryTotal.textContent =
            formatPrice(subtotal);
    }
}


// ===============================
// QUANTITY / REMOVE HANDLER
// ===============================

cartContainer.addEventListener("click", function (event) {

    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const index = Number(button.dataset.index);

    if (
        action !== "increase" &&
        action !== "decrease" &&
        action !== "remove"
    ) {
        return;
    }


    const cart = getCart();

    if (!cart[index]) {
        return;
    }


    // Increase quantity
    if (action === "increase") {

        const currentQuantity =
            Number(cart[index].quantity);

        const stock =
            Number(cart[index].stock);

        if (currentQuantity < stock) {

            cart[index].quantity =
                currentQuantity + 1;

            saveCart(cart);
            renderCart();

        } else {

            showToast(
                `Only ${stock} units available.`
            );
        }
    }


    // Decrease quantity
    else if (action === "decrease") {

        const currentQuantity =
            Number(cart[index].quantity);

        if (currentQuantity > 1) {

            cart[index].quantity =
                currentQuantity - 1;

            saveCart(cart);
            renderCart();
        }
    }


    // Remove item
    else if (action === "remove") {

        const productName =
            cart[index].name;

        cart.splice(index, 1);

        saveCart(cart);
        renderCart();

        showToast(
            `${productName} removed from cart.`
        );
    }

});


// ===============================
// CONTINUE SHOPPING
// ===============================

if (continueShoppingButton) {

    continueShoppingButton.addEventListener(
        "click",
        function () {

            window.location.href = "products.html";

        }
    );
}


// ===============================
// PROCEED BUTTON
// ===============================

if (proceedButton) {

    proceedButton.addEventListener(
        "click",
        function () {

            const cart = getCart();

            if (cart.length === 0) {

                showToast(
                    "Your cart is empty."
                );

                return;
            }


            /*
             * Delivery/request page will be connected
             * in the next step.
             */

            window.location.href = "new-request.html";
        }
    );
}


// ===============================
// TOAST MESSAGE
// ===============================

function showToast(message) {

    const existingToast =
        document.querySelector(".cart-toast");

    if (existingToast) {
        existingToast.remove();
    }


    const toast =
        document.createElement("div");

    toast.className = "cart-toast";

    toast.textContent = message;


    document.body.appendChild(toast);


    setTimeout(() => {

        toast.classList.add("show");

    }, 10);


    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 2200);
}


// ===============================
// PROFILE INFORMATION
// ===============================

const userEmail =
    document.getElementById("userEmail");

const userRole =
    document.getElementById("userRole");

const storedEmail =
    localStorage.getItem("email");

const storedRole =
    localStorage.getItem("role");


if (userEmail && storedEmail) {
    userEmail.textContent = storedEmail;
}

if (userRole && storedRole) {
    userRole.textContent = storedRole;
}


// ===============================
// LOGOUT
// ===============================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem("token");
            localStorage.removeItem("email");
            localStorage.removeItem("role");

            window.location.href = "index.html";

        }
    );
}


// ===============================
// INITIAL LOAD
// ===============================

renderCart();