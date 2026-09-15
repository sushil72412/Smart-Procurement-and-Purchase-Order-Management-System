const API_BASE_URL = "http://localhost:8080";

let allPurchaseRequests = [];


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    initializePurchaseRequestsPage();
});


async function initializePurchaseRequestsPage() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    try {

        const user = getUserFromToken();

        if (!user) {
            throw new Error(
                "Unable to read authentication token."
            );
        }

        if (user.role && user.role !== "ADMIN") {

            alert(
                "Access denied. Admin account required."
            );

            window.location.href =
                "../index.html";

            return;
        }

        updateAdminInfo(user);

        await loadPurchaseRequests();

    } catch (error) {

        console.error(
            "Admin Purchase Requests initialization failed:",
            error
        );

        showError();
    }

    setupLogout();
    setupPurchaseRequestManagement();
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


    const nameElement =
        document.getElementById(
            "adminName"
        );

    const emailElement =
        document.getElementById(
            "adminEmail"
        );


    if (nameElement) {
        nameElement.textContent = name;
    }

    if (emailElement) {
        emailElement.textContent = email;
    }


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
// LOAD PURCHASE REQUESTS
// =========================================================

async function loadPurchaseRequests() {

    const tableBody =
        document.getElementById(
            "requestTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="loading-cell">
                    Loading...
                </td>
            </tr>
        `;
    }


    try {

        const requests =
            await fetchPurchaseRequests();

        renderPurchaseRequests(
            requests
        );

    } catch (error) {

        console.error(
            "Failed to load purchase requests:",
            error
        );

        showError();
    }
}


// =========================================================
// API
// =========================================================

async function fetchPurchaseRequests() {

    const response =
        await fetch(
            `${API_BASE_URL}/api/purchase-requests`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


    console.log(
        "Purchase requests response:",
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
            "You do not have permission to view purchase requests."
        );
    }


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Purchase request error:",
            errorText
        );

        throw new Error(
            "Failed to load purchase requests."
        );
    }


    return await response.json();
}


// =========================================================
// RENDER
// =========================================================

function renderPurchaseRequests(
    requests
) {

    allPurchaseRequests =
        Array.isArray(requests)
            ? requests
            : [];


    displayPurchaseRequests(
        allPurchaseRequests
    );
}


// =========================================================
// DISPLAY
// =========================================================

function displayPurchaseRequests(
    requests
) {

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
            getFirstProductName(
                request
            );


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

                <span
                    class="request-status ${getRequestStatusClass(status)}">

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


// =========================================================
// SEARCH + FILTER + REFRESH
// =========================================================

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

                refreshButton.disabled =
                    true;

                refreshButton.textContent =
                    "↻ Loading...";


                try {

                    await loadPurchaseRequests();

                } catch (error) {

                    console.error(
                        "Request refresh failed:",
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
// FILTER
// =========================================================

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
                        request.id ||
                        ""
                    );


                const status =
                    request.status ||
                    "";


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


// =========================================================
// VIEW PURCHASE REQUEST
// =========================================================

async function viewPurchaseRequest(
    requestId
) {

    console.log(
        "Viewing purchase request:",
        requestId
    );


    try {

        const response =
            await fetch(
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
                    .map(
                        item =>
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


// =========================================================
// PRODUCT NAME
// =========================================================

function getFirstProductName(
    request
) {

    if (
        request &&
        Array.isArray(request.items) &&
        request.items.length > 0
    ) {

        return (
            request.items[0].productName ||
            request.items[0].name ||
            "Product"
        );
    }


    return (
        request.productName ||
        request.product?.name ||
        request.product?.productName ||
        "N/A"
    );
}


// =========================================================
// STATUS
// =========================================================

function getRequestStatusClass(
    status
) {

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


function formatStatus(
    status
) {

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


// =========================================================
// DATE
// =========================================================

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "N/A";
    }


    try {

        const date =
            new Date(dateValue);


        if (isNaN(date.getTime())) {
            return "N/A";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch (error) {

        return "N/A";
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
// HTML ESCAPE
// =========================================================

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


// =========================================================
// ERROR
// =========================================================

function showError() {

    const tableBody =
        document.getElementById(
            "requestTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    Unable to load purchase requests.
                </td>
            </tr>
        `;
    }
}