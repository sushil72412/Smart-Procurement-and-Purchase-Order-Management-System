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

    if (email) {
        managerEmailElement.textContent = email;
    }

    if (role) {
        console.log("Logged-in role:", role);
    }

    /*
     * At the moment the login system stores the email and role.
     * If manager name is available later, we can load it
     * from the user API.
     */

    const storedName = localStorage.getItem("name");

    if (storedName) {

        managerNameElement.textContent = storedName;
        welcomeManagerNameElement.textContent = storedName;

    } else {

        managerNameElement.textContent = "Manager";
        welcomeManagerNameElement.textContent = "Manager";

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

    totalRequestsElement.textContent = total;
    pendingRequestsElement.textContent = pending;
    approvedRequestsElement.textContent = approved;
    rejectedRequestsElement.textContent = rejected;


    // Approval pulse

    pulsePendingElement.textContent = pending;
    pulseApprovedElement.textContent = approved;
    pulseRejectedElement.textContent = rejected;


    // Procurement status

    requestStatusText.textContent =
        total > 0 ? "Active" : "No Requests";

    approvalQueueStatus.textContent =
        pending > 0 ? pending + " Pending" : "Clear";
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
// VIEW PURCHASE REQUEST
// ======================================================

function viewPurchaseRequest(requestId) {

    console.log(
        "View purchase request:",
        requestId
    );

    alert(
        "Purchase Request #" +
        requestId +
        "\n\nDetailed request view will be added in the next step."
    );
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

            window.location.href = "index.html";

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