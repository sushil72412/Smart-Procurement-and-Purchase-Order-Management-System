// ======================================================
// EPMS - Manager Dashboard
// ======================================================

const API_BASE_URL = "http://localhost:8080";


// ======================================================
// DOM ELEMENTS
// ======================================================

const managerNameElement = document.getElementById("managerName");
const managerEmailElement = document.getElementById("managerEmail");
const welcomeManagerNameElement = document.getElementById("welcomeManagerName");

const totalRequestsElement = document.getElementById("totalRequests");
const pendingRequestsElement = document.getElementById("pendingRequests");
const approvedRequestsElement = document.getElementById("approvedRequests");
const rejectedRequestsElement = document.getElementById("rejectedRequests");

const pulsePendingElement = document.getElementById("pulsePending");
const pulseApprovedElement = document.getElementById("pulseApproved");
const pulseRejectedElement = document.getElementById("pulseRejected");

const requestTableBody = document.getElementById("requestTableBody");
const requestsLoading = document.getElementById("requestsLoading");
const emptyRequests = document.getElementById("emptyRequests");

const refreshRequestsBtn = document.getElementById("refreshRequestsBtn");
const logoutBtn = document.getElementById("logoutBtn");

const requestStatusText = document.getElementById("requestStatusText");
const approvalQueueStatus = document.getElementById("approvalQueueStatus");

// ======================================================
// PURCHASE REQUEST SEARCH & FILTER
// ======================================================

const requestSearch =
    document.getElementById("requestSearch");

const requestStatusFilter =
    document.getElementById("requestStatusFilter");

let allPurchaseRequests = [];

// ======================================================
// PURCHASE REQUEST DETAILS MODAL
// ======================================================

const requestDetailsModal =
    document.getElementById("requestDetailsModal");

const closeRequestModal =
    document.getElementById("closeRequestModal");

const detailsRequestTitle =
    document.getElementById("detailsRequestTitle");

const detailsRequestDate =
    document.getElementById("detailsRequestDate");

const detailsEmployeeName =
    document.getElementById("detailsEmployeeName");

const detailsStatus =
    document.getElementById("detailsStatus");

const detailsProducts =
    document.getElementById("detailsProducts");

const detailsRecipientName =
    document.getElementById("detailsRecipientName");

const detailsPhone =
    document.getElementById("detailsPhone");

const detailsAddressLine1 =
    document.getElementById("detailsAddressLine1");

const detailsAddressLine2 =
    document.getElementById("detailsAddressLine2");

const detailsCityState =
    document.getElementById("detailsCityState");

const detailsCountry =
    document.getElementById("detailsCountry");

const detailsActionArea =
    document.getElementById("detailsActionArea");

const detailsApproveBtn =
    document.getElementById("detailsApproveBtn");

const detailsRejectBtn =
    document.getElementById("detailsRejectBtn");

// ======================================================
// AUTHENTICATION
// ======================================================

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


// ======================================================
// LOAD MANAGER INFORMATION
// ======================================================

function loadManagerInfo() {

    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    const storedName = localStorage.getItem("name");

    // Load manager email
    if (managerEmailElement && email) {
        managerEmailElement.textContent = email;
    }

    // Load manager name
    const managerName = storedName || "Manager";

    if (managerNameElement) {
        managerNameElement.textContent = managerName;
    }

    if (welcomeManagerNameElement) {
        welcomeManagerNameElement.textContent = managerName;
    }

    if (role) {
        console.log("Logged-in role:", role);
    }
}


// ======================================================
// LOAD PURCHASE REQUESTS
// ======================================================

