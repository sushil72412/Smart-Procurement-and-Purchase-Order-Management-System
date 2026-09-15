const API_BASE_URL = "http://localhost:8080";

const USER_ROLE =
    (localStorage.getItem("role") || "")
        .toUpperCase()
        .trim();

function isManager() {
    return USER_ROLE === "MANAGER";
}

function isEmployee() {
    return USER_ROLE === "EMPLOYEE";
}

let selectedPurchaseRequestId = null;
let selectedPurchaseRequest = null;
let selectedPaymentMethod = "UPI";

function configurePaymentPage() {

    const greeting =
        document.querySelector(".welcome-section .greeting");

    const heading =
        document.querySelector(".welcome-section h1");

    const subtitle =
        document.querySelector(".welcome-section .subtitle");


    if (isManager()) {

        if (greeting) {
            greeting.textContent =
                "PAYMENT MANAGEMENT";
        }

        if (heading) {
            heading.textContent =
                "All Payments";
        }

        if (subtitle) {
            subtitle.textContent =
                "Monitor payment records and transaction status across procurement requests.";
        }

    } else {

        if (greeting) {
            greeting.textContent =
                "EMPLOYEE PAYMENTS";
        }

        if (heading) {
            heading.textContent =
                "Payment Management";
        }

        if (subtitle) {
            subtitle.textContent =
                "View your approved purchase requests and securely complete payments.";
        }

    }

}

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    configurePaymentPage();

    loadPayments();

    setupLogout();

    loadUserInfo();

});


// =====================================================
// AUTH HEADERS
// =====================================================

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };

}


// =====================================================
// LOAD USER INFORMATION
// =====================================================

function loadUserInfo() {

    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    const userEmail =
        document.getElementById("userEmail");

    const userRole =
        document.getElementById("userRole");

    if (userEmail && email) {
        userEmail.textContent = email;
    }

    if (userRole && role) {
        userRole.textContent = role;
    }

}


// =====================================================
// LOAD PAYMENTS
// =====================================================

async function loadPayments() {

    const container =
        document.getElementById("paymentContainer");

    try {

        const requestsResponse =
            await fetch(
                API_BASE_URL +
                "/api/purchase-requests",
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
                "Failed to load purchase requests."
            );

        }


        const requests =
            await requestsResponse.json();


        const paymentsResponse =
            await fetch(
                API_BASE_URL +
                "/api/payments",
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
                "Failed to load payments."
            );

        }


        const payments =
            await paymentsResponse.json();


        displayPayments(
            requests,
            payments
        );


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


// =====================================================
// DISPLAY PAYMENTS
// =====================================================

