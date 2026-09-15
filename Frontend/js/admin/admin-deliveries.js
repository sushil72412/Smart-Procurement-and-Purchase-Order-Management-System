// =========================================
// EPMS - ADMIN DELIVERIES
// =========================================

const API_BASE_URL = "http://localhost:8080";

let allDeliveries = [];


// =========================================
// INITIALIZE
// =========================================

document.addEventListener("DOMContentLoaded", () => {
    initializeAdminDeliveries();
});


async function initializeAdminDeliveries() {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    if (role !== "ADMIN") {
        alert("Access denied. Admin access required.");
        window.location.href = "../index.html";
        return;
    }

    const email = localStorage.getItem("email");

    const adminEmail = document.getElementById("adminEmail");

    if (adminEmail && email) {
        adminEmail.textContent = email;
    }

    setupEventListeners();

    await loadDeliveries();
}


// =========================================
// AUTH HEADERS
// =========================================

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


// =========================================
// EVENT LISTENERS
// =========================================

function setupEventListeners() {

    const searchInput =
        document.getElementById("deliverySearch");

    const statusFilter =
        document.getElementById("deliveryStatusFilter");

    const refreshButton =
        document.getElementById("refreshDeliveriesBtn");

    const logoutButton =
        document.getElementById("logoutBtn");


    if (searchInput) {

        searchInput.addEventListener("input", () => {
            renderDeliveries();
        });

    }


    if (statusFilter) {

        statusFilter.addEventListener("change", () => {
            renderDeliveries();
        });

    }


    if (refreshButton) {

        refreshButton.addEventListener("click", async () => {
            await loadDeliveries();
        });

    }


    if (logoutButton) {

        logoutButton.addEventListener("click", logoutUser);

    }
}


// =========================================
// LOAD ALL DELIVERIES
// =========================================

async function loadDeliveries() {

    const tableBody =
        document.getElementById("deliveriesTableBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    Loading deliveries...
                </td>
            </tr>
        `;

    }


    try {

        const response = await fetch(
            API_BASE_URL + "/api/deliveries",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        // Unauthorized
        if (response.status === 401) {

            logoutUser();

            return;
        }


        // Forbidden
        if (response.status === 403) {

            throw new Error(
                "You are not authorized to view deliveries."
            );

        }


        // Other errors
        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Delivery API Error:",
                response.status,
                errorText
            );

            throw new Error(
                "Failed to load deliveries. Status: " +
                response.status +
                " - " +
                errorText
            );

        }


        const deliveries =
            await response.json();


        console.log(
            "Admin - All Deliveries:",
            deliveries
        );


        allDeliveries =
            Array.isArray(deliveries)
                ? deliveries
                : [];


        renderDeliveries();

    }


    catch (error) {

        console.error(
            "Error loading deliveries:",
            error
        );

        showError(
            error.message ||
            "Unable to load deliveries. Please try again."
        );

    }
}


// =========================================
// RENDER DELIVERIES
// =========================================

function renderDeliveries() {

    const tableBody =
        document.getElementById("deliveriesTableBody");

    if (!tableBody) {
        return;
    }


    const searchInput =
        document.getElementById("deliverySearch");

    const statusFilter =
        document.getElementById("deliveryStatusFilter");


    const searchTerm =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "ALL";


    let deliveries =
        [...allDeliveries];


    // =========================================
    // SEARCH
    // =========================================

    if (searchTerm) {

        deliveries =
            deliveries.filter(delivery => {

                const purchaseRequestId =
                    String(
                        delivery.purchaseRequestId ?? ""
                    ).toLowerCase();


                const employee =
                    String(
                        delivery.employeeName ?? ""
                    ).toLowerCase();


                const supplier =
                    String(
                        delivery.supplierName ?? ""
                    ).toLowerCase();


                const trackingNumber =
                    String(
                        delivery.trackingNumber ?? ""
                    ).toLowerCase();


                const status =
                    normalizeStatus(
                        delivery.status
                    ).toLowerCase();


                return (
                    purchaseRequestId.includes(searchTerm) ||
                    employee.includes(searchTerm) ||
                    supplier.includes(searchTerm) ||
                    trackingNumber.includes(searchTerm) ||
                    status.includes(searchTerm)
                );

            });

    }


    // =========================================
    // STATUS FILTER
    // =========================================

    if (selectedStatus !== "ALL") {

        deliveries =
            deliveries.filter(delivery => {

                const status =
                    normalizeStatus(
                        delivery.status
                    );


                if (selectedStatus === "PENDING") {

                    return (
                        status === "ORDER_CONFIRMED" ||
                        status === "PREPARING" ||
                        status === "PENDING"
                    );

                }


                if (selectedStatus === "IN_TRANSIT") {

                    return (
                        status === "SHIPPED" ||
                        status === "OUT_FOR_DELIVERY" ||
                        status === "IN_TRANSIT"
                    );

                }


                if (selectedStatus === "DELIVERED") {

                    return status === "DELIVERED";

                }


                return false;

            });

    }


    // =========================================
    // EMPTY STATE
    // =========================================

    if (deliveries.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    No deliveries found.
                </td>
            </tr>
        `;

        return;
    }


    // =========================================
    // TABLE ROWS
    // =========================================

    tableBody.innerHTML =
        deliveries.map(
            delivery => createDeliveryRow(delivery)
        ).join("");
}


