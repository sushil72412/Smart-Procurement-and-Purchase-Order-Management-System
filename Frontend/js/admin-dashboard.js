const API_BASE_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    initializeAdminDashboard();
});


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminDashboard() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {

        const user = getUserFromToken();

        if (!user) {
            throw new Error("Unable to read authentication token.");
        }

        console.log("Logged-in admin:", user);

        const role = user.role;

        if (role && role !== "ADMIN") {

            alert("Access denied. Admin account required.");

            window.location.href = "dashboard.html";

            return;
        }

        updateAdminInfo(user);

        await loadDashboardData();

        updateSystemStatus();

    } catch (error) {

        console.error(
            "Admin dashboard initialization failed:",
            error
        );

        showDashboardError(error.message);
    }

    setupLogout();
    setupRefresh();
    setupUserManagement();
    setupEditUserModal();
    setupAddUserModal();
    setupProductManagement();
    setupAddProductModal();
    setupEditProductModal();
    setupPurchaseRequestManagement();
    setupSupplierManagement();
    setupPaymentManagement();
    setupDeliveryManagement();
    

}


/* =========================================================
   AUTH
   ========================================================= */

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


function getUserFromToken() {

    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {

        const payload = token.split(".")[1];

        const decoded = atob(
            payload.replace(/-/g, "+")
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


/* =========================================================
   ADMIN INFORMATION
   ========================================================= */

function updateAdminInfo(user) {

    const email =
        user.email ||
        user.sub ||
        "admin@epms.com";

    let name =
        user.fullName ||
        user.name ||
        "Administrator";

    /*
     * JWT currently uses email as subject.
     * If no name claim exists, use Administrator.
     */

    setText("adminName", name);
    setText("adminEmail", email);
    setText("welcomeAdminName", name);

    const avatar =
        document.getElementById("adminAvatar");

    if (avatar) {

        avatar.textContent =
            name.charAt(0).toUpperCase();
    }
}


/* =========================================================
   LOAD ALL DASHBOARD DATA
   ========================================================= */

async function loadDashboardData() {

    const results =
        await Promise.allSettled([

            fetchUsers(),

            fetchProducts(),

            fetchPurchaseRequests(),

            fetchSuppliers(),

            fetchDeliveries(),

            fetchPayments()

        ]);

    console.log(
        "Admin dashboard API results:",
        results
    );

    const users =
        getResult(results[0]);

    const products =
        getResult(results[1]);

    const requests =
        getResult(results[2]);

    const suppliers =
        getResult(results[3]);

    const deliveries =
        getResult(results[4]);

    const payments =
        getResult(results[5]);


    updateUserStats(users);
    renderUsers(users);

    updateProductStats(products);
    renderProducts(products);

    updateRequestStats(requests);
    renderPurchaseRequests(requests);

    updateSupplierStats(suppliers);
    renderSuppliers(suppliers);

    updateDeliveryStats(deliveries);
    renderDeliveries(deliveries);

    updatePaymentStats(payments);
    renderPayments(payments);

    renderRecentRequests(requests);
}


/* =========================================================
   API CALLS
   ========================================================= */

async function fetchUsers() {

    return fetchJson(
        "/api/users"
    );
}


async function fetchProducts() {

    return fetchJson(
        "/api/products"
    );
}


async function fetchPurchaseRequests() {

    return fetchJson(
        "/api/purchase-requests"
    );
}


async function fetchSuppliers() {

    return fetchJson(
        "/api/suppliers"
    );
}


async function fetchDeliveries() {

    return fetchJson(
        "/api/deliveries"
    );
}


async function fetchPayments() {

    return fetchJson(
        "/api/payments"
    );
}


/* =========================================================
   GENERIC FETCH
   ========================================================= */

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


/* =========================================================
   USER STATS
   ========================================================= */

function updateUserStats(users) {

    const count =
        Array.isArray(users)
            ? users.length
            : 0;

    setText(
        "totalUsers",
        count
    );

    setText(
        "overviewUsers",
        count
    );
}


/* =========================================================
   PRODUCT STATS
   ========================================================= */

function updateProductStats(products) {

    const count =
        Array.isArray(products)
            ? products.length
            : 0;

    setText(
        "totalProducts",
        count
    );

    setText(
        "overviewProducts",
        count
    );
}


/* =========================================================
   SUPPLIER STATS
   ========================================================= */

function updateSupplierStats(suppliers) {

    const count =
        Array.isArray(suppliers)
            ? suppliers.length
            : 0;

    setText(
        "totalSuppliers",
        count
    );

    setText(
        "overviewSuppliers",
        count
    );
}


/* =========================================================
   PURCHASE REQUEST STATS
   ========================================================= */

function updateRequestStats(requests) {

    if (!Array.isArray(requests)) {

        requests = [];
    }

    const total =
        requests.length;

    const pending =
        requests.filter(
            request =>
                request.status === "PENDING"
        ).length;

    const approved =
        requests.filter(
            request =>
                request.status === "APPROVED"
        ).length;

    const rejected =
        requests.filter(
            request =>
                request.status === "REJECTED"
        ).length;


    setText(
        "totalRequests",
        total
    );

    setText(
        "pendingRequests",
        pending
    );

    setText(
        "statusPending",
        pending
    );

    setText(
        "statusApproved",
        approved
    );

    setText(
        "statusRejected",
        rejected
    );

    setText(
        "overviewRequests",
        total
    );
}


/* =========================================================
   DELIVERY STATS
   ========================================================= */

function updateDeliveryStats(deliveries) {

    if (!Array.isArray(deliveries)) {

        deliveries = [];
    }

    const active =
        deliveries.filter(
            delivery =>
                delivery.status !== "DELIVERED"
        ).length;

    const completed =
        deliveries.filter(
            delivery =>
                delivery.status === "DELIVERED"
        ).length;


    setText(
        "activeDeliveries",
        active
    );

    setText(
        "completedDeliveries",
        completed
    );
}


/* =========================================================
   PAYMENT STATS
   ========================================================= */

function updatePaymentStats(payments) {

    const count =
        Array.isArray(payments)
            ? payments.length
            : 0;

    setText(
        "totalPayments",
        count
    );
}


/* =========================================================
   RECENT REQUESTS
   ========================================================= */

function renderRecentRequests(requests) {

    const tableBody =
        document.getElementById(
            "requestTableBody"
        );

    if (!tableBody) {
        return;
    }

    if (!Array.isArray(requests) ||
        requests.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center; padding:30px;">
                    No purchase requests found.
                </td>
            </tr>
        `;

        return;
    }


    const sortedRequests =
        [...requests].sort(
            (a, b) =>
                new Date(
                    b.requestDate || 0
                ) -
                new Date(
                    a.requestDate || 0
                )
        );


    const recent =
        sortedRequests.slice(0, 5);


    tableBody.innerHTML = "";


    recent.forEach(request => {

        const row =
            document.createElement("tr");

        const employee =
            request.employeeName ||
            "Unknown";

        const product =
            getFirstProductName(request);

        const date =
            formatDate(
                request.requestDate
            );

        const status =
            request.status ||
            "UNKNOWN";

        row.innerHTML = `

            <td>
                #${request.id}
            </td>

            <td>
                ${escapeHtml(employee)}
            </td>

            <td>
                ${escapeHtml(product)}
            </td>

            <td>
                ${date}
            </td>

            <td>
                <span class="status-badge ${getRequestStatusClass(status)}">
                    ${formatStatus(status)}
                </span>
            </td>

        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   PRODUCT NAME
   ========================================================= */

function getFirstProductName(request) {

    if (!request.items ||
        !Array.isArray(request.items) ||
        request.items.length === 0) {

        return "No product";
    }

    return (
        request.items[0].productName ||
        "Unknown product"
    );
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefresh() {

    const button =
        document.getElementById(
            "refreshRequestsBtn"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            button.textContent =
                "↻ Loading...";

            try {

                await loadDashboardData();

            } catch (error) {

                console.error(
                    "Refresh failed:",
                    error
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    "↻ Refresh";
            }
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

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
        () => {

            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "index.html";
        }
    );
}


/* =========================================================
   SYSTEM STATUS
   ========================================================= */

function updateSystemStatus() {

    setText(
        "currentStatus",
        "System Operational"
    );
}


/* =========================================================
   RESULT HELPER
   ========================================================= */

function getResult(result) {

    if (
        result &&
        result.status === "fulfilled"
    ) {

        return result.value;
    }

    if (result) {

        console.error(
            "Dashboard API failed:",
            result.reason
        );
    }

    return [];
}


/* =========================================================
   STATUS HELPERS
   ========================================================= */

function getRequestStatusClass(status) {

    switch (status) {

        case "PENDING":
            return "status-pending";

        case "APPROVED":
            return "status-approved";

        case "REJECTED":
            return "status-rejected";

        default:
            return "";
    }
}


function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return status
        .toLowerCase()
        .split("_")
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "N/A";
    }

    const date =
        new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   TEXT
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;
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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   UNAUTHORIZED
   ========================================================= */

function handleUnauthorized() {

    localStorage.removeItem(
        "token"
    );

    alert(
        "Your session has expired. Please login again."
    );

    window.location.href =
        "index.html";
}


/* =========================================================
   ERROR
   ========================================================= */

function showDashboardError(message) {

    console.error(
        "Dashboard error:",
        message
    );

    const tableBody =
        document.getElementById(
            "requestTableBody"
        );

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center; padding:30px;">
                    Unable to load dashboard data.
                </td>
            </tr>
        `;
    }
}

/* =========================================================
   USER MANAGEMENT
   ========================================================= */

let allUsers = [];


/* =========================================================
   RENDER USERS
   ========================================================= */

function renderUsers(users) {

    const tableBody =
        document.getElementById("usersTableBody");

    if (!tableBody) {
        return;
    }

    allUsers = Array.isArray(users)
        ? users
        : [];

    displayUsers(allUsers);
}


/* =========================================================
   DISPLAY FILTERED USERS
   ========================================================= */

function displayUsers(users) {

    const tableBody =
        document.getElementById("usersTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!users || users.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    users.forEach(user => {

        const row =
            document.createElement("tr");

        const role =
            user.role || "UNKNOWN";

        row.innerHTML = `

            <td>
                #${user.id}
            </td>

            <td>
                ${escapeHtml(
                    user.fullName || "N/A"
                )}
            </td>

            <td>
                ${escapeHtml(
                    user.email || "N/A"
                )}
            </td>

            <td>
                ${escapeHtml(
                    user.phone || "N/A"
                )}
            </td>

            <td>
                <span class="user-role-badge ${getRoleClass(role)}">
                    ${formatStatus(role)}
                </span>
            </td>

            <td>

                <div class="user-action-buttons">

                    <button
                        class="user-action-btn"
                        onclick="editUser(${user.id})">
                        Edit
                    </button>

                    <button
                        class="user-action-btn delete"
                        onclick="deleteUser(${user.id}, '${escapeJs(user.fullName || "this user")}')">
                        Delete
                    </button>

                </div>

            </td>

        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   SEARCH + ROLE FILTER
   ========================================================= */

function setupUserManagement() {

    const searchInput =
        document.getElementById("userSearch");

    const roleFilter =
        document.getElementById("roleFilter");

    const refreshButton =
        document.getElementById("refreshUsersBtn");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterUsers
        );
    }


    if (roleFilter) {

        roleFilter.addEventListener(
            "change",
            filterUsers
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled = true;

                refreshButton.textContent =
                    "↻ Loading...";

                try {

                    const users =
                        await fetchUsers();

                    updateUserStats(users);

                    renderUsers(users);

                } catch (error) {

                    console.error(
                        "User refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled = false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }
            }
        );
    }
}


/* =========================================================
   FILTER USERS
   ========================================================= */

function filterUsers() {

    const searchInput =
        document.getElementById("userSearch");

    const roleFilter =
        document.getElementById("roleFilter");


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedRole =
        roleFilter
            ? roleFilter.value
            : "ALL";


    const filteredUsers =
        allUsers.filter(user => {

            const name =
                (user.fullName || "")
                    .toLowerCase();

            const email =
                (user.email || "")
                    .toLowerCase();

            const phone =
                (user.phone || "")
                    .toLowerCase();

            const role =
                user.role || "";


            const matchesSearch =
                name.includes(searchTerm) ||
                email.includes(searchTerm) ||
                phone.includes(searchTerm);


            const matchesRole =
                selectedRole === "ALL" ||
                role === selectedRole;


            return (
                matchesSearch &&
                matchesRole
            );
        });


    displayUsers(filteredUsers);
}


/* =========================================================
   ROLE CSS CLASS
   ========================================================= */

function getRoleClass(role) {

    switch (role) {

        case "ADMIN":
            return "role-admin";

        case "MANAGER":
            return "role-manager";

        case "EMPLOYEE":
            return "role-employee";

        case "SUPPLIER":
            return "role-supplier";

        default:
            return "";
    }
}


/* =========================================================
   DELETE USER
   ========================================================= */

async function deleteUser(
    userId,
    userName
) {

    /*
     * Safety check
     */

    const confirmed =
        confirm(
            `Are you sure you want to delete ${userName}?`
        );

    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/users/${userId}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "Delete user response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to delete users."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Delete user error:",
                errorText
            );

            alert(
                "Unable to delete user."
            );

            return;
        }


        alert(
            "User deleted successfully."
        );


        /*
         * Reload user list
         */

        const users =
            await fetchUsers();

        updateUserStats(users);

        renderUsers(users);


    } catch (error) {

        console.error(
            "Delete user failed:",
            error
        );

        alert(
            "Something went wrong while deleting the user."
        );
    }
}


/* =========================================================
   EDIT USER
   ========================================================= */

function editUser(userId) {

    const user = allUsers.find(
        item => item.id === userId
    );

    if (!user) {
        alert("User not found.");
        return;
    }

    setValue("editUserId", user.id);
    setValue("editFullName", user.fullName || "");
    setValue("editEmail", user.email || "");
    setValue("editPhone", user.phone || "");
    setValue("editRole", user.role || "EMPLOYEE");

    const modal = document.getElementById("editUserModal");

    if (modal) {
        modal.classList.add("show");
    }
}


/* =========================================================
   ESCAPE JAVASCRIPT STRING
   ========================================================= */

function escapeJs(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}

/* =========================================================
   EDIT USER MODAL
   ========================================================= */

function setupEditUserModal() {

    const modal =
        document.getElementById(
            "editUserModal"
        );

    const closeButton =
        document.getElementById(
            "closeEditModal"
        );

    const cancelButton =
        document.getElementById(
            "cancelEditBtn"
        );

    const form =
        document.getElementById(
            "editUserForm"
        );


    function closeModal() {

        if (modal) {
            modal.classList.remove("show");
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

                await saveUserChanges(
                    closeModal
                );
            }
        );
    }
}


/* =========================================================
   SAVE USER
   ========================================================= */

async function saveUserChanges(closeModal) {

    const userId =
        document.getElementById(
            "editUserId"
        ).value;


    const fullName =
        document.getElementById(
            "editFullName"
        ).value.trim();


    const email =
        document.getElementById(
            "editEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "editPhone"
        ).value.trim();


    const role =
        document.getElementById(
            "editRole"
        ).value;


    if (
        !fullName ||
        !email ||
        !phone ||
        !role
    ) {

        alert(
            "Please fill all fields."
        );

        return;
    }


    const saveButton =
        document.querySelector(
            ".save-btn"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/users/${userId}`,
                {
                    method: "PUT",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({
                        fullName: fullName,
                        email: email,
                        phone: phone,
                        role: role
                    })
                }
            );


        console.log(
            "Update user response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to update users."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Update user error:",
                errorText
            );

            alert(
                "Unable to update user."
            );

            return;
        }


        alert(
            "User updated successfully."
        );


        closeModal();


        const users =
            await fetchUsers();

        updateUserStats(users);

        renderUsers(users);


    } catch (error) {

        console.error(
            "Update user failed:",
            error
        );

        alert(
            "Something went wrong while updating the user."
        );

    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Changes";
        }
    }
}


/* =========================================================
   SET VALUE
   ========================================================= */

function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value;
    }
}

/* =========================================================
   ADD USER MODAL
   ========================================================= */

function setupAddUserModal() {

    const modal =
        document.getElementById("addUserModal");

    const openButton =
        document.getElementById("addUserBtn");

    const closeButton =
        document.getElementById("closeAddModal");

    const cancelButton =
        document.getElementById("cancelAddBtn");

    const form =
        document.getElementById("addUserForm");


    function closeModal() {

        if (modal) {
            modal.classList.remove("show");
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
                    modal.classList.add("show");
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

                if (event.target === modal) {
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

                await createUser(closeModal);
            }
        );
    }
}


/* =========================================================
   CREATE USER
   ========================================================= */

async function createUser(closeModal) {

    const fullName =
        document.getElementById(
            "addFullName"
        ).value.trim();

    const email =
        document.getElementById(
            "addEmail"
        ).value.trim();

    const phone =
        document.getElementById(
            "addPhone"
        ).value.trim();

    const password =
        document.getElementById(
            "addPassword"
        ).value;

    const role =
        document.getElementById(
            "addRole"
        ).value;


    if (
        !fullName ||
        !email ||
        !phone ||
        !password ||
        !role
    ) {

        alert(
            "Please fill all fields."
        );

        return;
    }


    const button =
        document.getElementById(
            "createUserBtn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Creating...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/users`,
                {
                    method: "POST",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({

                        fullName: fullName,

                        email: email,

                        phone: phone,

                        password: password,

                        role: role

                    })
                }
            );


        console.log(
            "Create user response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to create users."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Create user error:",
                errorText
            );

            alert(
                "Unable to create user."
            );

            return;
        }


        alert(
            "User created successfully."
        );


        closeModal();


        const users =
            await fetchUsers();

        updateUserStats(users);

        renderUsers(users);


    } catch (error) {

        console.error(
            "Create user failed:",
            error
        );

        alert(
            "Something went wrong while creating the user."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Create User";
        }
    }
}

