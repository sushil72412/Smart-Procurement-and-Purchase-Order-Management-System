const API_BASE_URL = "http://localhost:8080";

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }


    // =====================================================
    // LOAD CART
    // =====================================================

    const cart = JSON.parse(
        localStorage.getItem("epmsCart") || "[]"
    );

    const orderSummary =
        document.getElementById("orderSummary");

    const orderTotal =
        document.getElementById("orderTotal");


    // =====================================================
    // CHECK CART
    // =====================================================

    if (cart.length === 0) {

        orderSummary.innerHTML = `
            <p style="
                color: #dc2626;
                font-weight: 600;
            ">
                Your cart is empty.
            </p>
        `;

        orderTotal.innerHTML = "";

        const submitButton =
            document.getElementById("submitRequestButton");

        if (submitButton) {
            submitButton.disabled = true;
        }

        return;
    }


    // =====================================================
    // DISPLAY ORDER SUMMARY
    // =====================================================

    let total = 0;

    orderSummary.innerHTML = "";

    cart.forEach(function (item) {

        const itemTotal =
            Number(item.price) * Number(item.quantity);

        total += itemTotal;


        const itemRow =
            document.createElement("div");

        itemRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 15px 0;
            border-bottom: 1px solid #e2e8f0;
        `;


        itemRow.innerHTML = `
            <div>
                <div style="
                    font-size: 15px;
                    font-weight: 700;
                    color: #172033;
                ">
                    ${escapeHtml(item.name)}
                </div>

                <div style="
                    margin-top: 5px;
                    font-size: 12px;
                    color: #64748b;
                ">
                    ₹${Number(item.price).toLocaleString("en-IN")}
                    × ${Number(item.quantity)}
                </div>
            </div>

            <div style="
                font-size: 15px;
                font-weight: 700;
                color: #159570;
                white-space: nowrap;
            ">
                ₹${itemTotal.toLocaleString("en-IN")}
            </div>
        `;

        orderSummary.appendChild(itemRow);
    });


    orderTotal.innerHTML = `
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
        ">
            <span>
                Total Amount
            </span>

            <span style="
                color: #159570;
            ">
                ₹${total.toLocaleString("en-IN")}
            </span>
        </div>
    `;


    // =====================================================
    // SUBMIT REQUEST
    // =====================================================

    const submitRequestButton =
        document.getElementById("submitRequestButton");

    if (submitRequestButton) {

        submitRequestButton.addEventListener(
            "click",
            async function () {

                const recipientName =
                    document.getElementById("recipientName")
                        .value.trim();

                const phone =
                    document.getElementById("phone")
                        .value.trim();

                const addressLine1 =
                    document.getElementById("addressLine1")
                        .value.trim();

                const addressLine2 =
                    document.getElementById("addressLine2")
                        .value.trim();

                const city =
                    document.getElementById("city")
                        .value.trim();

                const state =
                    document.getElementById("state")
                        .value.trim();

                const postalCode =
                    document.getElementById("postalCode")
                        .value.trim();

                const country =
                    document.getElementById("country")
                        .value.trim();


                // =================================================
                // BASIC VALIDATION
                // =================================================

                if (
                    !recipientName ||
                    !phone ||
                    !addressLine1 ||
                    !city ||
                    !state ||
                    !postalCode ||
                    !country
                ) {

                    showMessage(
                        "Please fill in all required delivery details.",
                        "error"
                    );

                    return;
                }


                if (!/^\d{10}$/.test(phone)) {

                    showMessage(
                        "Please enter a valid 10-digit phone number.",
                        "error"
                    );

                    return;
                }


                if (!/^\d{6}$/.test(postalCode)) {

                    showMessage(
                        "Please enter a valid 6-digit postal code.",
                        "error"
                    );

                    return;
                }


                // =================================================
                // CREATE REQUEST DATA
                // =================================================

                const requestData = {

                    items: cart.map(function (item) {

                        return {
                            productId: Number(item.productId),
                            quantity: Number(item.quantity)
                        };

                    }),

                    deliveryAddress: {

                        recipientName: recipientName,

                        phone: phone,

                        addressLine1: addressLine1,

                        addressLine2: addressLine2,

                        city: city,

                        state: state,

                        postalCode: postalCode,

                        country: country
                    }
                };


                // =================================================
                // DISABLE BUTTON
                // =================================================

                submitRequestButton.disabled = true;

                submitRequestButton.textContent =
                    "Creating Request...";


                try {

                    const response = await fetch(
                        API_BASE_URL +
                        "/api/purchase-requests",
                        {
                            method: "POST",
                            headers: getAuthHeaders(),
                            body: JSON.stringify(requestData)
                        }
                    );


                    // =============================================
                    // UNAUTHORIZED
                    // =============================================

                    if (response.status === 401) {

                        localStorage.removeItem("token");

                        window.location.href =
                            "index.html";

                        return;
                    }


                    // =============================================
                    // READ RESPONSE
                    // =============================================

                    const result =
                        await response.json();


                    console.log(
                        "Create Request Response:",
                        result
                    );


                    // =============================================
                    // SUCCESS
                    // =============================================

                    if (response.ok) {

                        showMessage(
                            "Purchase request created successfully.",
                            "success"
                        );


                        // Clear cart after successful request
                        localStorage.removeItem(
                            "epmsCart"
                        );


                        submitRequestButton.textContent =
                            "Request Created";


                        // Redirect after short delay
                        setTimeout(function () {

                            window.location.href =
                                "purchase-requests.html";

                        }, 1500);

                        return;
                    }


                    // =============================================
                    // BACKEND ERROR
                    // =============================================

                    let errorMessage =
                        "Failed to create purchase request.";

                    if (result && result.message) {
                        errorMessage = result.message;
                    }

                    showMessage(
                        errorMessage,
                        "error"
                    );


                    submitRequestButton.disabled =
                        false;

                    submitRequestButton.textContent =
                        "Create Purchase Request";


                } catch (error) {

                    console.error(
                        "Create Purchase Request Error:",
                        error
                    );


                    showMessage(
                        "Unable to connect to the server.",
                        "error"
                    );


                    submitRequestButton.disabled =
                        false;

                    submitRequestButton.textContent =
                        "Create Purchase Request";
                }

            }
        );
    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showMessage(message, type) {

        const messageElement =
            document.getElementById("requestMessage");

        if (!messageElement) {
            return;
        }


        messageElement.textContent =
            message;


        if (type === "success") {

            messageElement.style.color =
                "#159570";

        } else {

            messageElement.style.color =
                "#dc2626";
        }
    }


    // =====================================================
    // HTML ESCAPE
    // =====================================================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

});