// =========================================
// CREATE DELIVERY ROW
// =========================================

function createDeliveryRow(delivery) {

    const id =
        delivery.id ?? "-";


    const purchaseRequestId =
        delivery.purchaseRequestId ?? "-";


    const employeeName =
        delivery.employeeName ||
        "Not available";


    const supplierName =
        delivery.supplierName ||
        "Not available";


    const trackingNumber =
        delivery.trackingNumber ||
        "Not available";


    const status =
        normalizeStatus(
            delivery.status
        );


    const deliveryDate =
        formatDate(
            delivery.estimatedDeliveryDate
        );


    return `
        <tr>

            <td>
                ${escapeHtml(String(id))}
            </td>

            <td>
                #${escapeHtml(String(purchaseRequestId))}
            </td>

            <td>
                ${escapeHtml(employeeName)}
            </td>

            <td>
                ${escapeHtml(supplierName)}
            </td>

            <td>
                ${escapeHtml(trackingNumber)}
            </td>

            <td>
                <span class="delivery-status ${getStatusClass(status)}">
                    ${escapeHtml(formatStatus(status))}
                </span>
            </td>

            <td>
                ${escapeHtml(deliveryDate)}
            </td>

        </tr>
    `;
}


// =========================================
// STATUS
// =========================================

function normalizeStatus(status) {

    if (!status) {
        return "";
    }

    return String(status)
        .trim()
        .toUpperCase();
}


function getStatusClass(status) {

    switch (status) {

        case "ORDER_CONFIRMED":
        case "PENDING":
        case "PREPARING":
            return "pending";


        case "SHIPPED":
        case "IN_TRANSIT":
        case "OUT_FOR_DELIVERY":
            return "in-transit";


        case "DELIVERED":
            return "delivered";


        case "FAILED":
        case "CANCELLED":
            return "cancelled";


        default:
            return "pending";
    }
}


function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );
}


// =========================================
// DATE FORMAT
// =========================================

function formatDate(value) {

    if (!value) {
        return "Not available";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

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


// =========================================
// ERROR
// =========================================

function showError(message) {

    const tableBody =
        document.getElementById("deliveriesTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
}


// =========================================
// LOGOUT
// =========================================

function logoutUser(event) {

    if (event) {
        event.preventDefault();
    }


    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("epmsCart");


    window.location.replace("../index.html");
}


// =========================================
// ESCAPE HTML
// =========================================

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