async function loadPurchaseRequests() {

    console.log("Loading manager purchase requests...");

    showLoadingState();

    try {

        const response = await fetch(
            API_BASE_URL + "/api/purchase-requests",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        console.log(
            "Purchase Request API status:",
            response.status
        );


        // ------------------------------------------------
        // UNAUTHORIZED
        // ------------------------------------------------

        if (response.status === 401) {

            console.error("401 Unauthorized");

            alert("Your session has expired. Please login again.");

            localStorage.removeItem("token");

            window.location.href = "index.html";

            return;
        }


        // ------------------------------------------------
        // FORBIDDEN
        // ------------------------------------------------

        if (response.status === 403) {

            console.error("403 Forbidden");

            showErrorState(
                "You do not have permission to view purchase requests."
            );

            return;
        }


        // ------------------------------------------------
        // OTHER API ERRORS
        // ------------------------------------------------

        if (!response.ok) {

            throw new Error(
                "Purchase Request API failed with status " +
                response.status
            );
        }


        // ------------------------------------------------
        // READ RESPONSE
        // ------------------------------------------------

        const requests = await response.json();

        console.log(
            "Manager purchase requests:",
            requests
        );

        // Store the complete API result
        allPurchaseRequests = Array.isArray(requests)
            ? requests
            : [];


        // ------------------------------------------------
        // UPDATE DASHBOARD
        // ------------------------------------------------

        updateSummaryCards(requests);

        renderPurchaseRequests(requests);

    } catch (error) {

        console.error(
            "Error loading purchase requests:",
            error
        );

        showErrorState(
            "Unable to load purchase requests."
        );

    }
}


// ======================================================
// UPDATE SUMMARY CARDS
// ======================================================

function updateSummaryCards(requests) {

    const total = requests.length;

    const pending = requests.filter(
        request =>
            request.status &&
            request.status.toUpperCase() === "PENDING"
    ).length;

    const approved = requests.filter(
        request =>
            request.status &&
            request.status.toUpperCase() === "APPROVED"
    ).length;

    const rejected = requests.filter(
        request =>
            request.status &&
            request.status.toUpperCase() === "REJECTED"
    ).length;


    // Main summary cards
    if (totalRequestsElement) {
        totalRequestsElement.textContent = total;
    }

    if (pendingRequestsElement) {
        pendingRequestsElement.textContent = pending;
    }

    if (approvedRequestsElement) {
        approvedRequestsElement.textContent = approved;
    }

    if (rejectedRequestsElement) {
        rejectedRequestsElement.textContent = rejected;
    }


    // Approval pulse
    if (pulsePendingElement) {
        pulsePendingElement.textContent = pending;
    }

    if (pulseApprovedElement) {
        pulseApprovedElement.textContent = approved;
    }

    if (pulseRejectedElement) {
        pulseRejectedElement.textContent = rejected;
    }


    // Procurement status
    if (requestStatusText) {
        requestStatusText.textContent =
            total > 0 ? "Active" : "No Requests";
    }

    if (approvalQueueStatus) {
        approvalQueueStatus.textContent =
            pending > 0 ? pending + " Pending" : "Clear";
    }
}

// ======================================================
// RENDER PURCHASE REQUEST TABLE
// ======================================================

function renderPurchaseRequests(requests) {

    hideLoadingState();

    requestTableBody.innerHTML = "";

    // ------------------------------------------------
    // EMPTY STATE
    // ------------------------------------------------

    if (!requests || requests.length === 0) {

        emptyRequests.style.display = "block";

        return;
    }

    emptyRequests.style.display = "none";


    // ------------------------------------------------
    // SORT BY DATE - LATEST FIRST
    // ------------------------------------------------

    const sortedRequests = [...requests].sort(
        (a, b) =>
            new Date(b.requestDate || 0) -
            new Date(a.requestDate || 0)
    );


    // ------------------------------------------------
    // RENDER TABLE ROWS
    // ------------------------------------------------

    sortedRequests.forEach(request => {

        const row = document.createElement("tr");


        // =================================================
        // REQUEST ID
        // =================================================

        const idCell = document.createElement("td");

        idCell.textContent =
            request.id ? "#" + request.id : "-";


        // =================================================
        // EMPLOYEE
        // =================================================

        const employeeCell = document.createElement("td");

        employeeCell.textContent =
            request.employeeName || "-";


        // =================================================
        // PRODUCT
        // =================================================

        const productCell = document.createElement("td");

        let productName = "-";

        if (
            request.items &&
            request.items.length > 0
        ) {

            productName =
                request.items[0].productName || "-";

        }

        productCell.textContent = productName;


        // =================================================
        // DATE
        // =================================================

        const dateCell = document.createElement("td");

        dateCell.textContent =
            formatRequestDate(request.requestDate);


        // =================================================
        // STATUS
        // =================================================

        const statusCell = document.createElement("td");

        const statusBadge =
            document.createElement("span");

        const status =
            request.status
                ? request.status.toUpperCase()
                : "UNKNOWN";

        statusBadge.textContent = status;

        statusBadge.classList.add(
            "status-badge",
            status.toLowerCase()
        );

        statusCell.appendChild(statusBadge);


        // =================================================
        // ACTIONS
        // =================================================

        const actionCell = document.createElement("td");

        const actionContainer =
            document.createElement("div");

        actionContainer.className =
            "action-buttons";


        // ------------------------------------------------
        // VIEW BUTTON
        // ------------------------------------------------

        const viewButton =
            document.createElement("button");

        viewButton.textContent = "View";

        viewButton.className = "view-btn";

        viewButton.addEventListener(
            "click",
            () => {

                viewPurchaseRequest(request.id);

            }
        );

        actionContainer.appendChild(viewButton);


        // ------------------------------------------------
        // APPROVE + REJECT
        // ONLY FOR PENDING REQUESTS
        // ------------------------------------------------

        if (status === "PENDING") {

            // APPROVE BUTTON

            const approveButton =
                document.createElement("button");

            approveButton.textContent =
                "Approve";

            approveButton.className =
                "approve-btn";

            approveButton.addEventListener(
                "click",
                () => {

                    approvePurchaseRequest(
                        request.id
                    );

                }
            );


            // REJECT BUTTON

            const rejectButton =
                document.createElement("button");

            rejectButton.textContent =
                "Reject";

            rejectButton.className =
                "reject-btn";

            rejectButton.addEventListener(
                "click",
                () => {

                    rejectPurchaseRequest(
                        request.id
                    );

                }
            );


            actionContainer.appendChild(
                approveButton
            );

            actionContainer.appendChild(
                rejectButton
            );
        }


        // ------------------------------------------------
        // ADD ACTIONS TO CELL
        // ------------------------------------------------

        actionCell.appendChild(
            actionContainer
        );


        // ------------------------------------------------
        // ADD CELLS TO ROW
        // ------------------------------------------------

        row.appendChild(idCell);
        row.appendChild(employeeCell);
        row.appendChild(productCell);
        row.appendChild(dateCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);


        // ------------------------------------------------
        // ADD ROW TO TABLE
        // ------------------------------------------------

        requestTableBody.appendChild(row);

    });
}

// ======================================================
// FILTER PURCHASE REQUESTS
// ======================================================

function filterPurchaseRequests() {

    const searchTerm =
        requestSearch
            ? requestSearch.value
                .trim()
                .toLowerCase()
            : "";

    const selectedStatus =
        requestStatusFilter
            ? requestStatusFilter.value
            : "ALL";


    const filteredRequests =
        allPurchaseRequests.filter(request => {

            // --------------------------------------------
            // STATUS FILTER
            // --------------------------------------------

            const requestStatus =
                request.status
                    ? request.status.toUpperCase()
                    : "UNKNOWN";


            if (
                selectedStatus !== "ALL" &&
                requestStatus !== selectedStatus
            ) {

                return false;

            }


            // --------------------------------------------
            // SEARCH FILTER
            // --------------------------------------------

            if (!searchTerm) {
                return true;
            }


            const requestId =
                request.id
                    ? String(request.id)
                    : "";


            const employeeName =
                request.employeeName
                    ? request.employeeName.toLowerCase()
                    : "";


            let productNames = "";

            if (
                request.items &&
                request.items.length > 0
            ) {

                productNames =
                    request.items
                        .map(item =>
                            item.productName || ""
                        )
                        .join(" ")
                        .toLowerCase();

            }


            return (
                requestId.includes(searchTerm) ||
                employeeName.includes(searchTerm) ||
                productNames.includes(searchTerm)
            );

        });


    console.log(
        "Filtered purchase requests:",
        filteredRequests
    );


    renderPurchaseRequests(filteredRequests);
}


// ======================================================
// VIEW PURCHASE REQUEST DETAILS
// ======================================================

async function viewPurchaseRequest(requestId) {

    console.log(
        "Loading purchase request details:",
        requestId
    );

    if (!requestDetailsModal) {
        console.error("Request details modal not found.");
        return;
    }

    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/purchase-requests/" +
            requestId,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        // ------------------------------------------------
        // SESSION EXPIRED
        // ------------------------------------------------

        if (response.status === 401) {

            alert(
                "Your session has expired. Please login again."
            );

            localStorage.removeItem("token");

            window.location.href = "index.html";

            return;
        }


        // ------------------------------------------------
        // FORBIDDEN
        // ------------------------------------------------

        if (response.status === 403) {

            alert(
                "You do not have permission to view this request."
            );

            return;
        }


        // ------------------------------------------------
        // OTHER ERRORS
        // ------------------------------------------------

        if (!response.ok) {

            throw new Error(
                "Unable to load purchase request details."
            );
        }


        // ------------------------------------------------
        // READ REQUEST
        // ------------------------------------------------

        const request = await response.json();

        console.log(
            "Purchase request details:",
            request
        );


        // ------------------------------------------------
        // BASIC INFORMATION
        // ------------------------------------------------

        detailsRequestTitle.textContent =
            "Purchase Request #" + request.id;

        detailsRequestDate.textContent =
            formatRequestDate(request.requestDate);

        detailsEmployeeName.textContent =
            request.employeeName || "-";


        // ------------------------------------------------
        // STATUS
        // ------------------------------------------------

        const status = request.status
            ? request.status.toUpperCase()
            : "UNKNOWN";

        detailsStatus.textContent = status;

        detailsStatus.className =
            "status-badge status-" +
            status.toLowerCase();


        // ------------------------------------------------
        // PRODUCTS
        // ------------------------------------------------

        renderRequestProducts(request.items);


        // ------------------------------------------------
        // DELIVERY ADDRESS
        // ------------------------------------------------

        renderDeliveryAddress(
            request.deliveryAddress
        );


        // ------------------------------------------------
        // ACTION BUTTONS
        // ------------------------------------------------

        if (status === "PENDING") {

            detailsActionArea.style.display = "flex";

            detailsApproveBtn.style.display =
                "inline-flex";

            detailsRejectBtn.style.display =
                "inline-flex";

            detailsApproveBtn.onclick = () => {

                closeRequestDetailsModal();

                approvePurchaseRequest(request.id);

            };


            detailsRejectBtn.onclick = () => {

                closeRequestDetailsModal();

                rejectPurchaseRequest(request.id);

            };

        } else {

            detailsActionArea.style.display = "none";

        }


        // ------------------------------------------------
        // OPEN MODAL
        // ------------------------------------------------

        requestDetailsModal.style.display = "flex";

        document.body.style.overflow = "hidden";


    } catch (error) {

        console.error(
            "Error loading purchase request details:",
            error
        );

        alert(
            error.message ||
            "Unable to load purchase request details."
        );
    }
}

