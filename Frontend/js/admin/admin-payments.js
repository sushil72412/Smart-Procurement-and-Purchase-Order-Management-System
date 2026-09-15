// =========================================
// EPMS - ADMIN PAYMENTS
// =========================================

const API_BASE_URL = "http://localhost:8080";

let allPayments = [];


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
    loadPayments();

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

    const searchInput =
        document.getElementById("paymentSearch");

    const statusFilter =
        document.getElementById("paymentStatusFilter");

    const refreshButton =
        document.getElementById("refreshPaymentsBtn");


    const downloadCsvButton =
        document.getElementById("downloadPaymentsCsvBtn");


    if (downloadCsvButton) {

        downloadCsvButton.addEventListener(
            "click",
            downloadPaymentsCsv
        );

    }
    const logoutButton =
        document.getElementById("logoutBtn");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderPayments
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderPayments
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadPayments
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
// LOAD PAYMENTS
// =========================================

async function loadPayments() {

    const tableBody =
        document.getElementById("paymentsTableBody");


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Loading payments...
                </td>
            </tr>
        `;

    }


    try {

        const response =
            await fetch(
                API_BASE_URL + "/api/payments",
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        // =========================================
        // UNAUTHORIZED
        // =========================================

        if (response.status === 401) {

            logout();

            return;
        }


        // =========================================
        // FORBIDDEN
        // =========================================

        if (response.status === 403) {

            throw new Error(
                "You are not authorized to view payments."
            );

        }


        // =========================================
        // OTHER ERRORS
        // =========================================

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Payment API Error:",
                response.status,
                errorText
            );

            throw new Error(
                "Failed to load payments. Status: " +
                response.status
            );

        }


        // =========================================
        // READ RESPONSE
        // =========================================

        const payments =
            await response.json();


        console.log(
            "Admin payments:",
            payments
        );


        allPayments =
            Array.isArray(payments)
                ? payments
                : [];


        // Latest payment first
        allPayments.sort(function (a, b) {

            const dateA =
                new Date(
                    a.paymentDate ||
                    a.createdAt ||
                    0
                );

            const dateB =
                new Date(
                    b.paymentDate ||
                    b.createdAt ||
                    0
                );

            return dateB - dateA;

        });


        renderPayments();

    }


    catch (error) {

        console.error(
            "Payment loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load payments."
        );

    }

}


// =========================================
// RENDER PAYMENTS
// =========================================

function renderPayments() {

    const tableBody =
        document.getElementById("paymentsTableBody");


    if (!tableBody) {
        return;
    }


    const searchInput =
        document.getElementById("paymentSearch");

    const statusFilter =
        document.getElementById("paymentStatusFilter");


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


    let payments =
        [...allPayments];


    // =========================================
    // SEARCH
    // =========================================

    if (searchTerm) {

        payments =
            payments.filter(function (payment) {

                const paymentId =
                    String(
                        payment.id ?? ""
                    ).toLowerCase();


                const requestId =
                    String(
                        payment.purchaseRequestId ?? ""
                    ).toLowerCase();


                const method =
                    String(
                        payment.paymentMethod ?? ""
                    ).toLowerCase();


                const status =
                    String(
                        payment.status ?? ""
                    ).toLowerCase();


                return (
                    paymentId.includes(searchTerm) ||
                    requestId.includes(searchTerm) ||
                    method.includes(searchTerm) ||
                    status.includes(searchTerm)
                );

            });

    }


    // =========================================
    // STATUS FILTER
    // =========================================

    if (selectedStatus !== "ALL") {

        payments =
            payments.filter(function (payment) {

                const status =
                    String(
                        payment.status || ""
                    ).toUpperCase();


                return status === selectedStatus;

            });

    }


    // =========================================
    // EMPTY STATE
    // =========================================

    if (payments.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    No payments found.
                </td>
            </tr>
        `;

        return;
    }


    // =========================================
    // TABLE ROWS
    // =========================================

    tableBody.innerHTML =
        payments
            .map(createPaymentRow)
            .join("");

}


// =========================================
// CREATE PAYMENT ROW
// =========================================

function createPaymentRow(payment) {

    const paymentId =
        payment.id != null
            ? payment.id
            : "-";


    const purchaseRequestId =
        payment.purchaseRequestId != null
            ? payment.purchaseRequestId
            : "-";


    const amount =
        payment.amount != null
            ? payment.amount
            : "-";


    const paymentMethod =
        payment.paymentMethod ||
        "-";


    const status =
        String(
            payment.status ||
            "PENDING"
        ).toUpperCase();


    const paymentDate =
        payment.paymentDate ||
        payment.createdAt ||
        null;


    return `
        <tr>

            <td>
                ${escapeHtml(
                    String(paymentId)
                )}
            </td>

            <td>
                #PR-${escapeHtml(
                    formatRequestId(
                        purchaseRequestId
                    )
                )}
            </td>

            <td>
                ₹${escapeHtml(
                    String(amount)
                )}
            </td>

            <td>
                ${escapeHtml(
                    String(paymentMethod)
                )}
            </td>

            <td>
                <span class="payment-status ${getStatusClass(status)}">
                    ${escapeHtml(
                        formatStatus(status)
                    )}
                </span>
            </td>

            <td>
                ${escapeHtml(
                    formatDate(paymentDate)
                )}
            </td>

        </tr>
    `;
}


