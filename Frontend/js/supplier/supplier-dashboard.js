const API_BASE_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    initializeSupplierDashboard();
});

async function initializeSupplierDashboard() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    try {
        const user = getUserFromToken();

        if (!user) {
            throw new Error("Unable to read user information from token.");
        }

        console.log("Logged-in user:", user);

        const userId = user.userId || user.id;

        if (!userId) {
            throw new Error("User ID not found in JWT.");
        }

        // Step 1: Load supplier profile
        const supplier = await loadSupplierProfile(userId);

        console.log("Supplier profile:", supplier);

        // Step 2: Update supplier information
        updateSupplierInfo(supplier);

        // Step 3: Load supplier deliveries/orders
        await loadSupplierOrders(supplier.id);

        // Step 4: Update dashboard status
        updateCurrentStatus();

    } catch (error) {
        console.error("Supplier dashboard initialization failed:", error);

        showDashboardError(error.message);
    }

    setupLogout();
    setupRefreshButton();
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
            payload.replace(/-/g, "+").replace(/_/g, "/")
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

        console.error("Supplier API error:", errorText);

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

    const welcomeSupplierName =
        document.getElementById("welcomeSupplierName");

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

    if (welcomeSupplierName) {

        welcomeSupplierName.textContent =
            supplier.fullName ||
            supplier.companyName ||
            "Supplier";
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
   SUPPLIER ORDERS / DELIVERIES
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
            "Supplier deliveries response:",
            response.status
        );

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (response.status === 403) {

            throw new Error(
                "You do not have permission to access supplier deliveries."
            );
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Supplier delivery API error:",
                errorText
            );

            throw new Error(
                "Unable to load supplier orders."
            );
        }

        const deliveries =
            await response.json();

        console.log(
            "Supplier deliveries:",
            deliveries
        );

        renderSupplierOrders(deliveries);

        updateSummaryCards(deliveries);

        updateStatusCounts(deliveries);

        if (deliveries.length === 0) {

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
   RENDER ORDER TABLE
   ========================================================= */

function renderSupplierOrders(deliveries) {

    const tableBody =
        document.getElementById("orderTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!deliveries || deliveries.length === 0) {
        return;
    }

    deliveries.forEach(delivery => {

        const row =
            document.createElement("tr");

        const status =
            delivery.status || "UNKNOWN";

        const statusClass =
            getStatusClass(status);

        const estimatedDate =
            formatDate(
                delivery.estimatedDeliveryDate
            );

        const trackingNumber =
            delivery.trackingNumber ||
            "Not assigned";

        row.innerHTML = `
            <td>
                #${delivery.id}
            </td>

            <td>
                #${delivery.purchaseRequestId}
            </td>

            <td>
                ${escapeHtml(trackingNumber)}
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${formatStatus(status)}
                </span>
            </td>

            <td>
                ${estimatedDate}
            </td>

            <td>
                <div class="action-buttons">
                    ${getActionButtons(delivery)}
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   ACTION BUTTONS
   ========================================================= */

function getActionButtons(delivery) {

    const status = delivery.status;

    if (status === "ORDER_CONFIRMED") {

        return `
            <button
                class="action-btn primary"
                onclick="updateDeliveryStatus(${delivery.id}, 'PREPARING')">
                Start Preparing
            </button>
        `;
    }

    if (status === "PREPARING") {

        return `
            <button
                class="action-btn primary"
                onclick="updateDeliveryStatus(${delivery.id}, 'SHIPPED')">
                Mark Shipped
            </button>
        `;
    }

    if (status === "SHIPPED") {

        return `
            <button
                class="action-btn primary"
                onclick="updateDeliveryStatus(${delivery.id}, 'OUT_FOR_DELIVERY')">
                Out for Delivery
            </button>
        `;
    }

    if (status === "OUT_FOR_DELIVERY") {

        return `
            <button
                class="action-btn primary"
                onclick="updateDeliveryStatus(${delivery.id}, 'DELIVERED')">
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

    return `
        <span>View</span>
    `;
}


/* =========================================================
   UPDATE DELIVERY STATUS
   ========================================================= */

async function updateDeliveryStatus(
    deliveryId,
    newStatus
) {

    const confirmed =
        confirm(
            `Change delivery status to ${formatStatus(newStatus)}?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/deliveries/${deliveryId}`,
            {
                method: "PATCH",

                headers: getAuthHeaders(),

                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        console.log(
            "Status update response:",
            response.status
        );

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (response.status === 403) {

            alert(
                "You do not have permission to update this delivery."
            );

            return;
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Status update error:",
                errorText
            );

            alert(
                "Unable to update delivery status."
            );

            return;
        }

        alert(
            `Delivery status updated to ${formatStatus(newStatus)}.`
        );

        // Reload dashboard
        initializeSupplierDashboard();

    } catch (error) {

        console.error(
            "Delivery status update failed:",
            error
        );

        alert(
            "Something went wrong while updating the delivery."
        );
    }
}


/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function updateSummaryCards(deliveries) {

    const totalOrders =
        document.getElementById("totalOrders");

    const activeOrders =
        document.getElementById("activeOrders");

    const readyToShip =
        document.getElementById("readyToShip");

    const deliveredOrders =
        document.getElementById("deliveredOrders");

    const total =
        deliveries.length;

    const active =
        deliveries.filter(
            d => d.status !== "DELIVERED"
        ).length;

    const ready =
        deliveries.filter(
            d =>
                d.status === "PREPARING"
        ).length;

    const delivered =
        deliveries.filter(
            d =>
                d.status === "DELIVERED"
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
   STATUS COUNTS
   ========================================================= */

function updateStatusCounts(deliveries) {

    const counts = {
        ORDER_CONFIRMED: 0,
        PREPARING: 0,
        SHIPPED: 0,
        OUT_FOR_DELIVERY: 0,
        DELIVERED: 0
    };

    deliveries.forEach(delivery => {

        if (counts.hasOwnProperty(delivery.status)) {

            counts[delivery.status]++;
        }
    });

    setText(
        "confirmedCount",
        counts.ORDER_CONFIRMED
    );

    setText(
        "preparingCount",
        counts.PREPARING
    );

    setText(
        "shippedCount",
        counts.SHIPPED
    );

    setText(
        "outForDeliveryCount",
        counts.OUT_FOR_DELIVERY
    );

    setText(
        "deliveredCount",
        counts.DELIVERED
    );
}


/* =========================================================
   CURRENT STATUS
   ========================================================= */

function updateCurrentStatus() {

    const statusElement =
        document.getElementById("currentStatus");

    if (statusElement) {

        statusElement.textContent =
            "System Operational";
    }

    const accountStatus =
        document.getElementById(
            "supplierAccountStatus"
        );

    if (accountStatus) {

        accountStatus.textContent =
            "Active";
    }
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefreshButton() {

    const refreshButton =
        document.getElementById(
            "refreshOrdersBtn"
        );

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener(
        "click",
        () => {
            initializeSupplierDashboard();
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
        () => {

            localStorage.removeItem("token");

            window.location.href =
                "../index.html";
        }
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return status
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


function handleUnauthorized() {

    localStorage.removeItem("token");

    alert(
        "Your session has expired. Please login again."
    );

    window.location.href =
        "../index.html";
}


function showDashboardError(message) {

    console.error(
        "Dashboard error:",
        message
    );

    const tableBody =
        document.getElementById(
            "orderTableBody"
        );

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    ${escapeHtml(message)}
                </td>
            </tr>
        `;
    }
}