// ======================================================
// RENDER REQUEST PRODUCTS
// ======================================================

function renderRequestProducts(items) {

    if (!detailsProducts) {
        return;
    }

    detailsProducts.innerHTML = "";


    if (!items || items.length === 0) {

        detailsProducts.innerHTML = `
            <div class="details-product-row">

                <div class="details-product-info">

                    <div class="details-product-icon">
                        📦
                    </div>

                    <div>
                        <div class="details-product-name">
                            No products found
                        </div>
                    </div>

                </div>

            </div>
        `;

        return;
    }


    items.forEach(item => {

        const row =
            document.createElement("div");

        row.className =
            "details-product-row";


        const productInfo =
            document.createElement("div");

        productInfo.className =
            "details-product-info";


        const icon =
            document.createElement("div");

        icon.className =
            "details-product-icon";

        icon.textContent = "📦";


        const information =
            document.createElement("div");


        const name =
            document.createElement("div");

        name.className =
            "details-product-name";

        name.textContent =
            item.productName || "Unknown Product";


        const productId =
            document.createElement("div");

        productId.className =
            "details-product-id";

        productId.textContent =
            "Product ID: " +
            (item.productId || "-");


        information.appendChild(name);

        information.appendChild(productId);


        productInfo.appendChild(icon);

        productInfo.appendChild(information);


        const quantity =
            document.createElement("span");

        quantity.className =
            "details-product-quantity";

        quantity.textContent =
            "Qty × " +
            (item.quantity || 0);


        row.appendChild(productInfo);

        row.appendChild(quantity);


        detailsProducts.appendChild(row);

    });
}