/* =========================================================
   PRODUCT MANAGEMENT
   ========================================================= */

let allProducts = [];


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts(products) {

    allProducts =
        Array.isArray(products)
            ? products
            : [];

    displayProducts(allProducts);
}


/* =========================================================
   DISPLAY PRODUCTS
   ========================================================= */

function displayProducts(products) {

    const tableBody =
        document.getElementById(
            "productsTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!products || products.length === 0) {

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


        row.innerHTML = `

            <td>
                #${product.id}
            </td>

            <td>
                <span class="product-name">
                    ${escapeHtml(
                        product.productName ||
                        product.name ||
                        "N/A"
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
                <span class="stock-badge ${getStockClass(stock)}">
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
                        onclick="deleteProduct(${product.id}, '${escapeJs(product.productName || product.name || "this product")}')">
                        Delete
                    </button>

                </div>

            </td>

        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   PRODUCT SEARCH
   ========================================================= */

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

                displayProducts(filtered);
            }
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled = true;

                refreshButton.textContent =
                    "↻ Loading...";

                try {

                    const products =
                        await fetchProducts();

                    updateProductStats(products);

                    renderProducts(products);

                } catch (error) {

                    console.error(
                        "Product refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled = false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }
            }
        );
    }
}


/* =========================================================
   PRODUCT DELETE
   ========================================================= */

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


        const products =
            await fetchProducts();

        updateProductStats(products);

        renderProducts(products);


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


/* =========================================================
   EDIT PRODUCT
   ========================================================= */
function editProduct(productId) {

    const product =
        allProducts.find(
            item => item.id === productId
        );

    if (!product) {
        alert("Product not found.");
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
        product.category || ""
    );

    setValue(
        "editProductDescription",
        product.description || ""
    );

    setValue(
        "editProductPrice",
        product.price || 0
    );

    setValue(
        "editProductStock",
        product.stock || 0
    );

    const modal =
        document.getElementById(
            "editProductModal"
        );

    if (modal) {
        modal.classList.add("show");
    }
}

/* =========================================================
   STOCK CLASS
   ========================================================= */

function getStockClass(stock) {

    if (stock <= 0) {
        return "stock-out";
    }

    if (stock <= 10) {
        return "stock-low";
    }

    return "stock-available";
}


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

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

/* =========================================================
   ADD PRODUCT MODAL
   ========================================================= */

function setupAddProductModal() {

    const modal =
        document.getElementById("addProductModal");

    const openButton =
        document.getElementById("addProductBtn");

    const closeButton =
        document.getElementById("closeAddProductModal");

    const cancelButton =
        document.getElementById("cancelAddProductBtn");

    const form =
        document.getElementById("addProductForm");


    function closeModal() {

        if (modal) {
            modal.classList.remove("show");
        }

        if (form) {
            form.reset();
        }
    }


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                modal.classList.add("show");
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

                if (event.target === modal) {
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

                await createProduct(closeModal);
            }
        );
    }
}


/* =========================================================
   CREATE PRODUCT
   ========================================================= */

async function createProduct(closeModal) {

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
        !description ||
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

        button.disabled = true;

        button.textContent =
            "Creating...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/products`,
                {
                    method: "POST",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({

                        name: productName,

                        category: category,

                        description: description,

                        price: price,

                        stock: stock

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


        const products =
            await fetchProducts();

        updateProductStats(products);

        renderProducts(products);


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

            button.disabled = false;

            button.textContent =
                "Create Product";
        }
    }
}

/* =========================================================
   EDIT PRODUCT MODAL
   ========================================================= */

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
            modal.classList.remove("show");
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

                if (event.target === modal) {
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


/* =========================================================
   UPDATE PRODUCT
   ========================================================= */

async function updateProduct(closeModal) {

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

        button.disabled = true;

        button.textContent =
            "Saving...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/products/${productId}`,
                {
                    method: "PUT",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({

                        name: name,

                        category: category,

                        description: description,

                        price: price,

                        stock: stock

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


        const products =
            await fetchProducts();

        updateProductStats(products);

        renderProducts(products);


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

            button.disabled = false;

            button.textContent =
                "Save Changes";
        }
    }
}

/* =========================================================
   PURCHASE REQUEST MANAGEMENT
   ========================================================= */

let allPurchaseRequests = [];


/* =========================================================
   RENDER REQUESTS
   ========================================================= */

function renderPurchaseRequests(requests) {

    allPurchaseRequests =
        Array.isArray(requests)
            ? requests
            : [];

    displayPurchaseRequests(
        allPurchaseRequests
    );
}


/* =========================================================
   DISPLAY REQUESTS
   ========================================================= */

function displayPurchaseRequests(requests) {

    const tableBody =
        document.getElementById(
            "requestTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (
        !requests ||
        requests.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    No purchase requests found.
                </td>
            </tr>
        `;

        return;
    }


    requests.forEach(request => {

        const row =
            document.createElement("tr");


        const productName =
            getFirstProductName(request);


        const status =
            request.status ||
            "UNKNOWN";


        row.innerHTML = `

            <td>
                #${request.id}
            </td>

            <td>
                ${escapeHtml(
                    request.employeeName ||
                    "Unknown"
                )}
            </td>

            <td>
                ${escapeHtml(
                    productName
                )}
            </td>

            <td>
                ${formatDate(
                    request.requestDate
                )}
            </td>

            <td>

                <span class="request-status ${getRequestStatusClass(status)}">

                    ${formatStatus(status)}

                </span>

            </td>

            <td>

                <button
                    class="request-view-btn"
                    onclick="viewPurchaseRequest(${request.id})">

                    View

                </button>

            </td>

        `;


        tableBody.appendChild(row);

    });
}


/* =========================================================
   STATUS CLASS
   ========================================================= */

function getRequestStatusClass(status) {

    switch (status) {

        case "PENDING":
            return "pending";

        case "APPROVED":
            return "approved";

        case "REJECTED":
            return "rejected";

        default:
            return "";
    }
}


/* =========================================================
   SEARCH + FILTER
   ========================================================= */

function setupPurchaseRequestManagement() {

    const searchInput =
        document.getElementById(
            "requestSearch"
        );

    const statusFilter =
        document.getElementById(
            "requestStatusFilter"
        );

    const refreshButton =
        document.getElementById(
            "refreshRequestsBtn"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterPurchaseRequests
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterPurchaseRequests
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled = true;

                refreshButton.textContent =
                    "↻ Loading...";


                try {

                    const requests =
                        await fetchPurchaseRequests();


                    updateRequestStats(
                        requests
                    );


                    renderPurchaseRequests(
                        requests
                    );


                } catch (error) {

                    console.error(
                        "Request refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled = false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }
            }
        );
    }
}


/* =========================================================
   FILTER REQUESTS
   ========================================================= */

function filterPurchaseRequests() {

    const searchInput =
        document.getElementById(
            "requestSearch"
        );

    const statusFilter =
        document.getElementById(
            "requestStatusFilter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "ALL";


    const filtered =
        allPurchaseRequests.filter(
            request => {

                const employee =
                    (
                        request.employeeName ||
                        ""
                    ).toLowerCase();


                const product =
                    getFirstProductName(
                        request
                    ).toLowerCase();


                const id =
                    String(
                        request.id || ""
                    );


                const status =
                    request.status || "";


                const matchesSearch =
                    employee.includes(
                        searchTerm
                    ) ||
                    product.includes(
                        searchTerm
                    ) ||
                    id.includes(
                        searchTerm
                    );


                const matchesStatus =
                    selectedStatus === "ALL" ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    displayPurchaseRequests(
        filtered
    );
}

/* =========================================================
   VIEW PURCHASE REQUEST
   ========================================================= */

async function viewPurchaseRequest(requestId) {

    console.log(
        "Viewing purchase request:",
        requestId
    );

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/purchase-requests/${requestId}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        console.log(
            "View request response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to view this request."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "View request error:",
                errorText
            );

            alert(
                "Unable to load purchase request."
            );

            return;
        }


        const request =
            await response.json();


        console.log(
            "Purchase request details:",
            request
        );


        const items =
            Array.isArray(request.items)
                ? request.items
                : [];


        let itemDetails =
            "No items available";


        if (items.length > 0) {

            itemDetails =
                items
                    .map(item =>
                        `${item.productName || "Product"} × ${item.quantity || 0}`
                    )
                    .join("\n");
        }


        const address =
            typeof request.deliveryAddress === "string"
                ? request.deliveryAddress
                : request.deliveryAddress
                    ? [
                        request.deliveryAddress.recipientName,
                        request.deliveryAddress.addressLine1,
                        request.deliveryAddress.addressLine2,
                        request.deliveryAddress.city,
                        request.deliveryAddress.state,
                        request.deliveryAddress.postalCode,
                        request.deliveryAddress.country
                    ]
                    .filter(Boolean)
                    .join(", ")
                    : "Not available";


        alert(
`Purchase Request #${request.id}

Employee: ${request.employeeName || "Unknown"}

Status: ${formatStatus(request.status)}

Date: ${formatDate(request.requestDate)}

Items:
${itemDetails}

Delivery Address:
${address}`
        );


    } catch (error) {

        console.error(
            "View purchase request failed:",
            error
        );

        alert(
            "Something went wrong while loading the request."
        );
    }
}

/* =========================================================
   SUPPLIER MANAGEMENT
   ========================================================= */

let allSuppliers = [];


/* =========================================================
   RENDER SUPPLIERS
   ========================================================= */

function renderSuppliers(suppliers) {

    allSuppliers =
        Array.isArray(suppliers)
            ? suppliers
            : [];

    displaySuppliers(allSuppliers);
}


/* =========================================================
   DISPLAY SUPPLIERS
   ========================================================= */

function displaySuppliers(suppliers) {

    const tableBody =
        document.getElementById(
            "suppliersTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";


    if (!suppliers || suppliers.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    No suppliers found.
                </td>
            </tr>
        `;

        return;
    }


    suppliers.forEach(supplier => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                #${supplier.id}
            </td>

            <td>
                <span class="supplier-name">
                    ${escapeHtml(
                        supplier.fullName ||
                        supplier.name ||
                        "N/A"
                    )}
                </span>
            </td>

            <td>
                ${escapeHtml(
                    supplier.email ||
                    "N/A"
                )}
            </td>

            <td>
                ${escapeHtml(
                    supplier.phone ||
                    "N/A"
                )}
            </td>

            <td>
                <span class="supplier-company">
                    ${escapeHtml(
                        supplier.companyName ||
                        supplier.company ||
                        "N/A"
                    )}
                </span>
            </td>

            <td>

                <button
                    class="supplier-view-btn"
                    onclick="viewSupplier(${supplier.id})">

                    View

                </button>

            </td>
        `;


        tableBody.appendChild(row);

    });
}


/* =========================================================
   SUPPLIER MANAGEMENT SETUP
   ========================================================= */

function setupSupplierManagement() {

    const searchInput =
        document.getElementById(
            "supplierSearch"
        );

    const refreshButton =
        document.getElementById(
            "refreshSuppliersBtn"
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
                    allSuppliers.filter(
                        supplier => {

                            const name =
                                (
                                    supplier.fullName ||
                                    supplier.name ||
                                    ""
                                ).toLowerCase();

                            const email =
                                (
                                    supplier.email ||
                                    ""
                                ).toLowerCase();

                            const company =
                                (
                                    supplier.companyName ||
                                    supplier.company ||
                                    ""
                                ).toLowerCase();


                            return (
                                name.includes(term) ||
                                email.includes(term) ||
                                company.includes(term)
                            );
                        }
                    );


                displaySuppliers(
                    filtered
                );
            }
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled = true;

                refreshButton.textContent =
                    "↻ Loading...";


                try {

                    const suppliers =
                        await fetchSuppliers();


                    renderSuppliers(
                        suppliers
                    );


                } catch (error) {

                    console.error(
                        "Supplier refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled = false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }
            }
        );
    }
}


/* =========================================================
   VIEW SUPPLIER
   ========================================================= */

async function viewSupplier(supplierId) {

    const supplier =
        allSuppliers.find(
            item => item.id === supplierId
        );


    if (!supplier) {

        alert(
            "Supplier not found."
        );

        return;
    }


    alert(
`Supplier #${supplier.id}

Name: ${supplier.fullName || supplier.name || "N/A"}

Email: ${supplier.email || "N/A"}

Phone: ${supplier.phone || "N/A"}

Company: ${supplier.companyName || supplier.company || "N/A"}`
    );
}


/* =========================================================
   PAYMENT MANAGEMENT
   ========================================================= */

let allPayments = [];


/* =========================================================
   RENDER PAYMENTS
   ========================================================= */

function renderPayments(payments) {

    allPayments =
        Array.isArray(payments)
            ? payments
            : [];

    displayPayments(allPayments);
}


/* =========================================================
   DISPLAY PAYMENTS
   ========================================================= */

function displayPayments(payments) {

    const tableBody =
        document.getElementById(
            "paymentsTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (
        !payments ||
        payments.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    No payment records found.
                </td>
            </tr>
        `;

        return;
    }


    payments.forEach(payment => {

        const row =
            document.createElement("tr");


        const status =
            payment.status ||
            "UNKNOWN";


        const purchaseRequestId =
            payment.purchaseRequestId ??
            payment.purchaseRequest?.id ??
            "N/A";


        const amount =
            payment.amount ??
            payment.totalAmount ??
            0;


        const paymentDate =
            payment.paymentDate ||
            payment.createdAt ||
            payment.paidAt ||
            null;


        row.innerHTML = `

            <td>
                #${payment.id}
            </td>

            <td>
                #${purchaseRequestId}
            </td>

            <td>
                <span class="payment-amount">
                    ₹${formatNumber(amount)}
                </span>
            </td>

            <td>

                <span class="payment-status ${getPaymentStatusClass(status)}">

                    ${formatStatus(status)}

                </span>

            </td>

            <td>
                ${formatDate(paymentDate)}
            </td>

            <td>

                <button
                    class="payment-view-btn"
                    onclick="viewPayment(${payment.id})">

                    View

                </button>

            </td>

        `;


        tableBody.appendChild(row);
    });
}


/* =========================================================
   PAYMENT STATUS CLASS
   ========================================================= */

function getPaymentStatusClass(status) {

    const normalized =
        String(status)
            .toLowerCase();


    if (
        normalized.includes("paid") ||
        normalized.includes("completed") ||
        normalized.includes("success")
    ) {
        return "paid";
    }


    if (
        normalized.includes("pending")
    ) {
        return "pending";
    }


    if (
        normalized.includes("failed") ||
        normalized.includes("rejected")
    ) {
        return "failed";
    }


    return "";
}


/* =========================================================
   SEARCH PAYMENTS
   ========================================================= */

function setupPaymentManagement() {

    const searchInput =
        document.getElementById(
            "paymentSearch"
        );

    const refreshButton =
        document.getElementById(
            "refreshPaymentsBtn"
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
                    allPayments.filter(
                        payment => {

                            const id =
                                String(
                                    payment.id || ""
                                );


                            const requestId =
                                String(
                                    payment.purchaseRequestId ??
                                    payment.purchaseRequest?.id ??
                                    ""
                                );


                            const status =
                                String(
                                    payment.status || ""
                                ).toLowerCase();


                            return (
                                id.includes(term) ||
                                requestId.includes(term) ||
                                status.includes(term)
                            );
                        }
                    );


                displayPayments(
                    filtered
                );
            }
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled = true;

                refreshButton.textContent =
                    "↻ Loading...";


                try {

                    const payments =
                        await fetchPayments();


                    renderPayments(
                        payments
                    );


                } catch (error) {

                    console.error(
                        "Payment refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled = false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }
            }
        );
    }
}


/* =========================================================
   VIEW PAYMENT
   ========================================================= */

async function viewPayment(paymentId) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/payments/${paymentId}`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "View payment response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to view this payment."
            );

            return;
        }


        if (!response.ok) {

            alert(
                "Unable to load payment details."
            );

            return;
        }


        const payment =
            await response.json();


        console.log(
            "Payment details:",
            payment
        );


        const requestId =
            payment.purchaseRequestId ??
            payment.purchaseRequest?.id ??
            "N/A";


        const amount =
            payment.amount ??
            payment.totalAmount ??
            0;


        const status =
            payment.status ||
            "UNKNOWN";


        const method =
            payment.paymentMethod ||
            payment.method ||
            "N/A";


        const date =
            payment.paymentDate ||
            payment.createdAt ||
            payment.paidAt ||
            null;


        alert(
`Payment #${payment.id}

Purchase Request: #${requestId}

Amount: ₹${formatNumber(amount)}

Status: ${formatStatus(status)}

Payment Method: ${method}

Payment Date: ${formatDate(date)}`
        );


    } catch (error) {

        console.error(
            "View payment failed:",
            error
        );

        alert(
            "Something went wrong while loading payment."
        );
    }
}


/* =========================================================
   DELIVERY MANAGEMENT
   ========================================================= */

let allDeliveries = [];


/* =========================================================
   RENDER DELIVERIES
   ========================================================= */

function renderDeliveries(deliveries) {

    allDeliveries =
        Array.isArray(deliveries)
            ? deliveries
            : [];

    displayDeliveries(allDeliveries);
}


/* =========================================================
   DISPLAY DELIVERIES
   ========================================================= */

function displayDeliveries(deliveries) {

    const tableBody =
        document.getElementById(
            "deliveriesTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";


    if (
        !deliveries ||
        deliveries.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center; padding:30px;">
                    No deliveries found.
                </td>
            </tr>
        `;

        return;
    }


    deliveries.forEach(delivery => {

        const row =
            document.createElement("tr");


        const status =
            delivery.status ||
            "UNKNOWN";


        const purchaseRequestId =
            delivery.purchaseRequestId ??
            delivery.purchaseRequest?.id ??
            "N/A";


        const supplierName =
            delivery.supplierName ||
            delivery.supplier?.name ||
            "N/A";


        const trackingNumber =
            delivery.trackingNumber ||
            "Not assigned";


        row.innerHTML = `

            <td>
                #${delivery.id}
            </td>

            <td>
                #${purchaseRequestId}
            </td>

            <td>
                ${escapeHtml(supplierName)}
            </td>

            <td>
                ${escapeHtml(trackingNumber)}
            </td>

            <td>

                <span class="delivery-status ${getDeliveryStatusClass(status)}">

                    ${formatStatus(status)}

                </span>

            </td>

            <td>
                ${formatDate(
                    delivery.estimatedDeliveryDate
                )}
            </td>

            <td>

                <button
                    class="delivery-view-btn"
                    onclick="viewDelivery(${delivery.id})">

                    View

                </button>

            </td>
        `;


        tableBody.appendChild(row);
    });
}


/* =========================================================
   DELIVERY STATUS CLASS
   ========================================================= */

function getDeliveryStatusClass(status) {

    switch (status) {

        case "ORDER_CONFIRMED":
            return "confirmed";

        case "PREPARING":
            return "preparing";

        case "SHIPPED":
            return "shipped";

        case "OUT_FOR_DELIVERY":
            return "out-for-delivery";

        case "DELIVERED":
            return "delivered";

        default:
            return "";
    }
}


/* =========================================================
   DELIVERY MANAGEMENT SETUP
   ========================================================= */

function setupDeliveryManagement() {

    const searchInput =
        document.getElementById(
            "deliverySearch"
        );

    const statusFilter =
        document.getElementById(
            "deliveryStatusFilter"
        );

    const refreshButton =
        document.getElementById(
            "refreshDeliveriesBtn"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterDeliveries
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterDeliveries
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled = true;

                refreshButton.textContent =
                    "↻ Loading...";


                try {

                    const deliveries =
                        await fetchDeliveries();


                    renderDeliveries(
                        deliveries
                    );


                } catch (error) {

                    console.error(
                        "Delivery refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled = false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }
            }
        );
    }
}


/* =========================================================
   FILTER DELIVERIES
   ========================================================= */

function filterDeliveries() {

    const searchInput =
        document.getElementById(
            "deliverySearch"
        );

    const statusFilter =
        document.getElementById(
            "deliveryStatusFilter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "ALL";


    const filtered =
        allDeliveries.filter(
            delivery => {

                const id =
                    String(
                        delivery.id || ""
                    );


                const requestId =
                    String(
                        delivery.purchaseRequestId ??
                        delivery.purchaseRequest?.id ??
                        ""
                    );


                const supplier =
                    (
                        delivery.supplierName ||
                        delivery.supplier?.name ||
                        ""
                    ).toLowerCase();


                const tracking =
                    (
                        delivery.trackingNumber ||
                        ""
                    ).toLowerCase();


                const status =
                    delivery.status ||
                    "";


                const matchesSearch =
                    id.includes(searchTerm) ||
                    requestId.includes(searchTerm) ||
                    supplier.includes(searchTerm) ||
                    tracking.includes(searchTerm);


                const matchesStatus =
                    selectedStatus === "ALL" ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    displayDeliveries(filtered);
}


/* =========================================================
   VIEW DELIVERY
   ========================================================= */

async function viewDelivery(deliveryId) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/deliveries/${deliveryId}`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "View delivery response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to view this delivery."
            );

            return;
        }


        if (!response.ok) {

            alert(
                "Unable to load delivery details."
            );

            return;
        }


        const delivery =
            await response.json();


        const requestId =
            delivery.purchaseRequestId ??
            delivery.purchaseRequest?.id ??
            "N/A";


        const supplier =
            delivery.supplierName ||
            delivery.supplier?.name ||
            "N/A";


        const tracking =
            delivery.trackingNumber ||
            "Not assigned";


        const status =
            delivery.status ||
            "UNKNOWN";


        const address =
            delivery.deliveryAddress;


        let addressText =
            "Not available";


        if (address) {

            addressText = [
                address.recipientName,
                address.addressLine1,
                address.addressLine2,
                address.city,
                address.state,
                address.postalCode,
                address.country
            ]
            .filter(Boolean)
            .join(", ");
        }


        alert(
`Delivery #${delivery.id}

Purchase Request: #${requestId}

Supplier: ${supplier}

Tracking Number: ${tracking}

Status: ${formatStatus(status)}

Estimated Delivery: ${formatDate(
    delivery.estimatedDeliveryDate
)}

Delivery Address:
${addressText}`
        );


    } catch (error) {

        console.error(
            "View delivery failed:",
            error
        );

        alert(
            "Something went wrong while loading delivery."
        );
    }
}