function displayPayments(
    requests,
    payments
) {

    const container =
        document.getElementById(
            "paymentContainer"
        );


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


    requests.forEach(function (request) {

        const payment =
            payments.find(
                function (p) {

                    return Number(
                        p.purchaseRequestId
                    ) === Number(request.id);

                }
            );


        const card =
            document.createElement("div");


        card.className =
            "summary-card";


        let content = `

            <h3>
                Purchase Request #${request.id}
            </h3>

            <p>
                Request Status:
                <strong>
                    ${escapeHtml(request.status)}
                </strong>
            </p>

        `;


        // =================================================
        // PAYMENT EXISTS
        // =================================================

        if (payment) {

            const amount =
                Number(payment.amount || 0);


            content += `

                <p>
                    Payment Status:
                    <strong>
                        ${escapeHtml(
                            payment.status || "PENDING"
                        )}
                    </strong>
                </p>

                <p>
                    Amount:
                    <strong>
                        ₹${amount.toLocaleString("en-IN")}
                    </strong>
                </p>

                <p>
                    Payment Method:
                    <strong>
                        ${escapeHtml(
                            payment.paymentMethod || "N/A"
                        )}
                    </strong>
                </p>

            `;


            if (payment.transactionId) {

                content += `

                    <p>
                        Transaction ID:
                        <strong>
                            ${escapeHtml(
                                payment.transactionId
                            )}
                        </strong>
                    </p>

                `;

            }

        }


        // =================================================
        // APPROVED BUT NOT PAID
        // =================================================

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

    `;


    // Only employees can initiate payments
    if (isEmployee()) {

        content += `

            <button
                type="button"
                class="new-request-btn"
                onclick="openPaymentModal(${request.id})">

                ₹ Make Payment

            </button>

        `;

    } else if (isManager()) {

        content += `

            <p>
                <strong>
                    Awaiting Payment
                </strong>
            </p>

        `;

    }

}


        // =================================================
        // PENDING / REJECTED
        // =================================================

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


        card.innerHTML =
            content;


        container.appendChild(
            card
        );

    });

}


// =====================================================
// OPEN PAYMENT MODAL
// =====================================================

function openPaymentModal(
    purchaseRequestId
) {

    selectedPurchaseRequestId =
        Number(purchaseRequestId);


    // Find request from currently loaded cards
    loadPurchaseRequestDetails(
        selectedPurchaseRequestId
    );

}


// =====================================================
// LOAD REQUEST DETAILS
// =====================================================

async function loadPurchaseRequestDetails(
    purchaseRequestId
) {

    try {

        const response =
            await fetch(
                API_BASE_URL +
                "/api/purchase-requests/" +
                purchaseRequestId,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load purchase request."
            );

        }


        const request =
            await response.json();


        selectedPurchaseRequest =
            request;


        showPaymentModal(
            request
        );


    } catch (error) {

        console.error(
            "Request details error:",
            error
        );


        /*
         * If the detail endpoint is unavailable,
         * still open the modal using the request ID.
         */

        selectedPurchaseRequest = {
            id: purchaseRequestId
        };


        showPaymentModal(
            selectedPurchaseRequest
        );

    }

}


// =====================================================
// SHOW PAYMENT MODAL
// =====================================================

function showPaymentModal(
    request
) {

    selectedPaymentMethod =
        "UPI";


    // ---------------------------------------------
    // Request information
    // ---------------------------------------------

    const info =
        document.getElementById(
            "paymentRequestInfo"
        );


    if (info) {

        info.textContent =
            "Purchase Request #" +
            request.id;

    }


    const summaryRequestId =
        document.getElementById(
            "summaryRequestId"
        );


    if (summaryRequestId) {

        summaryRequestId.textContent =
            "#" + request.id;

    }


    // ---------------------------------------------
    // Amount
    // ---------------------------------------------

    const amount =
        getRequestAmount(request);


    const summaryAmount =
        document.getElementById(
            "summaryAmount"
        );


    if (summaryAmount) {

        summaryAmount.textContent =
            "₹" +
            amount.toLocaleString("en-IN");

    }


    // ---------------------------------------------
    // Reset fields
    // ---------------------------------------------

    resetPaymentForm();


    // ---------------------------------------------
    // Select UPI
    // ---------------------------------------------

    selectPaymentMethod(
        "UPI"
    );


    // ---------------------------------------------
    // Open modal
    // ---------------------------------------------

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =====================================================
// GET REQUEST AMOUNT
// =====================================================

function getRequestAmount(
    request
) {

    /*
     * Different backend response structures can contain
     * the calculated amount under different fields.
     */

    if (
        request.totalAmount !== undefined &&
        request.totalAmount !== null
    ) {

        return Number(
            request.totalAmount
        );

    }


    if (
        request.amount !== undefined &&
        request.amount !== null
    ) {

        return Number(
            request.amount
        );

    }


    if (
        request.total !== undefined &&
        request.total !== null
    ) {

        return Number(
            request.total
        );

    }


    /*
     * Some responses may contain request items.
     * Calculate from item price × quantity if available.
     */

    if (
        Array.isArray(request.items)
    ) {

        return request.items.reduce(
            function (total, item) {

                const price =
                    Number(
                        item.price ||
                        item.productPrice ||
                        item.product?.price ||
                        0
                    );


                const quantity =
                    Number(
                        item.quantity || 0
                    );


                return total +
                    price * quantity;

            },
            0
        );

    }


    return 0;

}


// =====================================================
// SELECT PAYMENT METHOD
// =====================================================

function selectPaymentMethod(
    method
) {

    selectedPaymentMethod =
        method;


    // ---------------------------------------------
    // Update selected button
    // ---------------------------------------------

    const options =
        document.querySelectorAll(
            ".payment-method-option"
        );


    options.forEach(
        function (option) {

            option.classList.remove(
                "active"
            );

        }
    );


    const selectedOption =
        document.querySelector(
            '.payment-method-option[data-method="' +
            method +
            '"]'
        );


    if (selectedOption) {

        selectedOption.classList.add(
            "active"
        );

    }


    // ---------------------------------------------
    // Hide all panels
    // ---------------------------------------------

    const panels =
        document.querySelectorAll(
            ".payment-detail-panel"
        );


    panels.forEach(
        function (panel) {

            panel.classList.remove(
                "active"
            );

        }
    );


    // ---------------------------------------------
    // Show selected panel
    // ---------------------------------------------

    let panelId = "";


    if (method === "UPI") {

        panelId =
            "upiPaymentPanel";

    } else if (method === "CARD") {

        panelId =
            "cardPaymentPanel";

    } else if (method === "NET_BANKING") {

        panelId =
            "netBankingPaymentPanel";

    } else if (method === "CASH") {

        panelId =
            "cashPaymentPanel";

    }


    const panel =
        document.getElementById(
            panelId
        );


    if (panel) {

        panel.classList.add(
            "active"
        );

    }


    // ---------------------------------------------
    // Generate demo QR
    // ---------------------------------------------

    if (method === "UPI") {

        generateDemoQR();

    }


    clearPaymentMessage();

}


// =====================================================
// DEMO QR CODE
// =====================================================

function generateDemoQR() {

    const qrCode =
        document.getElementById(
            "qrCode"
        );


    if (!qrCode) {
        return;
    }


    const requestId =
        selectedPurchaseRequestId ||
        "0";


    const amount =
        getRequestAmount(
            selectedPurchaseRequest || {}
        );


    /*
     * This is a visual/demo QR representation.
     * It is NOT connected to a real payment gateway.
     */

    qrCode.innerHTML = `

        <div style="
            width: 104px;
            height: 104px;
            display: grid;
            grid-template-columns:
                repeat(9, 1fr);
            grid-template-rows:
                repeat(9, 1fr);
            gap: 2px;
            padding: 7px;
            box-sizing: border-box;
            background: #ffffff;
        ">

            ${generateQRPattern(
                requestId,
                amount
            )}

        </div>

    `;

}


// =====================================================
// GENERATE DEMO QR PATTERN
// =====================================================

function generateQRPattern(
    requestId,
    amount
) {

    const seed =
        String(requestId) +
        String(amount);


    let html = "";


    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            const value =
                (
                    seed.charCodeAt(
                        (row * 9 + col) %
                        seed.length
                    ) +
                    row * 7 +
                    col * 11
                ) % 2;


            let filled =
                value === 0;


            // Finder pattern top-left
            if (
                row <= 2 &&
                col <= 2
            ) {

                filled =
                    row === 0 ||
                    row === 2 ||
                    col === 0 ||
                    col === 2;

            }


            // Finder pattern top-right
            if (
                row <= 2 &&
                col >= 6
            ) {

                filled =
                    row === 0 ||
                    row === 2 ||
                    col === 6 ||
                    col === 8;

            }


            // Finder pattern bottom-left
            if (
                row >= 6 &&
                col <= 2
            ) {

                filled =
                    row === 6 ||
                    row === 8 ||
                    col === 0 ||
                    col === 2;

            }


            html += `

                <span style="
                    display: block;
                    background: ${
                        filled
                            ? "#172033"
                            : "#ffffff"
                    };
                "></span>

            `;

        }

    }


    return html;

}


// =====================================================
// RESET PAYMENT FORM
// =====================================================

function resetPaymentForm() {

    const fields = [

        "upiId",
        "cardNumber",
        "cardName",
        "cardExpiry",
        "cardCvv"

    ];


    fields.forEach(
        function (id) {

            const field =
                document.getElementById(
                    id
                );


            if (field) {

                field.value =
                    "";

            }

        }
    );


    const bankName =
        document.getElementById(
            "bankName"
        );


    if (bankName) {

        bankName.value =
            "";

    }


    const cashConfirmation =
        document.getElementById(
            "cashConfirmation"
        );


    if (cashConfirmation) {

        cashConfirmation.checked =
            false;

    }


    const button =
        document.getElementById(
            "confirmPaymentButton"
        );


    if (button) {

        button.disabled =
            false;

        button.innerHTML = `
            <span>
                Pay Securely
            </span>

            <span>
                →
            </span>
        `;

    }


    clearPaymentMessage();

}


// =====================================================
// CLOSE PAYMENT MODAL
// =====================================================

function closePaymentModal() {

    selectedPurchaseRequestId =
        null;

    selectedPurchaseRequest =
        null;


    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// =====================================================
// SUBMIT PAYMENT
// =====================================================

async function submitPayment() {

    if (!selectedPurchaseRequestId) {

        showPaymentMessage(
            "Purchase request not selected.",
            "error"
        );

        return;
    }


    // =================================================
    // NET BANKING
    // =================================================

    if (
        selectedPaymentMethod ===
        "NET_BANKING"
    ) {

        showPaymentMessage(
            "Net Banking UI is ready, but backend support will be added separately.",
            "error"
        );

        return;
    }


    // =================================================
    // UPI VALIDATION
    // =================================================

    if (
        selectedPaymentMethod ===
        "UPI"
    ) {

        const upiId =
            document.getElementById(
                "upiId"
            ).value.trim();


        /*
         * UPI ID is optional because the user can
         * choose QR payment instead.
         */

        if (
            upiId &&
            !/^[\w.-]+@[\w.-]+$/.test(
                upiId
            )
        ) {

            showPaymentMessage(
                "Please enter a valid UPI ID or leave it empty to use QR.",
                "error"
            );

            return;
        }

    }


    // =================================================
    // CARD VALIDATION
    // =================================================

    if (
        selectedPaymentMethod ===
        "CARD"
    ) {

        const cardNumber =
            document.getElementById(
                "cardNumber"
            ).value
                .replace(/\s/g, "");


        const cardName =
            document.getElementById(
                "cardName"
            ).value.trim();


        const cardExpiry =
            document.getElementById(
                "cardExpiry"
            ).value.trim();


        const cardCvv =
            document.getElementById(
                "cardCvv"
            ).value.trim();


        if (
            !/^\d{16}$/.test(
                cardNumber
            )
        ) {

            showPaymentMessage(
                "Please enter a valid 16-digit card number.",
                "error"
            );

            return;
        }


        if (!cardName) {

            showPaymentMessage(
                "Please enter the cardholder name.",
                "error"
            );

            return;
        }


        if (
            !/^\d{2}\/\d{2}$/.test(
                cardExpiry
            )
        ) {

            showPaymentMessage(
                "Please enter expiry in MM/YY format.",
                "error"
            );

            return;
        }


        if (
            !/^\d{3}$/.test(
                cardCvv
            )
        ) {

            showPaymentMessage(
                "Please enter a valid 3-digit CVV.",
                "error"
            );

            return;
        }

    }


    // =================================================
    // CASH VALIDATION
    // =================================================

    if (
        selectedPaymentMethod ===
        "CASH"
    ) {

        const confirmation =
            document.getElementById(
                "cashConfirmation"
            );


        if (
            !confirmation ||
            !confirmation.checked
        ) {

            showPaymentMessage(
                "Please confirm the cash payment.",
                "error"
            );

            return;
        }

    }


    // =================================================
    // SUBMIT
    // =================================================

    const button =
        document.getElementById(
            "confirmPaymentButton"
        );


    if (button) {

        button.disabled =
            true;

        button.innerHTML = `
            <span>
                Processing...
            </span>

            <span>
                ⏳
            </span>
        `;

    }


    clearPaymentMessage();


    const paymentData = {

        purchaseRequestId:
            selectedPurchaseRequestId,

        paymentMethod:
            selectedPaymentMethod

    };


    try {

        const response =
            await fetch(
                API_BASE_URL +
                "/api/payments",
                {
                    method: "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify(
                            paymentData
                        )
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            showPaymentMessage(
                data.message ||
                "Payment creation failed.",
                "error"
            );


            if (button) {

                button.disabled =
                    false;

                button.innerHTML = `
                    <span>
                        Pay Securely
                    </span>

                    <span>
                        →
                    </span>
                `;

            }

            return;
        }


        // =================================================
        // SUCCESS
        // =================================================

        showPaymentMessage(
            "Payment initiated successfully.",
            "success"
        );


        if (button) {

            button.innerHTML = `
                <span>
                    Payment Created
                </span>

                <span>
                    ✓
                </span>
            `;

        }


        setTimeout(
            function () {

                closePaymentModal();

                loadPayments();

            },
            1200
        );


    } catch (error) {

        console.error(
            "Payment error:",
            error
        );


        showPaymentMessage(
            "Something went wrong while creating payment.",
            "error"
        );


        if (button) {

            button.disabled =
                false;

            button.innerHTML = `
                <span>
                    Pay Securely
                </span>

                <span>
                    →
                </span>
            `;

        }

    }

}


// =====================================================
// PAYMENT MESSAGE
// =====================================================

function showPaymentMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "paymentMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    if (type === "success") {

        element.style.color =
            "#159570";

    } else {

        element.style.color =
            "#dc2626";

    }

}


// =====================================================
// CLEAR PAYMENT MESSAGE
// =====================================================

function clearPaymentMessage() {

    const element =
        document.getElementById(
            "paymentMessage"
        );


    if (element) {

        element.textContent =
            "";

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    value
) {

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


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

}


function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "email"
    );

    localStorage.removeItem(
        "role"
    );


    window.location.href =
        "index.html";

}