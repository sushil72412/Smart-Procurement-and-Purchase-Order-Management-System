const API_BASE_URL = "http://localhost:8080";

let selectedPurchaseRequestId = null;


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener("DOMContentLoaded", function () {

    loadPayments();

    setupLogout();

    loadUserInfo();

});


// ===============================
// AUTH HEADERS
// ===============================

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };

}


// ===============================
// LOAD USER INFORMATION
// ===============================

function loadUserInfo() {

    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    const userEmail = document.getElementById("userEmail");
    const userRole = document.getElementById("userRole");

    if (userEmail && email) {
        userEmail.textContent = email;
    }

    if (userRole && role) {
        userRole.textContent = role;
    }

}


// ===============================
// LOAD PAYMENTS
// ===============================

async function loadPayments() {

    const container =
        document.getElementById("paymentContainer");

    try {

        // Get employee purchase requests
        const requestsResponse = await fetch(
            API_BASE_URL + "/api/purchase-requests",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (requestsResponse.status === 401) {

            logout();

            return;
        }


        if (!requestsResponse.ok) {

            throw new Error(
                "Failed to load purchase requests"
            );

        }


        const requests =
            await requestsResponse.json();



        // Get employee payments
        const paymentsResponse = await fetch(
            API_BASE_URL + "/api/payments",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (paymentsResponse.status === 401) {

            logout();

            return;
        }


        if (!paymentsResponse.ok) {

            throw new Error(
                "Failed to load payments"
            );

        }


        const payments =
            await paymentsResponse.json();


        displayPayments(requests, payments);


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
                    Please try again.
                </p>

            </div>
        `;

    }

}


// ===============================
// DISPLAY PAYMENTS
// ===============================

function displayPayments(requests, payments) {

    const container =
        document.getElementById("paymentContainer");


    container.innerHTML = "";


    if (!requests || requests.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ₹
                </div>

                <h3>
                    No Purchase Requests
                </h3>

                <p>
                    You don't have any purchase requests yet.
                </p>

            </div>

        `;

        return;
    }


    requests.forEach(request => {

        const payment = payments.find(
            p =>
                p.purchaseRequestId === request.id
        );


        const card =
            document.createElement("div");


        card.className = "summary-card";


        let content = `

            <h3>
                Purchase Request #${request.id}
            </h3>

            <p>
                Request Status:
                <strong>
                    ${request.status}
                </strong>
            </p>

        `;


        // ===============================
        // PAYMENT EXISTS
        // ===============================

        if (payment) {

            content += `

                <p>
                    Payment Status:
                    <strong>
                        ${payment.status}
                    </strong>
                </p>

                <p>
                    Amount:
                    <strong>
                        ₹${payment.amount}
                    </strong>
                </p>

                <p>
                    Payment Method:
                    <strong>
                        ${payment.paymentMethod || "N/A"}
                    </strong>
                </p>

            `;

        }


        // ===============================
        // APPROVED BUT NOT PAID
        // ===============================

        else if (
            request.status === "APPROVED"
        ) {

            content += `

                <p>
                    Payment Status:
                    <strong>
                        Not Paid
                    </strong>
                </p>

                <button
                    type="button"
                    class="new-request-btn"
                    onclick="openPaymentModal(${request.id})">

                    ₹ Make Payment

                </button>

            `;

        }


        // ===============================
        // PENDING / REJECTED
        // ===============================

        else {

            content += `

                <p>
                    Payment Status:
                    <strong>
                        Available after approval
                    </strong>
                </p>

            `;

        }


        card.innerHTML = content;

        container.appendChild(card);

    });

}


// ===============================
// OPEN PAYMENT MODAL
// ===============================

function openPaymentModal(
    purchaseRequestId
) {

    selectedPurchaseRequestId =
        purchaseRequestId;


    const info =
        document.getElementById(
            "paymentRequestInfo"
        );


    if (info) {

        info.textContent =
            "Purchase Request #" +
            purchaseRequestId;

    }


    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.style.display = "flex";

    }

}


// ===============================
// CLOSE PAYMENT MODAL
// ===============================

function closePaymentModal() {

    selectedPurchaseRequestId = null;


    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.style.display = "none";

    }

}


// ===============================
// SUBMIT PAYMENT
// ===============================

async function submitPayment() {

    if (!selectedPurchaseRequestId) {

        alert(
            "Purchase request not selected."
        );

        return;
    }


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        ).value;


    const paymentData = {

        purchaseRequestId:
            selectedPurchaseRequestId,

        paymentMethod:
            paymentMethod

    };


    try {

        const response = await fetch(
            API_BASE_URL + "/api/payments",
            {
                method: "POST",

                headers: getAuthHeaders(),

                body:
                    JSON.stringify(paymentData)
            }
        );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Payment creation failed."
            );

            return;
        }


        alert(
            "Payment created successfully!"
        );


        closePaymentModal();


        // Refresh payment list
        loadPayments();


    } catch (error) {

        console.error(
            "Payment error:",
            error
        );


        alert(
            "Something went wrong while creating payment."
        );

    }

}


// ===============================
// LOGOUT
// ===============================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

}


function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("email");

    localStorage.removeItem("role");

    window.location.href =
        "index.html";

}