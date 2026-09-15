const API_BASE_URL = "http://localhost:8080";


// ========================================
// PAGE LOAD
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    loadUserInformation();
    loadPurchaseRequests();
    setupLogout();

});


// ========================================
// AUTH HEADERS
// ========================================

function getAuthHeaders() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };

}


// ========================================
// USER INFORMATION
// ========================================

function loadUserInformation() {

    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    const emailElement =
        document.getElementById("userEmail");

    const roleElement =
        document.getElementById("userRole");


    if (emailElement && email) {
        emailElement.textContent = email;
    }

    if (roleElement && role) {
        roleElement.textContent = role;
    }

}


// ========================================
// LOAD PURCHASE REQUESTS
// ========================================

async function loadPurchaseRequests() {

    const container =
        document.getElementById("requestsContainer");


    try {

        const response = await fetch(
            API_BASE_URL + "/api/purchase-requests",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (response.status === 401) {

            logoutUser();
            return;

        }


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Failed to load purchase requests: " +
                response.status +
                " " +
                errorText
            );

        }


        const requests =
            await response.json();


        displayPurchaseRequests(requests);


    } catch (error) {

        console.error(
            "Purchase Request Error:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ▣
                </div>

                <h3>
                    Unable to load purchase requests
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }

}


// ========================================
// DISPLAY PURCHASE REQUESTS
// ========================================

function displayPurchaseRequests(requests) {

    const container =
        document.getElementById("requestsContainer");


    container.innerHTML = "";


    if (!requests || requests.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ▣
                </div>

                <h3>
                    No Purchase Requests
                </h3>

                <p>
                    There are no purchase requests yet.
                </p>

            </div>

        `;

        return;

    }


    // Latest requests first
    requests.sort(function (a, b) {

        return new Date(b.requestDate) -
               new Date(a.requestDate);

    });


    requests.forEach(function (request) {

        const card =
            document.createElement("div");

        card.className =
            "recent-request-card";


        let productsHTML = "";


        if (
            request.items &&
            request.items.length > 0
        ) {

            productsHTML =
                request.items.map(function (item) {

                    return `

                        <div style="
                            margin: 6px 0;
                        ">

                            <strong>
                                ${escapeHtml(
                                    item.productName
                                )}
                            </strong>

                            × ${item.quantity}

                        </div>

                    `;

                }).join("");

        } else {

            productsHTML =
                "<div>No items</div>";

        }


        const status =
            request.status || "UNKNOWN";


        const actionHTML =
            status === "PENDING"

                ? `

                    <div style="
                        display:flex;
                        gap:10px;
                        margin-top:20px;
                    ">

                        <button
                            type="button"
                            onclick="updateRequestStatus(
                                ${request.id},
                                'APPROVE'
                            )"
                            style="
                                padding:9px 18px;
                                border:none;
                                border-radius:8px;
                                background:#16a085;
                                color:white;
                                font-weight:600;
                                cursor:pointer;
                            "
                        >
                            Approve
                        </button>

                        <button
                            type="button"
                            onclick="updateRequestStatus(
                                ${request.id},
                                'REJECT'
                            )"
                            style="
                                padding:9px 18px;
                                border:none;
                                border-radius:8px;
                                background:#dc3545;
                                color:white;
                                font-weight:600;
                                cursor:pointer;
                            "
                        >
                            Reject
                        </button>

                    </div>

                `

                : `

                    <div style="
                        margin-top:18px;
                        color:#64748b;
                        font-size:14px;
                    ">
                        No action available for this request.
                    </div>

                `;


        card.innerHTML = `

            <div style="
                padding:20px;
                margin-bottom:12px;
                background:white;
                border:1px solid #e5e7eb;
                border-radius:12px;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:20px;
                    flex-wrap:wrap;
                ">

                    <div>

                        <div style="
                            color:#16a085;
                            font-weight:600;
                            margin-bottom:5px;
                        ">

                            #PR-${String(request.id)
                                .padStart(3, "0")}

                        </div>

                        <h3 style="
                            margin:0 0 8px 0;
                        ">

                            Purchase Request #${request.id}

                        </h3>

                        <div style="
                            color:#64748b;
                            font-size:14px;
                        ">

                            Employee:
                            <strong>
                                ${escapeHtml(
                                    request.employeeName || "-"
                                )}
                            </strong>

                        </div>

                    </div>


                    <div style="
                        font-weight:600;
                    ">

                        ${formatStatus(status)}

                    </div>

                </div>


                <div style="
                    margin-top:16px;
                ">

                    <strong>
                        Products
                    </strong>

                    <div style="
                        margin-top:8px;
                    ">

                        ${productsHTML}

                    </div>

                </div>


                <div style="
                    margin-top:12px;
                    color:#64748b;
                ">

                    Request Date:
                    ${formatDate(request.requestDate)}

                </div>


                ${actionHTML}

            </div>

        `;


        container.appendChild(card);

    });

}


// ========================================
// APPROVE / REJECT REQUEST
// ========================================

async function updateRequestStatus(
    requestId,
    action
) {

    const actionText =
        action === "APPROVE"
            ? "approve"
            : "reject";


    const confirmed =
        confirm(
            "Are you sure you want to " +
            actionText +
            " Purchase Request #" +
            requestId +
            "?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(

            API_BASE_URL +
            "/api/purchase-requests/" +
            requestId,

            {
                method: "PATCH",

                headers: getAuthHeaders(),

                body: JSON.stringify({
                    action: action
                })

            }

        );


        if (response.status === 401) {

            logoutUser();
            return;

        }


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Unable to update purchase request."
            );

        }


        alert(
            "Purchase Request #" +
            requestId +
            " has been " +
            (action === "APPROVE"
                ? "approved."
                : "rejected.")
        );


        loadPurchaseRequests();


    } catch (error) {

        console.error(
            "Update Purchase Request Error:",
            error
        );


        alert(
            "Unable to " +
            actionText +
            " the purchase request."
        );

    }

}


// ========================================
// FORMAT STATUS
// ========================================

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return "-";
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


// ========================================
// HTML ESCAPE
// ========================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ========================================
// LOGOUT
// ========================================

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutButton");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutUser
        );

    }

}


function logoutUser() {

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");

    window.location.href =
        "index.html";

}