// ======================================================
// RENDER DELIVERY ADDRESS
// ======================================================

function renderDeliveryAddress(address) {

    if (!address) {

        detailsRecipientName.textContent = "-";
        detailsPhone.textContent = "-";
        detailsAddressLine1.textContent = "-";
        detailsAddressLine2.textContent = "";
        detailsCityState.textContent = "-";
        detailsCountry.textContent = "-";

        return;
    }


    detailsRecipientName.textContent =
        address.recipientName || "-";


    detailsPhone.textContent =
        address.phone || "-";


    detailsAddressLine1.textContent =
        address.addressLine1 || "-";


    detailsAddressLine2.textContent =
        address.addressLine2 || "";


    const city =
        address.city || "";

    const state =
        address.state || "";

    const postalCode =
        address.postalCode || "";


    const locationParts =
        [
            city,
            state
        ].filter(Boolean);


    let cityStateText =
        locationParts.join(", ");


    if (postalCode) {

        cityStateText +=
            cityStateText
                ? " - " + postalCode
                : postalCode;

    }


    detailsCityState.textContent =
        cityStateText || "-";


    detailsCountry.textContent =
        address.country || "-";
}

// ======================================================
// APPROVE PURCHASE REQUEST
// ======================================================

async function approvePurchaseRequest(requestId) {

    const confirmed =
        confirm(
            "Are you sure you want to approve Purchase Request #" +
            requestId +
            "?"
        );

    if (!confirmed) {
        return;
    }


    console.log(
        "Approving purchase request:",
        requestId
    );


    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/purchase-requests/" +
            requestId,
            {
                method: "PATCH",

                headers: getAuthHeaders(),

                body: JSON.stringify({
                    action: "APPROVE"
                })
            }
        );


        console.log(
            "Approve API status:",
            response.status
        );


        // ------------------------------------------------
        // UNAUTHORIZED
        // ------------------------------------------------

        if (response.status === 401) {

            alert(
                "Your session has expired. Please login again."
            );

            localStorage.removeItem("token");

            window.location.href = "index.html";

            return;
        }


        // ------------------------------------------------
        // FORBIDDEN
        // ------------------------------------------------

        if (response.status === 403) {

            alert(
                "You do not have permission to approve requests."
            );

            return;
        }


        // ------------------------------------------------
        // OTHER ERRORS
        // ------------------------------------------------

        if (!response.ok) {

            const errorData =
                await response.json().catch(
                    () => null
                );

            throw new Error(
                errorData?.message ||
                "Failed to approve purchase request."
            );
        }


        // ------------------------------------------------
        // SUCCESS
        // ------------------------------------------------

        const updatedRequest =
            await response.json();

        console.log(
            "Purchase request approved:",
            updatedRequest
        );


        alert(
            "Purchase Request #" +
            requestId +
            " approved successfully."
        );


        // Reload dashboard data

        await loadPurchaseRequests();


    } catch (error) {

        console.error(
            "Error approving purchase request:",
            error
        );

        alert(
            error.message ||
            "Unable to approve purchase request."
        );
    }
}

