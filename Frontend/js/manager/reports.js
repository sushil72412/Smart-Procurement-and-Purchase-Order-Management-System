// ======================================================
// EPMS - Manager Reports
// ======================================================

const API_BASE_URL = "http://localhost:8080";


// ======================================================
// DOM ELEMENTS
// ======================================================

const managerNameElement =
    document.getElementById("managerName");

const managerEmailElement =
    document.getElementById("managerEmail");

const topProfileAvatar =
    document.getElementById("topProfileAvatar");

const totalRequestsElement =
    document.getElementById("totalRequests");

const pendingRequestsElement =
    document.getElementById("pendingRequests");

const approvedRequestsElement =
    document.getElementById("approvedRequests");

const rejectedRequestsElement =
    document.getElementById("rejectedRequests");

const pendingPercentElement =
    document.getElementById("pendingPercent");

const approvedPercentElement =
    document.getElementById("approvedPercent");

const rejectedPercentElement =
    document.getElementById("rejectedPercent");

const pendingProgress =
    document.getElementById("pendingProgress");

const approvedProgress =
    document.getElementById("approvedProgress");

const rejectedProgress =
    document.getElementById("rejectedProgress");

const activityTotal =
    document.getElementById("activityTotal");

const activityPending =
    document.getElementById("activityPending");

const activityApproved =
    document.getElementById("activityApproved");

const activityRejected =
    document.getElementById("activityRejected");

