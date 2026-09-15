const API_BASE_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    initializeSupplierShipments();
});


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeSupplierShipments() {

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

        await loadShipments(supplier.id);

    } catch (error) {

        console.error(
            "Supplier Shipments initialization failed:",
            error
        );

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
   JWT
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
            "Supplier profile API error:",
            errorText
        );

        throw new Error(
            "Unable to load supplier profile."
        );
    }

    return await response.json();
}


/* =========================================================
   SUPPLIER INFORMATION
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
   LOAD SHIPMENTS
   ========================================================= */

async function loadShipments(supplierId) {

    const loading =
        document.getElementById("shipmentsLoading");

    const tableBody =
        document.getElementById("shipmentTableBody");

    const emptyShipments =
        document.getElementById("emptyShipments");

    if (loading) {
        loading.style.display = "block";
    }

    if (emptyShipments) {
        emptyShipments.style.display = "none";
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
            "Supplier shipments response:",
            response.status
        );

        if (response.status === 401) {

            handleUnauthorized();

            return;
        }

        if (response.status === 403) {

            throw new Error(
                "You do not have permission to access shipments."
            );
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Shipment API error:",
                errorText
            );

            throw new Error(
                "Unable to load shipments."
            );
        }

        const shipments =
            await response.json();

        console.log(
            "Supplier shipments:",
            shipments
        );

        updateShipmentSummary(shipments);

        renderShipments(shipments);

        if (!shipments || shipments.length === 0) {

            if (emptyShipments) {
                emptyShipments.style.display = "block";
            }
        }

    } catch (error) {

        console.error(
            "Failed to load shipments:",
            error
        );

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center; padding:30px;">
                        Unable to load shipments.
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
   RENDER SHIPMENTS
   ========================================================= */

function renderShipments(shipments) {

    const tableBody =
        document.getElementById("shipmentTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!shipments || shipments.length === 0) {
        return;
    }

    shipments.forEach(shipment => {

        const row =
            document.createElement("tr");

        const status =
            shipment.status || "UNKNOWN";

        const trackingNumber =
            shipment.trackingNumber ||
            "Not assigned";

        const estimatedDate =
            formatDate(
                shipment.estimatedDeliveryDate
            );

        row.innerHTML = `
            <td>
                #${escapeHtml(shipment.id)}
            </td>

            <td>
                #${escapeHtml(shipment.purchaseRequestId)}
            </td>

            <td>
                ${escapeHtml(trackingNumber)}
            </td>

            <td>
                <span class="status-badge ${getStatusClass(status)}">
                    ${escapeHtml(formatStatus(status))}
                </span>
            </td>

            <td>
                ${escapeHtml(estimatedDate)}
            </td>

            <td>
                ${getShipmentAction(shipment)}
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   SHIPMENT ACTION
   ========================================================= */

function getShipmentAction(shipment) {

    const status = shipment.status;

    if (status === "ORDER_CONFIRMED") {

        return `
            <button
                class="action-btn primary"
                onclick="updateShipmentStatus(${shipment.id}, 'PREPARING')">
                Start Preparing
            </button>
        `;
    }

    if (status === "PREPARING") {

        return `
            <button
                class="action-btn primary"
                onclick="updateShipmentStatus(${shipment.id}, 'SHIPPED')">
                Mark Shipped
            </button>
        `;
    }

    if (status === "SHIPPED") {

        return `
            <button
                class="action-btn primary"
                onclick="updateShipmentStatus(${shipment.id}, 'OUT_FOR_DELIVERY')">
                Out for Delivery
            </button>
        `;
    }

    if (status === "OUT_FOR_DELIVERY") {

        return `
            <button
                class="action-btn primary"
                onclick="updateShipmentStatus(${shipment.id}, 'DELIVERED')">
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
   UPDATE SHIPMENT STATUS
   ========================================================= */

async function updateShipmentStatus(
    shipmentId,
    newStatus
) {

    const confirmed =
        confirm(
            `Change shipment status to ${formatStatus(newStatus)}?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/deliveries/${shipmentId}`,
            {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        console.log(
            "Shipment status update response:",
            response.status
        );

        if (response.status === 401) {

            handleUnauthorized();

            return;
        }

        if (response.status === 403) {

            alert(
                "You do not have permission to update this shipment."
            );

            return;
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Shipment update error:",
                errorText
            );

            alert(
                "Unable to update shipment status."
            );

            return;
        }

        alert(
            `Shipment status updated to ${formatStatus(newStatus)}.`
        );

        initializeSupplierShipments();

    } catch (error) {

        console.error(
            "Shipment update failed:",
            error
        );

        alert(
            "Something went wrong while updating the shipment."
        );
    }
}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateShipmentSummary(shipments) {

    const totalElement =
        document.getElementById("totalShipments");

    const preparingElement =
        document.getElementById("preparingShipments");

    const inTransitElement =
        document.getElementById("inTransitShipments");

    const deliveredElement =
        document.getElementById("deliveredShipments");

    if (!Array.isArray(shipments)) {
        return;
    }

    const total =
        shipments.length;

    const preparing =
        shipments.filter(
            shipment =>
                shipment.status === "PREPARING"
        ).length;

    const inTransit =
        shipments.filter(
            shipment =>
                shipment.status === "SHIPPED" ||
                shipment.status === "OUT_FOR_DELIVERY"
        ).length;

    const delivered =
        shipments.filter(
            shipment =>
                shipment.status === "DELIVERED"
        ).length;

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (preparingElement) {
        preparingElement.textContent = preparing;
    }

    if (inTransitElement) {
        inTransitElement.textContent = inTransit;
    }

    if (deliveredElement) {
        deliveredElement.textContent = delivered;
    }
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefreshButton() {

    const refreshButton =
        document.getElementById("refreshShipmentsBtn");

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener(
        "click",
        () => {
            initializeSupplierShipments();
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
        document.getElementById("shipmentTableBody");

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