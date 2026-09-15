/* =========================================================
   EPMS - MANAGER PRODUCTS PAGE
   ========================================================= */

const API_BASE_URL = "http://localhost:8080";


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
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

    const container =
        document.getElementById("productsContainer");


    try {

        /* -------------------------------------------------
           CHECK LOGIN
           ------------------------------------------------- */

        const token =
            localStorage.getItem("token");


        if (!token) {

            window.location.href =
                "../index.html";

            return;
        }


        /* -------------------------------------------------
           API REQUEST
           ------------------------------------------------- */

        const response =
            await fetch(
                API_BASE_URL + "/api/products",
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        /* -------------------------------------------------
           UNAUTHORIZED
           ------------------------------------------------- */

        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "../index.html";

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
            "Manager Products:",
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
                        available in the procurement system.
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
                    document.createElement("div");


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
                                ).toLocaleString("en-IN")}

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


                    <!-- =====================================
                         MANAGER INVENTORY STATUS
                         ===================================== -->

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

                `;


                container.appendChild(
                    card
                );

            }
        );

    }


    catch (error) {

        console.error(
            "Error loading manager products:",
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
   USER INFORMATION
   ========================================================= */

function loadUserInformation() {

    const email =
        localStorage.getItem("email");


    const userName =
        document.getElementById("userName");


    const userRole =
        document.getElementById("userRole");


    const userAvatar =
        document.getElementById("userAvatar");


    if (email && userName) {

        userName.textContent =
            email;

    }


    if (userRole) {

        userRole.textContent =
            "MANAGER";

    }


    if (email && userAvatar) {

        userAvatar.textContent =
            email.charAt(0).toUpperCase();

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutButton");


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            localStorage.removeItem("token");
            localStorage.removeItem("email");
            localStorage.removeItem("role");
            localStorage.removeItem("epmsCart");


            window.location.href =
                "../index.html";

        }
    );

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadUserInformation();

        setupLogout();

        loadProducts();

    }
);