const API_BASE_URL = "http://localhost:8080";

let allProducts = [];


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeProductsPage();
});


async function initializeProductsPage() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    try {

        const user = getUserFromToken();

        if (!user) {
            throw new Error("Unable to read authentication token.");
        }

        if (user.role && user.role !== "ADMIN") {

            alert("Access denied. Admin account required.");

            window.location.href = "../index.html";

            return;
        }

        updateAdminInfo(user);

        await loadProducts();

    } catch (error) {

        console.error(
            "Admin Products initialization failed:",
            error
        );

        showError(error.message);
    }

    setupLogout();
    setupProductManagement();
    setupAddProductModal();
    setupEditProductModal();
}


// =========================================================
// AUTH
// =========================================================

function getAuthHeaders() {

    const token =
        localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


function getUserFromToken() {

    const token =
        localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {

        const payload =
            token.split(".")[1];

        const decoded =
            atob(
                payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            );

        return JSON.parse(decoded);

    } catch (error) {

        console.error(
            "JWT parsing failed:",
            error
        );

        return null;
    }
}


// =========================================================
// ADMIN INFORMATION
// =========================================================

function updateAdminInfo(user) {

    const email =
        user.email ||
        user.sub ||
        "admin@epms.com";

    const name =
        user.fullName ||
        user.name ||
        "Administrator";


    setText(
        "adminName",
        name
    );

    setText(
        "adminEmail",
        email
    );


    const avatar =
        document.getElementById(
            "adminAvatar"
        );

    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();
    }
}


// =========================================================
// LOAD PRODUCTS
// =========================================================

async function loadProducts() {

    const tableBody =
        document.getElementById(
            "productsTableBody"
        );

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="loading-cell">
                    Loading products...
                </td>
            </tr>
        `;
    }


    try {

        const products =
            await fetchProducts();

        renderProducts(products);

    } catch (error) {

        console.error(
            "Failed to load products:",
            error
        );

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center; padding:30px;">
                        Unable to load products.
                    </td>
                </tr>
            `;
        }
    }
}


// =========================================================
// API
// =========================================================

async function fetchProducts() {

    return fetchJson(
        "/api/products"
    );
}


async function fetchJson(endpoint) {

    const response =
        await fetch(
            API_BASE_URL + endpoint,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


    console.log(
        endpoint,
        "→",
        response.status
    );


    if (response.status === 401) {

        handleUnauthorized();

        throw new Error(
            "Authentication expired."
        );
    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to access " +
            endpoint
        );
    }


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            endpoint,
            errorText
        );

        throw new Error(
            "Failed to load " + endpoint
        );
    }


    return await response.json();
}


// =========================================================
// RENDER PRODUCTS
// =========================================================

function renderProducts(products) {

    allProducts =
        Array.isArray(products)
            ? products
            : [];

    displayProducts(
        allProducts
    );
}


// =========================================================
// DISPLAY PRODUCTS
// =========================================================