// ======================================================
// REJECT PURCHASE REQUEST
// ======================================================

async function rejectPurchaseRequest(requestId) {

    const confirmed =
        confirm(
            "Are you sure you want to reject Purchase Request #" +
            requestId +
            "?"
        );

    if (!confirmed) {
        return;
    }


    console.log(
        "Rejecting purchase request:",
        requestId
    );


    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/purchase-requests/" +
            requestId,
            {
                method: "PATCH",

                headers: getAuthHeaders(),

                body: JSON.stringify({
                    action: "REJECT"
                })
            }
        );


        console.log(
            "Reject API status:",
            response.status
        );


        // ------------------------------------------------
        // UNAUTHORIZED
        // ------------------------------------------------

        if (response.status === 401) {

            alert(
                "Your session has expired. Please login again."
            );

            localStorage.removeItem("token");

            window.location.href = "index.html";

            return;
        }


        // ------------------------------------------------
        // FORBIDDEN
        // ------------------------------------------------

        if (response.status === 403) {

            alert(
                "You do not have permission to reject requests."
            );

            return;
        }


        // ------------------------------------------------
        // OTHER ERRORS
        // ------------------------------------------------

        if (!response.ok) {

            const errorData =
                await response.json().catch(
                    () => null
                );

            throw new Error(
                errorData?.message ||
                "Failed to reject purchase request."
            );
        }


        // ------------------------------------------------
        // SUCCESS
        // ------------------------------------------------

        const updatedRequest =
            await response.json();

        console.log(
            "Purchase request rejected:",
            updatedRequest
        );


        alert(
            "Purchase Request #" +
            requestId +
            " rejected successfully."
        );


        // Reload dashboard data

        await loadPurchaseRequests();


    } catch (error) {

        console.error(
            "Error rejecting purchase request:",
            error
        );

        alert(
            error.message ||
            "Unable to reject purchase request."
        );
    }
}

