// =========================================
// EPMS - ADMIN REPORTS
// =========================================

const API_BASE_URL = "http://localhost:8080";

let users = [];
let products = [];
let purchaseRequests = [];
let suppliers = [];
let deliveries = [];
let payments = [];


// =========================================
// PAGE LOAD
// =========================================

document.addEventListener("DOMContentLoaded", function () {

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

    loadAdminInfo();
    setupEventListeners();
    loadReports();

});


// =========================================
// ADMIN INFORMATION
// =========================================

function loadAdminInfo() {

    const email =
        localStorage.getItem("email");

    const adminEmail =
        document.getElementById("adminEmail");

    const adminAvatar =
        document.getElementById("adminAvatar");


    if (adminEmail && email) {
        adminEmail.textContent = email;
    }


    if (adminAvatar && email) {
        adminAvatar.textContent =
            email.charAt(0).toUpperCase();
    }

}


// =========================================
// AUTH HEADERS
// =========================================

function getAuthHeaders() {

    return {
        "Content-Type": "application/json",
        "Authorization":
            "Bearer " + localStorage.getItem("token")
    };

}


// =========================================
// EVENT LISTENERS
// =========================================

function setupEventListeners() {

    const refreshButton =
        document.getElementById("refreshReportsBtn");

    const logoutButton =
        document.getElementById("logoutBtn");


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadReports
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

}


// =========================================
// LOAD REPORT DATA
// =========================================

async function loadReports() {

    try {

        setLoadingState();


        const responses =
            await Promise.allSettled([

                fetch(
                    API_BASE_URL + "/api/users",
                    {
                        method: "GET",
                        headers: getAuthHeaders()
                    }
                ),

                fetch(
                    API_BASE_URL + "/api/products",
                    {
                        method: "GET",
                        headers: getAuthHeaders()
                    }
                ),

                fetch(
                    API_BASE_URL + "/api/purchase-requests",
                    {
                        method: "GET",
                        headers: getAuthHeaders()
                    }
                ),

                fetch(
                    API_BASE_URL + "/api/suppliers",
                    {
                        method: "GET",
                        headers: getAuthHeaders()
                    }
                ),

                fetch(
                    API_BASE_URL + "/api/deliveries",
                    {
                        method: "GET",
                        headers: getAuthHeaders()
                    }
                ),

                fetch(
                    API_BASE_URL + "/api/payments",
                    {
                        method: "GET",
                        headers: getAuthHeaders()
                    }
                )

            ]);


        // =========================================
        // HANDLE RESPONSES
        // =========================================

        users =
            await getResponseData(
                responses[0]
            );

        products =
            await getResponseData(
                responses[1]
            );

        purchaseRequests =
            await getResponseData(
                responses[2]
            );

        suppliers =
            await getResponseData(
                responses[3]
            );

        deliveries =
            await getResponseData(
                responses[4]
            );

        payments =
            await getResponseData(
                responses[5]
            );


        console.log(
            "Admin Report Data:",
            {
                users,
                products,
                purchaseRequests,
                suppliers,
                deliveries,
                payments
            }
        );


        calculateReports();

    }


    catch (error) {

        console.error(
            "Report loading error:",
            error
        );

        showReportError(
            error.message ||
            "Unable to load reports."
        );

    }

}


// =========================================
// RESPONSE DATA
// =========================================

async function getResponseData(result) {

    if (!result ||
        result.status !== "fulfilled") {

        return [];

    }


    const response =
        result.value;


    if (response.status === 401) {

        logout();

        return [];

    }


    if (!response.ok) {

        console.error(
            "Report API error:",
            response.status
        );

        return [];

    }


    try {

        const data =
            await response.json();

        return Array.isArray(data)
            ? data
            : [];

    }

    catch (error) {

        console.error(
            "Response parsing error:",
            error
        );

        return [];

    }

}


// =========================================
// CALCULATE REPORTS
// =========================================

function calculateReports() {

    // =========================================
    // MAIN COUNTS
    // =========================================

    setText(
        "totalUsers",
        users.length
    );


    setText(
        "totalProducts",
        products.length
    );


    setText(
        "totalRequests",
        purchaseRequests.length
    );


    setText(
        "totalSuppliers",
        suppliers.length
    );


    // =========================================
    // PURCHASE REQUEST STATUS
    // =========================================

    let pendingRequests = 0;
    let approvedRequests = 0;
    let rejectedRequests = 0;


    purchaseRequests.forEach(
        request => {

            const status =
                normalizeStatus(
                    request.status
                );


            if (
                status === "PENDING"
            ) {

                pendingRequests++;

            }

            else if (
                status === "APPROVED"
            ) {

                approvedRequests++;

            }

            else if (
                status === "REJECTED"
            ) {

                rejectedRequests++;

            }

        }
    );


    setText(
        "pendingRequests",
        pendingRequests
    );


    setText(
        "reportPending",
        pendingRequests
    );


    setText(
        "reportApproved",
        approvedRequests
    );


    setText(
        "reportRejected",
        rejectedRequests
    );


    // =========================================
    // DELIVERY STATUS
    // =========================================

    let pendingDeliveries = 0;
    let transitDeliveries = 0;
    let completedDeliveries = 0;


    deliveries.forEach(
        delivery => {

            const status =
                normalizeStatus(
                    delivery.status
                );


            if (
                status === "PENDING" ||
                status === "ORDER_CONFIRMED" ||
                status === "PREPARING"
            ) {

                pendingDeliveries++;

            }

            else if (
                status === "SHIPPED" ||
                status === "OUT_FOR_DELIVERY" ||
                status === "IN_TRANSIT"
            ) {

                transitDeliveries++;

            }

            else if (
                status === "DELIVERED"
            ) {

                completedDeliveries++;

            }

        }
    );


    setText(
        "activeDeliveries",
        pendingDeliveries +
        transitDeliveries
    );


    setText(
        "completedDeliveries",
        completedDeliveries
    );


    setText(
        "reportDeliveryPending",
        pendingDeliveries
    );


    setText(
        "reportDeliveryTransit",
        transitDeliveries
    );


    setText(
        "reportDeliveryCompleted",
        completedDeliveries
    );


    // =========================================
    // PAYMENTS
    // =========================================

    setText(
        "totalPayments",
        payments.length
    );

}


// =========================================
// SET TEXT
// =========================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }

}


// =========================================
// NORMALIZE STATUS
// =========================================

function normalizeStatus(status) {

    if (!status) {
        return "";
    }


    return String(status)
        .trim()
        .toUpperCase();

}


// =========================================
// LOADING STATE
// =========================================

function setLoadingState() {

    const ids = [

        "totalUsers",
        "totalProducts",
        "totalRequests",
        "totalSuppliers",
        "pendingRequests",
        "activeDeliveries",
        "completedDeliveries",
        "totalPayments",
        "reportPending",
        "reportApproved",
        "reportRejected",
        "reportDeliveryPending",
        "reportDeliveryTransit",
        "reportDeliveryCompleted"

    ];


    ids.forEach(id => {

        setText(id, "...");

    });

}


// =========================================
// ERROR STATE
// =========================================

function showReportError(message) {

    console.error(
        "Reports:",
        message
    );

}


// =========================================
// LOGOUT
// =========================================

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("name");


    window.location.href =
        "../index.html";

}