function displayProducts(products) {

    const tableBody =
        document.getElementById(
            "productsTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (
        !products ||
        products.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    products.forEach(product => {

        const row =
            document.createElement("tr");


        const stock =
            Number(
                product.stock ??
                product.quantity ??
                0
            );


        const productName =
            product.productName ||
            product.name ||
            "N/A";


        row.innerHTML = `

            <td>
                #${product.id}
            </td>

            <td>

                <span class="product-name">

                    ${escapeHtml(
                        productName
                    )}

                </span>

            </td>

            <td>

                <span class="product-description">

                    ${escapeHtml(
                        product.description ||
                        "No description"
                    )}

                </span>

            </td>

            <td>

                <span class="product-price">

                    ₹${formatNumber(
                        product.price
                    )}

                </span>

            </td>

            <td>

                <span
                    class="stock-badge ${getStockClass(stock)}">

                    ${stock}

                </span>

            </td>

            <td>

                <div class="product-action-buttons">

                    <button
                        class="product-action-btn"
                        onclick="editProduct(${product.id})">

                        Edit

                    </button>


                    <button
                        class="product-action-btn delete"
                        onclick="deleteProduct(
                            ${product.id},
                            '${escapeJs(productName)}'
                        )">

                        Delete

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);
    });
}


// =========================================================
// PRODUCT SEARCH + REFRESH
// =========================================================

function setupProductManagement() {

    const searchInput =
        document.getElementById(
            "productSearch"
        );


    const refreshButton =
        document.getElementById(
            "refreshProductsBtn"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                const term =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                const filtered =
                    allProducts.filter(
                        product => {

                            const name =
                                (
                                    product.productName ||
                                    product.name ||
                                    ""
                                ).toLowerCase();


                            const description =
                                (
                                    product.description ||
                                    ""
                                ).toLowerCase();


                            return (
                                name.includes(term) ||
                                description.includes(term)
                            );
                        }
                    );


                displayProducts(
                    filtered
                );
            }
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled =
                    true;

                refreshButton.textContent =
                    "↻ Loading...";


                try {

                    await loadProducts();

                } catch (error) {

                    console.error(
                        "Product refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled =
                        false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }

            }
        );
    }
}


// =========================================================
// DELETE PRODUCT
// =========================================================

async function deleteProduct(
    productId,
    productName
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete ${productName}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/products/${productId}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "Delete product response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to delete products."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Delete product error:",
                errorText
            );

            alert(
                "Unable to delete product."
            );

            return;
        }


        alert(
            "Product deleted successfully."
        );


        await loadProducts();

    } catch (error) {

        console.error(
            "Delete product failed:",
            error
        );

        alert(
            "Something went wrong while deleting the product."
        );
    }
}


// =========================================================
// EDIT PRODUCT
// =========================================================

function editProduct(productId) {

    const product =
        allProducts.find(
            item => item.id === productId
        );


    if (!product) {

        alert(
            "Product not found."
        );

        return;
    }


    setValue(
        "editProductId",
        product.id
    );


    setValue(
        "editProductName",
        product.name ||
        product.productName ||
        ""
    );


    setValue(
        "editProductCategory",
        product.category ||
        ""
    );


    setValue(
        "editProductDescription",
        product.description ||
        ""
    );


    setValue(
        "editProductPrice",
        product.price ||
        0
    );


    setValue(
        "editProductStock",
        product.stock ||
        0
    );


    const modal =
        document.getElementById(
            "editProductModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );
    }
}


// =========================================================
// STOCK CLASS
// =========================================================

function getStockClass(stock) {

    if (stock <= 0) {
        return "stock-out";
    }

    if (stock <= 10) {
        return "stock-low";
    }

    return "stock-available";
}


// =========================================================
// NUMBER FORMAT
// =========================================================

function formatNumber(value) {

    const number =
        Number(value);


    if (isNaN(number)) {
        return "0";
    }


    return number.toLocaleString(
        "en-IN"
    );
}


// =========================================================
// ADD PRODUCT MODAL
// =========================================================

function setupAddProductModal() {

    const modal =
        document.getElementById(
            "addProductModal"
        );


    const openButton =
        document.getElementById(
            "addProductBtn"
        );


    const closeButton =
        document.getElementById(
            "closeAddProductModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelAddProductBtn"
        );


    const form =
        document.getElementById(
            "addProductForm"
        );


    function closeModal() {

        if (modal) {

            modal.classList.remove(
                "show"
            );
        }


        if (form) {

            form.reset();
        }
    }


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                if (modal) {

                    modal.classList.add(
                        "show"
                    );
                }

            }
        );
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();
                }

            }
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await createProduct(
                    closeModal
                );

            }
        );
    }
}


// =========================================================
// CREATE PRODUCT
// =========================================================

async function createProduct(
    closeModal
) {

    const productName =
        document.getElementById(
            "addProductName"
        ).value.trim();


    const category =
        document.getElementById(
            "addProductCategory"
        ).value.trim();


    const description =
        document.getElementById(
            "addProductDescription"
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                "addProductPrice"
            ).value
        );


    const stock =
        Number(
            document.getElementById(
                "addProductStock"
            ).value
        );


    if (
        !productName ||
        !category ||
        !description ||
        !Number.isFinite(price) ||
        !Number.isFinite(stock) ||
        price < 0 ||
        stock < 0
    ) {

        alert(
            "Please enter valid product details."
        );

        return;
    }


    const button =
        document.getElementById(
            "createProductBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Creating...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/products`,
                {
                    method: "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            name:
                                productName,

                            category:
                                category,

                            description:
                                description,

                            price:
                                price,

                            stock:
                                stock

                        })
                }
            );


        console.log(
            "Create product response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to create products."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Create product error:",
                errorText
            );

            alert(
                "Unable to create product. Check the console for details."
            );

            return;
        }


        alert(
            "Product created successfully."
        );


        closeModal();


        await loadProducts();

    } catch (error) {

        console.error(
            "Create product failed:",
            error
        );

        alert(
            "Something went wrong while creating the product."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Create Product";
        }
    }
}


