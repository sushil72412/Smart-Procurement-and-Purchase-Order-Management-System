// =========================================
// EPMS - MANAGER DELIVERIES
// =========================================

const API_BASE_URL = "http://localhost:8080";

const token = localStorage.getItem("token");


// =========================================
// DOM ELEMENTS
// =========================================

const deliveriesContainer =
    document.getElementById("deliveriesContainer");

const deliveryCount =
    document.getElementById("deliveryCount");

const filterButtons =
    document.querySelectorAll(".delivery-filter");

const logoutButton =
    document.getElementById("logoutButton");

const userEmail =
    document.getElementById("userEmail");

const userRole =
    document.getElementById("userRole");


// =========================================
// AUTH HEADERS
// =========================================

function getAuthHeaders() {

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };

}


// =========================================
// DELIVERY DATA
// =========================================

let allDeliveries = [];

let currentFilter = "ALL";


// =========================================
// CHECK LOGIN
// =========================================

if (!token) {

    window.location.href =
        "../index.html";

}


// =========================================
// LOAD ALL DELIVERIES
// =========================================

async function loadDeliveries() {

    try {

        showLoading();


        const response =
            await fetch(
                API_BASE_URL + "/api/deliveries",
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        // =========================================
        // UNAUTHORIZED
        // =========================================

        if (response.status === 401) {

            logoutUser();

            return;

        }


        // =========================================
        // FORBIDDEN
        // =========================================

        if (response.status === 403) {

            throw new Error(
                "You are not authorized to view deliveries."
            );

        }


        // =========================================
        // OTHER ERRORS
        // =========================================

if (!response.ok) {

    const errorText =
        await response.text();

    console.error(
        "Delivery API Error:",
        response.status,
        errorText
    );

    throw new Error(
        "Failed to load deliveries. Status: "
        + response.status
        + " - "
        + errorText
    );

}

        // =========================================
        // READ RESPONSE
        // =========================================

        const deliveries =
            await response.json();


        console.log(
            "Manager - All Deliveries:",
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

    let deliveries =
        allDeliveries;


    // =========================================
    // APPLY FILTER
    // =========================================

    if (currentFilter !== "ALL") {

        deliveries =
            allDeliveries.filter(
                delivery => {

                    const status =
                        normalizeStatus(
                            delivery.status
                        );


                    // ---------------------------------
                    // PENDING
                    // ---------------------------------

                    if (
                        currentFilter === "PENDING"
                    ) {

                        return (
                            status === "ORDER_CONFIRMED" ||
                            status === "PREPARING" ||
                            status === "PENDING"
                        );

                    }


                    // ---------------------------------
                    // IN TRANSIT
                    // ---------------------------------

                    if (
                        currentFilter === "IN_TRANSIT"
                    ) {

                        return (
                            status === "SHIPPED" ||
                            status === "OUT_FOR_DELIVERY" ||
                            status === "IN_TRANSIT"
                        );

                    }


                    // ---------------------------------
                    // DELIVERED
                    // ---------------------------------

                    if (
                        currentFilter === "DELIVERED"
                    ) {

                        return status === "DELIVERED";

                    }


                    return false;

                }
            );

    }


    // =========================================
    // UPDATE COUNT
    // =========================================

    if (deliveryCount) {

        deliveryCount.textContent =
            `${deliveries.length} ${
                deliveries.length === 1
                    ? "Delivery"
                    : "Deliveries"
            }`;

    }


    // =========================================
    // EMPTY STATE
    // =========================================

    if (deliveries.length === 0) {

        deliveriesContainer.innerHTML = `

            <div class="empty-deliveries">

                <div class="empty-deliveries-icon">
                    📦
                </div>

                <h3>
                    No deliveries found
                </h3>

                <p>
                    ${
                        currentFilter === "ALL"
                            ? "There are no deliveries available."
                            : "No deliveries match the selected status."
                    }
                </p>

            </div>

        `;

        return;

    }


    // =========================================
    // RENDER DELIVERY CARDS
    // =========================================

    deliveriesContainer.innerHTML =
        deliveries.map(
            delivery =>
                createDeliveryCard(
                    delivery
                )
        ).join("");

}


// =========================================
// CREATE DELIVERY CARD
// =========================================

function createDeliveryCard(delivery) {

    const status =
        normalizeStatus(
            delivery.status
        );


    const statusClass =
        getStatusClass(status);


    const statusText =
        formatStatus(status);


    const estimatedDate =
        formatDate(
            delivery.estimatedDeliveryDate
        );


    return `

        <div class="delivery-card">

            <div class="delivery-main">

                <div class="delivery-request-id">

                    Purchase Request #${escapeHtml(
                        delivery.purchaseRequestId
                    )}

                </div>


                <h3 class="delivery-title">
                    Delivery
                </h3>


                <p class="delivery-date">

                    Estimated Delivery:

                    <strong>
                        ${estimatedDate}
                    </strong>

                </p>


                <div class="delivery-details">


                    <!-- Tracking Number -->

                    <div class="delivery-detail">

                        <span class="delivery-detail-label">
                            Tracking Number
                        </span>

                        <span class="delivery-detail-value">

                            ${escapeHtml(
                                delivery.trackingNumber ||
                                "Not available"
                            )}

                        </span>

                    </div>


                    <!-- Supplier -->

                    <div class="delivery-detail">

                        <span class="delivery-detail-label">
                            Supplier
                        </span>

                        <span class="delivery-detail-value">

                            ${escapeHtml(
                                delivery.supplierName ||
                                "Not available"
                            )}

                        </span>

                    </div>


                    <!-- Created -->

                    <div class="delivery-detail">

                        <span class="delivery-detail-label">
                            Created
                        </span>

                        <span class="delivery-detail-value">

                            ${formatDate(
                                delivery.createdAt
                            )}

                        </span>

                    </div>

                </div>

            </div>


            <!-- DELIVERY SIDE -->

            <div class="delivery-side">

                <span
                    class="delivery-status ${statusClass}">

                    ${statusText}

                </span>


                <button
                    type="button"
                    class="view-delivery-btn"
                    data-delivery-id="${delivery.id}">

                    View Details

                </button>

            </div>

        </div>

    `;

}


// =========================================
// STATUS HELPERS
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
// FILTER BUTTONS
// =========================================

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                this.classList.add(
                    "active"
                );


                currentFilter =
                    this.dataset.status;


                renderDeliveries();

            }
        );

    }
);