// ======================================================
// DATE FORMATTER
// ======================================================

function formatRequestDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return dateValue;
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


// ======================================================
// LOADING STATE
// ======================================================

function showLoadingState() {

    requestsLoading.style.display = "block";
    emptyRequests.style.display = "none";

    requestTableBody.innerHTML = "";
}


function hideLoadingState() {

    requestsLoading.style.display = "none";
}


// ======================================================
// ERROR STATE
// ======================================================

function showErrorState(message) {

    hideLoadingState();

    requestTableBody.innerHTML = "";

    emptyRequests.style.display = "block";

    emptyRequests.innerHTML = `
        <div class="empty-icon">⚠️</div>

        <h3>Unable to Load Requests</h3>

        <p>${message}</p>
    `;
}


// ======================================================
// REFRESH BUTTON
// ======================================================

if (refreshRequestsBtn) {

    refreshRequestsBtn.addEventListener(
        "click",
        () => {

            loadPurchaseRequests();

        }
    );
}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem("token");
            localStorage.removeItem("email");
            localStorage.removeItem("role");
            localStorage.removeItem("name");

            window.location.href = "../index.html";

        }
    );
}


// ======================================================
// INITIALIZE MANAGER DASHBOARD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Manager Dashboard initialized"
        );

        loadManagerInfo();

        loadPurchaseRequests();

    }
);

// ======================================================
// CLOSE PURCHASE REQUEST DETAILS MODAL
// ======================================================

function closeRequestDetailsModal() {

    if (!requestDetailsModal) {
        return;
    }

    requestDetailsModal.style.display = "none";

    document.body.style.overflow = "";
}


if (closeRequestModal) {

    closeRequestModal.addEventListener(
        "click",
        closeRequestDetailsModal
    );

}


// Close when clicking outside the modal

if (requestDetailsModal) {

    requestDetailsModal.addEventListener(
        "click",
        event => {

            if (
                event.target === requestDetailsModal
            ) {

                closeRequestDetailsModal();

            }

        }
    );

}


// Close with Escape key

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            requestDetailsModal &&
            requestDetailsModal.style.display === "flex"
        ) {

            closeRequestDetailsModal();

        }

    }
);

// ======================================================
// SEARCH PURCHASE REQUESTS
// ======================================================

if (requestSearch) {

    requestSearch.addEventListener(
        "input",
        filterPurchaseRequests
    );

}


// ======================================================
// FILTER PURCHASE REQUESTS BY STATUS
// ======================================================

if (requestStatusFilter) {

    requestStatusFilter.addEventListener(
        "change",
        filterPurchaseRequests
    );

}
