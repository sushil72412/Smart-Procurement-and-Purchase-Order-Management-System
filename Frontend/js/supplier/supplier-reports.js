const API_BASE_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    initializeSupplierReports();
});

async function initializeSupplierReports() {

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

        const supplier = await loadSupplierProfile(userId);

        if (!supplier) {
            return;
        }

        updateSupplierInfo(supplier);

        await loadSupplierReports();

    } catch (error) {

        console.error("Supplier Reports initialization failed:", error);

        showError(error.message);
    }
}


/* =========================
   AUTHORIZATION
========================= */

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

        const decodedPayload = atob(
            payload.replace(/-/g, "+").replace(/_/g, "/")
        );

        return JSON.parse(decodedPayload);

    } catch (error) {

        console.error("JWT parsing failed:", error);

        return null;
    }
}


/* =========================
   SUPPLIER PROFILE
========================= */

async function loadSupplierProfile(userId) {

    const response = await fetch(
        `${API_BASE_URL}/api/suppliers/user/${userId}`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    console.log("Supplier profile response:", response.status);

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
            "Supplier profile API error:",
            errorText
        );

        throw new Error("Unable to load supplier profile.");
    }

    return await response.json();
}


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

    const name =
        supplier.fullName ||
        supplier.companyName ||
        "Supplier";

    if (supplierName) {
        supplierName.textContent = name;
    }

    if (supplierEmail) {
        supplierEmail.textContent =
            supplier.email || "";
    }

    if (supplierAvatar) {
        supplierAvatar.textContent =
            name.charAt(0).toUpperCase();
    }
}


/* =========================
   LOAD REPORT DATA
========================= */

async function loadSupplierReports() {

    const tableBody =
        document.getElementById("orderReportBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    Loading reports...
                </td>
            </tr>
        `;
    }

    try {

        /*
         * First get the logged-in supplier.
         */
        const user = getUserFromToken();

        if (!user) {
            throw new Error("Unable to identify supplier.");
        }

        const userId = user.userId || user.id;

        const supplier =
            await loadSupplierProfile(userId);

        if (!supplier) {
            return;
        }

        const supplierId = supplier.id;

        if (!supplierId) {
            throw new Error("Supplier ID not found.");
        }


        /*
         * Get supplier deliveries/orders.
         */
        const response = await fetch(
            `${API_BASE_URL}/api/deliveries/supplier/${supplierId}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        console.log(
            "Supplier report response:",
            response.status
        );

        if (response.status === 401) {

            handleUnauthorized();

            return;
        }

        if (response.status === 403) {

            throw new Error(
                "You do not have permission to access supplier reports."
            );
        }

        if (!response.ok) {

            const errorText = await response.text();

            console.error(
                "Supplier report API error:",
                errorText
            );

            throw new Error(
                "Unable to load supplier report."
            );
        }

        const deliveries = await response.json();

        console.log(
            "Supplier report data:",
            deliveries
        );


        updateReportSummary(deliveries);

        renderOrderReport(deliveries);

    } catch (error) {

        console.error(
            "Failed to load supplier reports:",
            error
        );

        showError("Unable to load supplier reports.");
    }
}


/* =========================
   SUMMARY
========================= */

function updateReportSummary(deliveries) {

    if (!Array.isArray(deliveries)) {
        return;
    }

    const totalOrders =
        deliveries.length;

    const deliveredOrders =
        deliveries.filter(delivery =>
            normalizeStatus(delivery.status) === "DELIVERED"
        ).length;

    const transitOrders =
        deliveries.filter(delivery => {

            const status =
                normalizeStatus(delivery.status);

            return (
                status === "SHIPPED" ||
                status === "OUT_FOR_DELIVERY" ||
                status === "IN_TRANSIT"
            );

        }).length;

    const pendingOrders =
        deliveries.filter(delivery => {

            const status =
                normalizeStatus(delivery.status);

            return (
                status === "ORDER_CONFIRMED" ||
                status === "PREPARING" ||
                status === "PENDING"
            );

        }).length;


    const totalElement =
        document.getElementById("totalOrders");

    const deliveredElement =
        document.getElementById("deliveredOrders");

    const transitElement =
        document.getElementById("transitOrders");

    const pendingElement =
        document.getElementById("pendingOrders");


    if (totalElement) {
        totalElement.textContent = totalOrders;
    }

    if (deliveredElement) {
        deliveredElement.textContent = deliveredOrders;
    }

    if (transitElement) {
        transitElement.textContent = transitOrders;
    }

    if (pendingElement) {
        pendingElement.textContent = pendingOrders;
    }
}


/* =========================
   ORDER REPORT TABLE
========================= */

function renderOrderReport(deliveries) {

    const tableBody =
        document.getElementById("orderReportBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";


    if (!Array.isArray(deliveries) ||
        deliveries.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No order data available.
                </td>
            </tr>
        `;

        return;
    }


    deliveries.forEach(delivery => {

        const row =
            document.createElement("tr");


        const deliveryId =
            delivery.id != null
                ? delivery.id
                : "-";


        const purchaseRequestId =
            delivery.purchaseRequestId != null
                ? delivery.purchaseRequestId
                : "-";


        const productName =
            delivery.productName ||
            delivery.product?.name ||
            "-";


        const quantity =
            delivery.quantity != null
                ? delivery.quantity
                : "-";


        const status =
            normalizeStatus(
                delivery.status
            );


        const trackingNumber =
            delivery.trackingNumber ||
            "-";


        row.innerHTML = `

            <td>
                #${escapeHtml(deliveryId)}
            </td>

            <td>
                #PR-${formatRequestId(purchaseRequestId)}
            </td>

            <td>
                ${escapeHtml(productName)}
            </td>

            <td>
                ${escapeHtml(quantity)}
            </td>

            <td>
                <span class="status-badge ${getStatusClass(status)}">
                    ${escapeHtml(formatStatus(status))}
                </span>
            </td>

            <td>
                ${escapeHtml(trackingNumber)}
            </td>
        `;


        tableBody.appendChild(row);

    });
}


/* =========================
   STATUS HELPERS
========================= */

function normalizeStatus(status) {

    if (!status) {
        return "PENDING";
    }

    return String(status)
        .trim()
        .toUpperCase();
}


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

    status = normalizeStatus(status);

    if (status === "DELIVERED") {
        return "status-delivered";
    }

    if (
        status === "SHIPPED" ||
        status === "OUT_FOR_DELIVERY" ||
        status === "IN_TRANSIT"
    ) {
        return "status-transit";
    }

    return "status-pending";
}


/* =========================
   BUTTONS
========================= */

function setupRefreshButton() {

    const refreshButton =
        document.getElementById("refreshReportsBtn");

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener(
        "click",
        () => {
            loadSupplierReports();
        }
    );
}


/* =========================
   LOGOUT
========================= */

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

    window.location.href = "../index.html";
}


function handleUnauthorized() {

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("name");

    alert(
        "Your session has expired. Please login again."
    );

    window.location.href = "../index.html";
}


/* =========================
   ERROR HANDLING
========================= */

function showError(message) {

    const tableBody =
        document.getElementById("orderReportBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-message">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
}


/* =========================
   FORMATTING
========================= */

function formatRequestId(id) {

    if (
        id === "-" ||
        id === null ||
        id === undefined
    ) {
        return "-";
    }

    return String(id).padStart(3, "0");
}


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