// =========================================
// VIEW DETAILS
// =========================================

deliveriesContainer.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                ".view-delivery-btn"
            );


        if (!button) {

            return;

        }


        const deliveryId =
            button.dataset.deliveryId;


        const delivery =
            allDeliveries.find(
                item =>
                    String(item.id) ===
                    String(deliveryId)
            );


        if (!delivery) {

            return;

        }


        showDeliveryDetails(
            delivery
        );

    }
);


// =========================================
// DELIVERY DETAILS MODAL
// =========================================

function showDeliveryDetails(delivery) {

    const address =
        delivery.deliveryAddress;


    const addressText =
        address
            ? `
                ${escapeHtml(
                    address.addressLine1 || ""
                )}<br>

                ${escapeHtml(
                    address.addressLine2 || ""
                )}<br>

                ${escapeHtml(
                    address.city || ""
                )},

                ${escapeHtml(
                    address.state || ""
                )}
                -

                ${escapeHtml(
                    address.postalCode || ""
                )}<br>

                ${escapeHtml(
                    address.country || ""
                )}
              `
            : "Address not available";


    const details =
        document.createElement("div");


    details.className =
        "delivery-details-modal";


    details.innerHTML = `

        <div class="delivery-modal-overlay">

            <div class="delivery-modal">


                <div class="delivery-modal-header">

                    <div>

                        <span class="delivery-request-id">

                            PURCHASE REQUEST #${
                                escapeHtml(
                                    delivery.purchaseRequestId
                                )
                            }

                        </span>


                        <h3>
                            Delivery Details
                        </h3>

                    </div>


                    <button
                        type="button"
                        class="delivery-modal-close">

                        ×

                    </button>

                </div>


                <div class="delivery-modal-body">


                    <!-- STATUS -->

                    <div class="modal-detail-row">

                        <span>
                            Status
                        </span>

                        <strong>

                            ${formatStatus(
                                normalizeStatus(
                                    delivery.status
                                )
                            )}

                        </strong>

                    </div>


                    <!-- TRACKING -->

                    <div class="modal-detail-row">

                        <span>
                            Tracking Number
                        </span>

                        <strong>

                            ${escapeHtml(
                                delivery.trackingNumber ||
                                "Not available"
                            )}

                        </strong>

                    </div>


                    <!-- SUPPLIER -->

                    <div class="modal-detail-row">

                        <span>
                            Supplier
                        </span>

                        <strong>

                            ${escapeHtml(
                                delivery.supplierName ||
                                "Not available"
                            )}

                        </strong>

                    </div>


                    <!-- SUPPLIER EMAIL -->

                    <div class="modal-detail-row">

                        <span>
                            Supplier Email
                        </span>

                        <strong>

                            ${escapeHtml(
                                delivery.supplierEmail ||
                                "Not available"
                            )}

                        </strong>

                    </div>


                    <!-- ESTIMATED DELIVERY -->

                    <div class="modal-detail-row">

                        <span>
                            Estimated Delivery
                        </span>

                        <strong>

                            ${formatDate(
                                delivery.estimatedDeliveryDate
                            )}

                        </strong>

                    </div>


                    <!-- DELIVERY ADDRESS -->

                    <div class="modal-address">

                        <span>
                            Delivery Address
                        </span>

                        <p>
                            ${addressText}
                        </p>

                    </div>


                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        details
    );


    const closeButton =
        details.querySelector(
            ".delivery-modal-close"
        );


    const overlay =
        details.querySelector(
            ".delivery-modal-overlay"
        );


    closeButton.addEventListener(
        "click",
        () => details.remove()
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                details.remove();

            }

        }
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
// LOADING
// =========================================

function showLoading() {

    deliveriesContainer.innerHTML = `

        <div class="loading-state">

            Loading deliveries...

        </div>

    `;

}


// =========================================
// ERROR
// =========================================

function showError(message) {

    deliveriesContainer.innerHTML = `

        <div class="delivery-error">

            ${escapeHtml(message)}

        </div>

    `;

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


// =========================================
// PROFILE
// =========================================

const storedEmail =
    localStorage.getItem("email");


if (
    userEmail &&
    storedEmail
) {

    userEmail.textContent =
        storedEmail;

}


if (userRole) {

    userRole.textContent =
        "MANAGER";

}


// =========================================
// LOGOUT
// =========================================

function logoutUser(event) {

    if (event) {
        event.preventDefault();
    }

    // Clear login data
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("epmsCart");

    // Go back to login page
    window.location.replace("../index.html");
}


// Attach logout event
if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logoutUser
    );

}


// =========================================
// INITIAL LOAD
// =========================================

loadDeliveries();