// =========================================================
// EDIT PRODUCT MODAL
// =========================================================

function setupEditProductModal() {

    const modal =
        document.getElementById(
            "editProductModal"
        );


    const closeButton =
        document.getElementById(
            "closeEditProductModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelEditProductBtn"
        );


    const form =
        document.getElementById(
            "editProductForm"
        );


    function closeModal() {

        if (modal) {

            modal.classList.remove(
                "show"
            );
        }
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();
                }

            }
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await updateProduct(
                    closeModal
                );

            }
        );
    }
}


// =========================================================
// UPDATE PRODUCT
// =========================================================

async function updateProduct(
    closeModal
) {

    const productId =
        document.getElementById(
            "editProductId"
        ).value;


    const name =
        document.getElementById(
            "editProductName"
        ).value.trim();


    const category =
        document.getElementById(
            "editProductCategory"
        ).value.trim();


    const description =
        document.getElementById(
            "editProductDescription"
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                "editProductPrice"
            ).value
        );


    const stock =
        Number(
            document.getElementById(
                "editProductStock"
            ).value
        );


    if (
        !name ||
        !category ||
        !description ||
        !Number.isFinite(price) ||
        !Number.isFinite(stock) ||
        price < 0 ||
        stock < 0
    ) {

        alert(
            "Please enter valid product details."
        );

        return;
    }


    const button =
        document.getElementById(
            "updateProductBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Saving...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/products/${productId}`,
                {
                    method: "PUT",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            name:
                                name,

                            category:
                                category,

                            description:
                                description,

                            price:
                                price,

                            stock:
                                stock

                        })
                }
            );


        console.log(
            "Update product response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to update products."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Update product error:",
                errorText
            );

            alert(
                "Unable to update product. Check console."
            );

            return;
        }


        alert(
            "Product updated successfully."
        );


        closeModal();


        await loadProducts();

    } catch (error) {

        console.error(
            "Update product failed:",
            error
        );

        alert(
            "Something went wrong while updating the product."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Save Changes";
        }
    }
}


// =========================================================
// LOGOUT
// =========================================================

function setupLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        logout
    );
}


function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("name");

    window.location.href =
        "../index.html";
}


// =========================================================
// UNAUTHORIZED
// =========================================================

function handleUnauthorized() {

    localStorage.removeItem(
        "token"
    );


    alert(
        "Your session has expired. Please login again."
    );


    window.location.href =
        "../index.html";
}


// =========================================================
// HELPERS
// =========================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }
}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value;
    }
}


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


function escapeJs(value) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\n/g,
            "\\n"
        )
        .replace(
            /\r/g,
            "\\r"
        );
}


// =========================================================
// ERROR
// =========================================================

function showError(message) {

    console.error(
        "Admin Products error:",
        message
    );


    const tableBody =
        document.getElementById(
            "productsTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    Unable to load products.
                </td>
            </tr>
        `;
    }
}