const refreshReportsBtn =
    document.getElementById("refreshReportsBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// AUTHENTICATION
// ======================================================

function getAuthHeaders() {

    const token =
        localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


// ======================================================
// LOAD MANAGER INFORMATION
// ======================================================

function loadManagerInfo() {

    const email =
        localStorage.getItem("email");

    const storedName =
        localStorage.getItem("name");

    const managerName =
        storedName || "Manager";


    if (managerNameElement) {

        managerNameElement.textContent =
            managerName;

    }


    if (managerEmailElement && email) {

        managerEmailElement.textContent =
            email;

    }


    if (topProfileAvatar) {

        topProfileAvatar.textContent =
            managerName.charAt(0).toUpperCase();

    }

}


// ======================================================
// LOAD REPORT DATA
// ======================================================

async function loadReports() {

    console.log(
        "Loading manager report data..."
    );


    try {

        const response =
            await fetch(
                API_BASE_URL +
                "/api/purchase-requests",
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "Reports API status:",
            response.status
        );


        // ------------------------------------------------
        // SESSION EXPIRED
        // ------------------------------------------------

        if (response.status === 401) {

            alert(
                "Your session has expired. Please login again."
            );

            localStorage.removeItem("token");

            window.location.href =
                "index.html";

            return;
        }


        // ------------------------------------------------
        // FORBIDDEN
        // ------------------------------------------------

        if (response.status === 403) {

            alert(
                "You do not have permission to view reports."
            );

            return;
        }


        // ------------------------------------------------
        // OTHER ERRORS
        // ------------------------------------------------

        if (!response.ok) {

            throw new Error(
                "Unable to load purchase request data."
            );

        }


        // ------------------------------------------------
        // READ RESPONSE
        // ------------------------------------------------

        const requests =
            await response.json();


        console.log(
            "Report purchase requests:",
            requests
        );


        const requestList =
            Array.isArray(requests)
                ? requests
                : [];


        generateReport(requestList);

    }
    catch (error) {

        console.error(
            "Error loading reports:",
            error
        );

        alert(
            "Unable to load report data."
        );

    }

}


// ======================================================
// GENERATE REPORT
// ======================================================

function generateReport(requests) {

    // ------------------------------------------------
    // TOTAL
    // ------------------------------------------------

    const total =
        requests.length;


    // ------------------------------------------------
    // STATUS COUNTS
    // ------------------------------------------------

    const pending =
        requests.filter(
            request =>
                request.status &&
                request.status.toUpperCase() ===
                "PENDING"
        ).length;


    const approved =
        requests.filter(
            request =>
                request.status &&
                request.status.toUpperCase() ===
                "APPROVED"
        ).length;


    const rejected =
        requests.filter(
            request =>
                request.status &&
                request.status.toUpperCase() ===
                "REJECTED"
        ).length;


    console.log(
        "Report summary:",
        {
            total,
            pending,
            approved,
            rejected
        }
    );
    generateProductReport(requests);
    generateEmployeeReport(requests);


    // ------------------------------------------------
    // UPDATE SUMMARY CARDS
    // ------------------------------------------------

    if (totalRequestsElement) {

        totalRequestsElement.textContent =
            total;

    }


    if (pendingRequestsElement) {

        pendingRequestsElement.textContent =
            pending;

    }


    if (approvedRequestsElement) {

        approvedRequestsElement.textContent =
            approved;

    }


    if (rejectedRequestsElement) {

        rejectedRequestsElement.textContent =
            rejected;

    }


    // ------------------------------------------------
    // UPDATE ACTIVITY
    // ------------------------------------------------

    if (activityTotal) {

        activityTotal.textContent =
            total;

    }


    if (activityPending) {

        activityPending.textContent =
            pending;

    }


    if (activityApproved) {

        activityApproved.textContent =
            approved;

    }


    if (activityRejected) {

        activityRejected.textContent =
            rejected;

    }


    // ------------------------------------------------
    // CALCULATE PERCENTAGES
    // ------------------------------------------------

    let pendingPercentage = 0;
    let approvedPercentage = 0;
    let rejectedPercentage = 0;


    if (total > 0) {

        pendingPercentage =
            Math.round(
                (pending / total) * 100
            );

        approvedPercentage =
            Math.round(
                (approved / total) * 100
            );

        rejectedPercentage =
            Math.round(
                (rejected / total) * 100
            );

    }


    // ------------------------------------------------
    // UPDATE PERCENTAGE TEXT
    // ------------------------------------------------

    if (pendingPercentElement) {

        pendingPercentElement.textContent =
            pendingPercentage + "%";

    }


    if (approvedPercentElement) {

        approvedPercentElement.textContent =
            approvedPercentage + "%";

    }


    if (rejectedPercentElement) {

        rejectedPercentElement.textContent =
            rejectedPercentage + "%";

    }


    // ------------------------------------------------
    // UPDATE PROGRESS BARS
    // ------------------------------------------------

    if (pendingProgress) {

        pendingProgress.style.width =
            pendingPercentage + "%";

    }


    if (approvedProgress) {

        approvedProgress.style.width =
            approvedPercentage + "%";

    }


    if (rejectedProgress) {

        rejectedProgress.style.width =
            rejectedPercentage + "%";

    }

}

// ======================================================
// MOST REQUESTED PRODUCTS
// ======================================================

function generateProductReport(requests) {

    const productReportList =
        document.getElementById("productReportList");


    if (!productReportList) {
        return;
    }


    const productMap = {};


    requests.forEach(request => {

        if (!request.items ||
            !Array.isArray(request.items)) {

            return;
        }


        request.items.forEach(item => {

            const productName =
                item.productName || "Unknown Product";

            const quantity =
                Number(item.quantity) || 0;


            if (!productMap[productName]) {

                productMap[productName] = {
                    name: productName,
                    quantity: 0,
                    requests: 0
                };

            }


            productMap[productName].quantity +=
                quantity;

            productMap[productName].requests +=
                1;

        });

    });


    const products =
        Object.values(productMap)
            .sort(
                (a, b) =>
                    b.quantity - a.quantity
            );


    productReportList.innerHTML = "";


    if (products.length === 0) {

        productReportList.innerHTML = `
            <div class="product-report-empty">
                No product request data available.
            </div>
        `;

        return;
    }


    products
        .slice(0, 5)
        .forEach((product, index) => {

            const item =
                document.createElement("div");

            item.className =
                "product-report-item";


            item.innerHTML = `
                <div class="product-rank">
                    ${index + 1}
                </div>

                <div class="product-report-info">

                    <div class="product-report-name">
                        ${escapeHtml(product.name)}
                    </div>

                    <div class="product-report-meta">
                        Requested in ${product.requests} request${product.requests !== 1 ? "s" : ""}
                    </div>

                </div>

                <div class="product-report-quantity">
                    ${product.quantity}
                </div>
            `;


            productReportList.appendChild(item);

        });

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ======================================================
// EMPLOYEE-WISE PROCUREMENT REPORT
// ======================================================

function generateEmployeeReport(requests) {

    const employeeReportList =
        document.getElementById("employeeReportList");

    if (!employeeReportList) {
        return;
    }

    const employeeMap = {};

    requests.forEach(request => {

        const employee =
            request.employeeName || "Unknown Employee";

        if (!employeeMap[employee]) {

            employeeMap[employee] = {
                name: employee,
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0
            };

        }

        employeeMap[employee].total++;

        const status =
            request.status
                ? request.status.toUpperCase()
                : "";

        if (status === "PENDING") {
            employeeMap[employee].pending++;
        }

        if (status === "APPROVED") {
            employeeMap[employee].approved++;
        }

        if (status === "REJECTED") {
            employeeMap[employee].rejected++;
        }

    });


    const employees =
        Object.values(employeeMap)
            .sort((a, b) => b.total - a.total);


    employeeReportList.innerHTML = "";


    if (employees.length === 0) {

        employeeReportList.innerHTML = `
            <div class="product-report-empty">
                No employee procurement data available.
            </div>
        `;

        return;
    }


    employees.forEach(employee => {

        const item =
            document.createElement("div");

        item.className =
            "employee-report-item";


        const initial =
            employee.name
                .charAt(0)
                .toUpperCase();


        item.innerHTML = `
            <div class="employee-avatar">
                ${escapeHtml(initial)}
            </div>

            <div class="employee-report-info">

                <div class="employee-report-name">
                    ${escapeHtml(employee.name)}
                </div>

                <div class="employee-report-meta">
                    ${employee.total}
                    request${employee.total !== 1 ? "s" : ""}
                </div>

            </div>

            <div class="employee-report-stats">

                <span class="employee-stat pending">
                    P ${employee.pending}
                </span>

                <span class="employee-stat approved">
                    A ${employee.approved}
                </span>

                <span class="employee-stat rejected">
                    R ${employee.rejected}
                </span>

            </div>
        `;


        employeeReportList.appendChild(item);

    });

}

// ======================================================
// REFRESH
// ======================================================

if (refreshReportsBtn) {

    refreshReportsBtn.addEventListener(
        "click",
        loadReports
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    "Are you sure you want to sign out?"
                );


            if (!confirmed) {
                return;
            }


            localStorage.removeItem("token");
            localStorage.removeItem("email");
            localStorage.removeItem("name");
            localStorage.removeItem("role");


            window.location.href =
                "index.html";

        }
    );

}


// ======================================================
// INITIALIZE REPORTS
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadManagerInfo();

        loadReports();

    }
);