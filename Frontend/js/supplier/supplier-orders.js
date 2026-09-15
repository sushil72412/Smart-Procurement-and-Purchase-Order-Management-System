const API_BASE_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    initializeSupplierOrders();
});


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeSupplierOrders() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    setupLogout();
    setupRefreshButton();

    try {

        const user = getUserFromToken();

        if (!user) {
            throw new Error("Unable to read user information from token.");
        }

        const userId = user.userId || user.id;

        if (!userId) {
            throw new Error("User ID not found in JWT.");
        }

        // Load supplier profile
        const supplier = await loadSupplierProfile(userId);

        if (!supplier) {
            return;
        }

        updateSupplierInfo(supplier);

        // Load supplier orders
        await loadSupplierOrders(supplier.id);

    } catch (error) {

        console.error("Supplier Orders initialization failed:", error);

        showError(error.message);
    }
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


/* =========================================================
   JWT USER INFORMATION
   ========================================================= */

function getUserFromToken() {

    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {

        const payload = token.split(".")[1];

        const decodedPayload = atob(
            payload
                .replace(/-/g, "+")
                .replace(/_/g, "/")
        );

        return JSON.parse(decodedPayload);

    } catch (error) {

        console.error("JWT parsing failed:", error);

        return null;
    }
}


/* =========================================================
   SUPPLIER PROFILE
   ========================================================= */