// =========================================
// FORMAT PURCHASE REQUEST ID
// =========================================

function formatRequestId(id) {

    if (
        id === "-" ||
        id === null ||
        id === undefined
    ) {
        return "-";
    }


    return String(id)
        .padStart(3, "0");
}


// =========================================
// STATUS CLASS
// =========================================

function getStatusClass(status) {

    const normalizedStatus =
        String(status).toUpperCase();


    switch (normalizedStatus) {

        case "PAID":
        case "COMPLETED":
        case "SUCCESS":
        case "APPROVED":
            return "approved";


        case "FAILED":
        case "CANCELLED":
            return "cancelled";


        case "PENDING":
        default:
            return "pending";
    }

}


// =========================================
// FORMAT STATUS
// =========================================

function formatStatus(status) {

    if (!status) {
        return "-";
    }


    return String(status)
        .replace(/_/g, " ")
        .replace(
            /\w\S*/g,
            function (word) {

                return (
                    word.charAt(0).toUpperCase() +
                    word.substring(1).toLowerCase()
                );

            }
        );

}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
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
        document.getElementById("paymentsTableBody");


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-cell">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;

}

// =========================================
// DOWNLOAD PAYMENTS CSV
// =========================================

function downloadPaymentsCsv() {

    const searchInput =
        document.getElementById("paymentSearch");

    const statusFilter =
        document.getElementById("paymentStatusFilter");


    const searchTerm =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "ALL";


    let payments =
        [...allPayments];


    // =========================================
    // APPLY SEARCH FILTER
    // =========================================

    if (searchTerm) {

        payments =
            payments.filter(function (payment) {

                const paymentId =
                    String(
                        payment.id ?? ""
                    ).toLowerCase();


                const requestId =
                    String(
                        payment.purchaseRequestId ?? ""
                    ).toLowerCase();


                const method =
                    String(
                        payment.paymentMethod ?? ""
                    ).toLowerCase();


                const status =
                    String(
                        payment.status ?? ""
                    ).toLowerCase();


                return (
                    paymentId.includes(searchTerm) ||
                    requestId.includes(searchTerm) ||
                    method.includes(searchTerm) ||
                    status.includes(searchTerm)
                );

            });

    }


    // =========================================
    // APPLY STATUS FILTER
    // =========================================

    if (selectedStatus !== "ALL") {

        payments =
            payments.filter(function (payment) {

                const status =
                    String(
                        payment.status || ""
                    ).toUpperCase();


                return status === selectedStatus;

            });

    }


    // =========================================
    // NO DATA
    // =========================================

    if (payments.length === 0) {

        alert(
            "No payments available to download."
        );

        return;

    }


    // =========================================
    // CSV HEADER
    // =========================================

    const csvRows = [];

    csvRows.push([
        "Payment ID",
        "Purchase Request ID",
        "Amount",
        "Payment Method",
        "Status",
        "Payment Date"
    ]);


    // =========================================
    // CSV DATA
    // =========================================

    payments.forEach(function (payment) {

        const paymentId =
            payment.id ?? "";


        const purchaseRequestId =
            payment.purchaseRequestId ?? "";


        const amount =
            payment.amount ?? "";


        const paymentMethod =
            payment.paymentMethod ?? "";


        const status =
            payment.status ?? "";


        const paymentDate =
            payment.paymentDate ||
            payment.createdAt ||
            "";


        csvRows.push([
            paymentId,
            purchaseRequestId,
            amount,
            paymentMethod,
            status,
            paymentDate
        ]);

    });


    // =========================================
    // CONVERT TO CSV
    // =========================================

    const csvContent =
        csvRows
            .map(function (row) {

                return row
                    .map(csvEscape)
                    .join(",");

            })
            .join("\n");


    // =========================================
    // CREATE DOWNLOAD
    // =========================================

    const blob =
        new Blob(
            [csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    const date =
        new Date()
            .toISOString()
            .slice(0, 10);


    const statusName =
        selectedStatus === "ALL"
            ? "all"
            : selectedStatus.toLowerCase();


    link.download =
        `epms-payments-${statusName}-${date}.csv`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);

}


// =========================================
// CSV ESCAPE
// =========================================

function csvEscape(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const text =
        String(value);


    return '"' +
        text.replace(
            /"/g,
            '""'
        ) +
        '"';

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


// =========================================
// HTML ESCAPE
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