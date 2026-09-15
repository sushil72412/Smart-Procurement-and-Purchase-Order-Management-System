// =====================================================
// EPMS - Manager Payments
// =====================================================

const API_BASE_URL = "http://localhost:8080";


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../../index.html";
        return;
    }

    loadManagerInfo();
    setupLogout();
    loadPayments();

});


// =====================================================
// AUTH HEADERS
// =====================================================

function getAuthHeaders() {

    return {
        "Content-Type": "application/json",
        "Authorization":
            "Bearer " + localStorage.getItem("token")
    };

}


// =====================================================
// LOAD MANAGER INFORMATION
// =====================================================

function loadManagerInfo() {

    const email =
        localStorage.getItem("email");

    const role =
        localStorage.getItem("role");

    const userEmail =
        document.getElementById("userEmail");

    const userRole =
        document.getElementById("userRole");

    const userAvatar =
        document.getElementById("userAvatar");

    const topProfileAvatar =
        document.getElementById("topProfileAvatar");


    if (userEmail && email) {

        userEmail.textContent = email;

    }


    if (userRole) {

        userRole.textContent =
            role || "MANAGER";

    }


    if (userAvatar && email) {

        userAvatar.textContent =
            email.charAt(0).toUpperCase();

    }


    if (topProfileAvatar && email) {

        topProfileAvatar.textContent =
            email.charAt(0).toUpperCase();

    }

}


// =====================================================
// LOAD PAYMENTS
// =====================================================

async function loadPayments() {

    const container =
        document.getElementById("paymentContainer");


    if (!container) {
        return;
    }


    container.innerHTML = `
        <p>Loading payments...</p>
    `;


    try {

        const response =
            await fetch(
                API_BASE_URL + "/api/payments",
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        // -------------------------------------------------
        // UNAUTHORIZED
        // -------------------------------------------------

        if (response.status === 401) {

            logout();

            return;

        }


        // -------------------------------------------------
        // FORBIDDEN
        // -------------------------------------------------

        if (response.status === 403) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        !
                    </div>

                    <h3>
                        Access Denied
                    </h3>

                    <p>
                        You do not have permission
                        to view payments.
                    </p>

                </div>
            `;

            return;

        }


        // -------------------------------------------------
        // OTHER ERRORS
        // -------------------------------------------------

        if (!response.ok) {

            throw new Error(
                "Failed to load payments. Status: "
                + response.status
            );

        }


        // -------------------------------------------------
        // READ RESPONSE
        // -------------------------------------------------

        const payments =
            await response.json();


        console.log(
            "Manager payments:",
            payments
        );


        renderPayments(payments);


    } catch (error) {

        console.error(
            "Payment loading error:",
            error
        );


        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ₹
                </div>

                <h3>
                    Unable to load payments
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>
        `;

    }

}


// =====================================================
// RENDER PAYMENTS
// =====================================================

function renderPayments(payments) {

    const container =
        document.getElementById("paymentContainer");


    container.innerHTML = "";


    // -------------------------------------------------
    // EMPTY STATE
    // -------------------------------------------------

    if (!Array.isArray(payments) ||
        payments.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ₹
                </div>

                <h3>
                    No Payments Found
                </h3>

                <p>
                    No payment transactions are
                    available at the moment.
                </p>

            </div>
        `;

        return;

    }


    // -------------------------------------------------
    // SORT - LATEST PAYMENT FIRST
    // -------------------------------------------------

    payments.sort(function (a, b) {

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


    // -------------------------------------------------
    // CREATE PAYMENT CARDS
    // -------------------------------------------------

    payments.forEach(function (payment) {

        const card =
            document.createElement("div");

        card.className = "card";


        const status =
            String(
                payment.status || "PENDING"
            ).toUpperCase();


        const statusClass =
            status === "PAID"
                ? "approved"
                : "pending";


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


        const method =
            payment.paymentMethod ||
            "-";


        const paymentDate =
            payment.paymentDate ||
            payment.createdAt ||
            null;


        card.innerHTML = `

            <div class="row">

                <div>

                    <strong>
                        Payment #${escapeHtml(paymentId)}
                    </strong>


                    <div class="muted">

                        Purchase Request:
                        #PR-${formatRequestId(
                            purchaseRequestId
                        )}

                    </div>


                    <div class="muted">

                        Method:
                        ${escapeHtml(method)}

                    </div>


                    <div class="muted">

                        Date:
                        ${formatDate(paymentDate)}

                    </div>

                </div>


                <div style="text-align:right">

                    <span class="badge ${statusClass}">

                        ${escapeHtml(
                            formatStatus(status)
                        )}

                    </span>


                    <div class="amount">

                        ₹${escapeHtml(amount)}

                    </div>

                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


// =====================================================
// FORMAT PURCHASE REQUEST ID
// =====================================================

function formatRequestId(id) {

    if (id === "-" ||
        id === null ||
        id === undefined) {

        return "-";

    }


    return String(id)
        .padStart(3, "0");

}


// =====================================================
// FORMAT DATE
// =====================================================

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


// =====================================================
// FORMAT STATUS
// =====================================================

function formatStatus(status) {

    if (!status) {
        return "-";
    }


    return String(status)
        .replace(/_/g, " ")
        .replace(
            /\w\S*/g,
            function (word) {

                return word.charAt(0).toUpperCase()
                    + word.substring(1).toLowerCase();

            }
        );

}


// =====================================================
// HTML ESCAPE
// =====================================================

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


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


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