async function loadSupplierProfile(userId) {

    const response = await fetch(
        `${API_BASE_URL}/api/suppliers/user/${userId}`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    console.log(
        "Supplier profile response:",
        response.status
    );

    if (response.status === 401) {

        handleUnauthorized();

        return null;
    }

    if (response.status === 403) {

        throw new Error(
            "You do not have permission to access supplier information."
        );
    }

    if (!response.ok) {

        const errorText = await response.text();

        console.error(
            "Supplier API error:",
            errorText
        );

        throw new Error(
            "Unable to load supplier profile."
        );
    }

    return await response.json();
}


/* =========================================================
   UPDATE SUPPLIER INFORMATION
   ========================================================= */

function updateSupplierInfo(supplier) {

    if (!supplier) {
        return;
    }

    const supplierName =
        document.getElementById("supplierName");

    const supplierEmail =
        document.getElementById("supplierEmail");

    const supplierAvatar =
        document.getElementById("supplierAvatar");

    if (supplierName) {

        supplierName.textContent =
            supplier.fullName ||
            supplier.companyName ||
            "Supplier";
    }

    if (supplierEmail) {

        supplierEmail.textContent =
            supplier.email || "";
    }

    if (supplierAvatar) {

        const name =
            supplier.fullName ||
            supplier.companyName ||
            "S";

        supplierAvatar.textContent =
            name.charAt(0).toUpperCase();
    }
}


/* =========================================================
   LOAD SUPPLIER ORDERS
   ========================================================= */

async function loadSupplierOrders(supplierId) {

    const loading =
        document.getElementById("ordersLoading");

    const tableBody =
        document.getElementById("orderTableBody");

    const emptyOrders =
        document.getElementById("emptyOrders");

    if (loading) {
        loading.style.display = "block";
    }

    if (emptyOrders) {
        emptyOrders.style.display = "none";
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/deliveries/supplier/${supplierId}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        console.log(
            "Supplier orders response:",
            response.status
        );

        if (response.status === 401) {

            handleUnauthorized();

            return;
        }

        if (response.status === 403) {

            throw new Error(
                "You do not have permission to access supplier orders."
            );
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Supplier orders API error:",
                errorText
            );

            throw new Error(
                "Unable to load supplier orders."
            );
        }

        const orders =
            await response.json();

        console.log(
            "Supplier orders:",
            orders
        );

        updateSummaryCards(orders);

        renderOrders(orders);

        if (!orders || orders.length === 0) {

            if (emptyOrders) {
                emptyOrders.style.display = "block";
            }
        }

    } catch (error) {

        console.error(
            "Failed to load supplier orders:",
            error
        );

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center; padding:30px;">
                        Unable to load orders.
                    </td>
                </tr>
            `;
        }

    } finally {

        if (loading) {
            loading.style.display = "none";
        }
    }
}


/* =========================================================
   RENDER ORDERS
   ========================================================= */

function renderOrders(orders) {

    const tableBody =
        document.getElementById("orderTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!orders || orders.length === 0) {
        return;
    }

    orders.forEach(order => {

        const row =
            document.createElement("tr");

        const status =
            order.status || "UNKNOWN";

        const statusClass =
            getStatusClass(status);

        const trackingNumber =
            order.trackingNumber ||
            "Not assigned";

        const estimatedDate =
            formatDate(
                order.estimatedDeliveryDate
            );

        row.innerHTML = `
            <td>
                #${escapeHtml(order.id)}
            </td>

            <td>
                #${escapeHtml(order.purchaseRequestId)}
            </td>

            <td>
                ${escapeHtml(trackingNumber)}
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(formatStatus(status))}
                </span>
            </td>

            <td>
                ${escapeHtml(estimatedDate)}
            </td>

            <td>
                ${getActionButton(order)}
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   ACTION BUTTON
   ========================================================= */

function getActionButton(order) {

    const status = order.status;

    if (status === "ORDER_CONFIRMED") {

        return `
            <button
                class="action-btn primary"
                onclick="updateOrderStatus(${order.id}, 'PREPARING')">
                Start Preparing
            </button>
        `;
    }

    if (status === "PREPARING") {

        return `
            <button
                class="action-btn primary"
                onclick="updateOrderStatus(${order.id}, 'SHIPPED')">
                Mark Shipped
            </button>
        `;
    }

    if (status === "SHIPPED") {

        return `
            <button
                class="action-btn primary"
                onclick="updateOrderStatus(${order.id}, 'OUT_FOR_DELIVERY')">
                Out for Delivery
            </button>
        `;
    }

    if (status === "OUT_FOR_DELIVERY") {

        return `
            <button
                class="action-btn primary"
                onclick="updateOrderStatus(${order.id}, 'DELIVERED')">
                Mark Delivered
            </button>
        `;
    }

    if (status === "DELIVERED") {

        return `
            <span class="completed-text">
                Completed
            </span>
        `;
    }

    return "-";
}


/* =========================================================
   UPDATE ORDER STATUS
   ========================================================= */

async function updateOrderStatus(
    orderId,
    newStatus
) {

    const confirmed =
        confirm(
            `Change order status to ${formatStatus(newStatus)}?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/deliveries/${orderId}`,
            {
                method: "PATCH",

                headers: getAuthHeaders(),

                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        console.log(
            "Order status update response:",
            response.status
        );

        if (response.status === 401) {

            handleUnauthorized();

            return;
        }

        if (response.status === 403) {

            alert(
                "You do not have permission to update this order."
            );

            return;
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Order status update error:",
                errorText
            );

            alert(
                "Unable to update order status."
            );

            return;
        }

        alert(
            `Order status updated to ${formatStatus(newStatus)}.`
        );

        initializeSupplierOrders();

    } catch (error) {

        console.error(
            "Order status update failed:",
            error
        );

        alert(
            "Something went wrong while updating the order."
        );
    }
}


/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function updateSummaryCards(orders) {

    const totalOrders =
        document.getElementById("totalOrders");

    const activeOrders =
        document.getElementById("activeOrders");

    const readyToShip =
        document.getElementById("readyToShip");

    const deliveredOrders =
        document.getElementById("deliveredOrders");

    if (!Array.isArray(orders)) {
        return;
    }

    const total =
        orders.length;

    const active =
        orders.filter(
            order => order.status !== "DELIVERED"
        ).length;

    const ready =
        orders.filter(
            order => order.status === "PREPARING"
        ).length;

    const delivered =
        orders.filter(
            order => order.status === "DELIVERED"
        ).length;

    if (totalOrders) {
        totalOrders.textContent = total;
    }

    if (activeOrders) {
        activeOrders.textContent = active;
    }

    if (readyToShip) {
        readyToShip.textContent = ready;
    }

    if (deliveredOrders) {
        deliveredOrders.textContent = delivered;
    }
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefreshButton() {

    const refreshButton =
        document.getElementById("refreshOrdersBtn");

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener(
        "click",
        () => {
            initializeSupplierOrders();
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutBtn");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
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


/* =========================================================
   UNAUTHORIZED
   ========================================================= */

function handleUnauthorized() {

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("name");

    alert(
        "Your session has expired. Please login again."
    );

    window.location.href =
        "../index.html";
}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    const tableBody =
        document.getElementById("orderTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="6"
                style="text-align:center; padding:30px;">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   STATUS HELPERS
   ========================================================= */

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return String(status)
        .toLowerCase()
        .split("_")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ");
}


function getStatusClass(status) {

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
   DATE
   ========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "Not available";
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
   HTML ESCAPE
   ========================================================= */

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