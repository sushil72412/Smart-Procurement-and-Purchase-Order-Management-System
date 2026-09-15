const API_BASE_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    initializeSupplierPayments();
});


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeSupplierPayments() {

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

        await loadPayments();

    } catch (error) {

        console.error(
            "Supplier Payments initialization failed:",
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
   LOAD PAYMENTS
   ========================================================= */

async function loadPayments() {

    const loading =
        document.getElementById("paymentsLoading");

    const tableBody =
        document.getElementById("paymentTableBody");

    const emptyPayments =
        document.getElementById("emptyPayments");

    if (loading) {
        loading.style.display = "block";
    }

    if (emptyPayments) {
        emptyPayments.style.display = "none";
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/payments`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        console.log(
            "Supplier payments response:",
            response.status
        );

        if (response.status === 401) {

            handleUnauthorized();

            return;
        }

        if (response.status === 403) {

            throw new Error(
                "You do not have permission to access payments."
            );
        }

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Payment API error:",
                errorText
            );

            throw new Error(
                "Unable to load payments."
            );
        }

        const payments =
            await response.json();

        console.log(
            "Supplier payments:",
            payments
        );

        updatePaymentSummary(payments);

        renderPayments(payments);

        if (!payments || payments.length === 0) {

            if (emptyPayments) {
                emptyPayments.style.display = "block";
            }
        }

    } catch (error) {

        console.error(
            "Failed to load payments:",
            error
        );

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center; padding:30px;">
                        Unable to load payments.
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
   RENDER PAYMENTS
   ========================================================= */

function renderPayments(payments) {

    const tableBody =
        document.getElementById("paymentTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!payments || payments.length === 0) {
        return;
    }

    payments.forEach(payment => {

        const row =
            document.createElement("tr");

        const status =
            String(payment.status || "PENDING")
                .toUpperCase();

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
                : 0;

        const method =
            payment.paymentMethod ||
            "-";

        const paymentDate =
            payment.paymentDate ||
            payment.createdAt ||
            null;

        row.innerHTML = `
            <td>
                #${escapeHtml(paymentId)}
            </td>

            <td>
                #PR-${formatRequestId(purchaseRequestId)}
            </td>

            <td>
                ₹${escapeHtml(amount)}
            </td>

            <td>
                ${escapeHtml(method)}
            </td>

            <td>
                <span class="status-badge ${getPaymentStatusClass(status)}">
                    ${escapeHtml(formatStatus(status))}
                </span>
            </td>

            <td>
                ${escapeHtml(formatDate(paymentDate))}
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/* =========================================================
   PAYMENT SUMMARY
   ========================================================= */

function updatePaymentSummary(payments) {

    const totalPayments =
        document.getElementById("totalPayments");

    const pendingPayments =
        document.getElementById("pendingPayments");

    const paidPayments =
        document.getElementById("paidPayments");

    const totalAmount =
        document.getElementById("totalAmount");

    if (!Array.isArray(payments)) {
        return;
    }

    const total =
        payments.length;

    const pending =
        payments.filter(
            payment =>
                String(payment.status || "")
                    .toUpperCase() === "PENDING"
        ).length;

    const paid =
        payments.filter(
            payment =>
                String(payment.status || "")
                    .toUpperCase() === "PAID"
        ).length;

    const amount =
        payments.reduce(
            (sum, payment) => {
                const value =
                    Number(payment.amount);

                return sum +
                    (Number.isFinite(value) ? value : 0);
            },
            0
        );

    if (totalPayments) {
        totalPayments.textContent = total;
    }

    if (pendingPayments) {
        pendingPayments.textContent = pending;
    }

    if (paidPayments) {
        paidPayments.textContent = paid;
    }

    if (totalAmount) {

        totalAmount.textContent =
            "₹" +
            amount.toLocaleString("en-IN");
    }
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefreshButton() {

    const refreshButton =
        document.getElementById("refreshPaymentsBtn");

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener(
        "click",
        () => {
            initializeSupplierPayments();
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
        document.getElementById("paymentTableBody");

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
   STATUS
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


function getPaymentStatusClass(status) {

    if (status === "PAID") {
        return "delivered";
    }

    if (status === "PENDING") {
        return "preparing";
    }

    return "";
}


/* =========================================================
   REQUEST ID
   ========================================================= */

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