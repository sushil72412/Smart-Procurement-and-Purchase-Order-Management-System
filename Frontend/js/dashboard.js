/* =========================================================
   EPMS DASHBOARD.JS
   ========================================================= */


/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL = "http://localhost:8080";


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("================================");
    console.log("EPMS DASHBOARD");
    console.log("================================");

    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    console.log("User:", email);
    console.log("Role:", role);
    console.log("================================");


    /* -----------------------------------------------------
       CHECK LOGIN
       ----------------------------------------------------- */

    if (!token) {

        console.warn("No JWT token found.");

        window.location.href = "index.html";

        return;
    }


    /* -----------------------------------------------------
       LOAD USER INFORMATION
       ----------------------------------------------------- */

    loadUserInformation();


    /* -----------------------------------------------------
       LOAD DASHBOARD DATA
       ----------------------------------------------------- */

    loadProductCount();

    loadPendingRequests();

    loadSuppliers();

    loadPendingDeliveries();

    loadRecentRequests();


    /* -----------------------------------------------------
       LOGOUT
       ----------------------------------------------------- */

    setupLogout();

    document.getElementById("viewRequestsButton")
    .addEventListener("click", function () {

        window.location.href = "purchase-requests.html";

    });

});


/* =========================================================
   GET AUTHORIZATION HEADER
   ========================================================= */

function getAuthHeaders() {

    const token =
        localStorage.getItem("token");

    return {

        "Content-Type": "application/json",

        "Authorization":
            "Bearer " + token

    };
}


/* =========================================================
   USER INFORMATION
   ========================================================= */

function loadUserInformation() {

    const email =
        localStorage.getItem("email");

    const role =
        localStorage.getItem("role");


    /* -----------------------------------------------------
       EMAIL
       ----------------------------------------------------- */

    const emailElement =
        document.getElementById("userEmail");

    if (emailElement && email) {

        emailElement.textContent =
            email;

    }


    /* -----------------------------------------------------
       ROLE
       ----------------------------------------------------- */

    const roleElement =
        document.getElementById("userRole");

    if (roleElement && role) {

        roleElement.textContent =
            role;

    }


    /* -----------------------------------------------------
       USER NAME / AVATAR
       ----------------------------------------------------- */

    const userNameElement =
        document.getElementById("userName");

    const storedName =
        localStorage.getItem("fullName");


    if (userNameElement && storedName) {

        userNameElement.textContent =
            storedName;

    }


    const avatarElement =
        document.getElementById("userAvatar");


    if (avatarElement) {

        let name =
            storedName ||
            email ||
            "User";

        const firstLetter =
            name.charAt(0).toUpperCase();

        avatarElement.textContent =
            firstLetter;

    }

}


/* =========================================================
   LOAD TOTAL PRODUCTS
   ========================================================= */

async function loadProductCount() {

    try {

        const response =
            await fetch(

                API_BASE_URL +
                "/api/products",

                {
                    method: "GET",
                    headers: getAuthHeaders()
                }

            );


        /* -------------------------------------------------
           HANDLE UNAUTHORIZED
           ------------------------------------------------- */

        if (response.status === 401) {

            console.error(
                "Unauthorized. JWT token may be invalid."
            );

            logoutUser();

            return;
        }


        /* -------------------------------------------------
           HANDLE FORBIDDEN
           ------------------------------------------------- */

        if (response.status === 403) {

            console.error(
                "Access denied while loading products."
            );

            return;
        }


        if (!response.ok) {

            throw new Error(

                "Failed to load products. Status: "
                + response.status

            );

        }


        const products =
            await response.json();


        console.log(
            "Total Products:",
            products.length
        );


        /* -------------------------------------------------
           UPDATE DASHBOARD
           ------------------------------------------------- */

        const element =
            document.getElementById(
                "totalProducts"
            );


        if (element) {

            element.textContent =
                products.length;

        }

    }

    catch (error) {

        console.error(
            "Error loading products:",
            error
        );

    }

}


/* =========================================================
   LOAD PENDING PURCHASE REQUESTS
   ========================================================= */

async function loadPendingRequests() {

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


        /* -------------------------------------------------
           AUTHENTICATION ERROR
           ------------------------------------------------- */

        if (response.status === 401) {

            console.error(
                "Unauthorized while loading purchase requests."
            );

            logoutUser();

            return;
        }


        /* -------------------------------------------------
           FORBIDDEN
           ------------------------------------------------- */

        if (response.status === 403) {

            console.error(
                "Access denied while loading purchase requests."
            );

            return;
        }


        if (!response.ok) {

            throw new Error(

                "Failed to load purchase requests. Status: "
                + response.status

            );

        }


        const requests =
            await response.json();


        console.log(
            "Purchase Requests:",
            requests
        );


        /* -------------------------------------------------
           COUNT PENDING REQUESTS
           ------------------------------------------------- */

        const pendingRequests =
            requests.filter(
                function (request) {

                    return request.status === "PENDING";

                }
            );


        console.log(
            "Pending Requests:",
            pendingRequests.length
        );


        /* -------------------------------------------------
           UPDATE DASHBOARD CARD
           ------------------------------------------------- */

        const element =
            document.getElementById(
                "pendingRequests"
            );


        if (element) {

            element.textContent =
                pendingRequests.length;

        }

    }

    catch (error) {

        console.error(
            "Error loading purchase requests:",
            error
        );

    }

}


/* =========================================================
   LOAD SUPPLIERS
   ========================================================= */

async function loadSuppliers() {

    try {

        const response =
            await fetch(

                API_BASE_URL +
                "/api/suppliers",

                {
                    method: "GET",
                    headers: getAuthHeaders()
                }

            );


        if (response.status === 401) {

            logoutUser();

            return;
        }


        if (response.status === 403) {

            console.warn(
                "Supplier access denied for current role."
            );

            return;
        }


        if (!response.ok) {

            throw new Error(

                "Failed to load suppliers. Status: "
                + response.status

            );

        }


        const suppliers =
            await response.json();


        console.log(
            "Total Suppliers:",
            suppliers.length
        );


        /* -------------------------------------------------
           UPDATE ACTIVE SUPPLIERS
           ------------------------------------------------- */

        const element =
            document.getElementById(
                "activeSuppliers"
            );


        if (element) {

            element.textContent =
                suppliers.length;

        }

    }

    catch (error) {

        console.error(
            "Error loading suppliers:",
            error
        );

    }

}


/* =========================================================
   LOAD PENDING DELIVERIES
   ========================================================= */

async function loadPendingDeliveries() {

    try {

        const response =
            await fetch(

                API_BASE_URL +
                "/api/deliveries",

                {
                    method: "GET",
                    headers: getAuthHeaders()
                }

            );


        console.log(
            "Deliveries HTTP Status:",
            response.status
        );


        // Read response as TEXT first

        const responseText =
            await response.text();


        console.log(
            "Deliveries Raw Response:",
            responseText
        );


        // -------------------------------
        // UNAUTHORIZED
        // -------------------------------

        if (response.status === 401) {

            console.warn(
                "Delivery authentication failed."
            );

            logoutUser();

            return;
        }


        // -------------------------------
        // FORBIDDEN
        // -------------------------------

        if (response.status === 403) {

            console.warn(
                "Delivery access denied for current role."
            );

            return;
        }


        // -------------------------------
        // OTHER ERRORS
        // -------------------------------

        if (!response.ok) {

            console.error(
                "Delivery API Error:",
                response.status,
                responseText
            );


            throw new Error(

                "Failed to load deliveries. Status: "
                + response.status
                + " - "
                + responseText

            );

        }


        // -------------------------------
        // SUCCESS
        // -------------------------------

        const deliveries =
            JSON.parse(responseText);


        console.log(
            "Deliveries:",
            deliveries
        );


        // -------------------------------
        // PENDING STATUSES
        // -------------------------------

        const pendingStatuses = [

            "ORDER_CONFIRMED",

            "PREPARING",

            "SHIPPED",

            "OUT_FOR_DELIVERY"

        ];


        const pendingDeliveries =
            deliveries.filter(
                function (delivery) {

                    return pendingStatuses.includes(
                        delivery.status
                    );

                }
            );


        console.log(
            "Pending Deliveries:",
            pendingDeliveries.length
        );


        // -------------------------------
        // UPDATE DASHBOARD
        // -------------------------------

        const element =
            document.getElementById(
                "pendingDeliveries"
            );


        if (element) {

            element.textContent =
                pendingDeliveries.length;

        }

    }

    catch (error) {

        console.error(
            "Error loading deliveries:",
            error
        );

    }

}


/* =========================================================
   LOAD RECENT PURCHASE REQUESTS
   ========================================================= */

async function loadRecentRequests() {

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


        if (!response.ok) {

            console.warn(
                "Could not load recent requests."
            );

            return;
        }


        const requests =
            await response.json();


        console.log(
            "Recent Requests:",
            requests
        );


        /* -------------------------------------------------
           SORT BY REQUEST DATE
           ------------------------------------------------- */

        requests.sort(
            function (a, b) {

                return new Date(
                    b.requestDate
                ) - new Date(
                    a.requestDate
                );

            }
        );


        /* -------------------------------------------------
           TAKE LATEST 5
           ------------------------------------------------- */

        const recentRequests =
            requests.slice(0, 5);


        /* -------------------------------------------------
           UPDATE REQUEST CONTAINER
           
           IMPORTANT:
           The dashboard HTML uses:
           
           id="requestsContainer"
           
           It does NOT use:
           
           id="purchaseRequestTable"
           ------------------------------------------------- */

        const requestsContainer =
            document.getElementById(
                "requestsContainer"
            );


        if (!requestsContainer) {

            console.warn(
                "requestsContainer element not found."
            );

            return;
        }


        /* -------------------------------------------------
           CLEAR EXISTING CONTENT
           ------------------------------------------------- */

        requestsContainer.innerHTML = "";


        /* -------------------------------------------------
           EMPTY STATE
           ------------------------------------------------- */

        if (recentRequests.length === 0) {

            requestsContainer.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ▣
                    </div>

                    <h3>
                        No purchase requests
                    </h3>

                    <p>
                        Recent procurement requests
                        will appear here.
                    </p>

                </div>

            `;

            return;
        }


        /* -------------------------------------------------
           CREATE REQUEST CARDS
           ------------------------------------------------- */

        recentRequests.forEach(
            function (request) {


                const requestCard =
                    document.createElement(
                        "div"
                    );


                requestCard.className =
                    "recent-request-card";


                /* -------------------------------------------------
                   REQUEST ID
                   ------------------------------------------------- */

                const requestId =
                    "#PR-" +
                    String(request.id)
                        .padStart(3, "0");


                /* -------------------------------------------------
                   PRODUCT NAME
                   ------------------------------------------------- */

                let productName =
                    "Multiple items";


                if (
                    request.items &&
                    request.items.length > 0 &&
                    request.items[0].productName
                ) {

                    productName =
                        request.items[0].productName;

                }


                /* -------------------------------------------------
                   STATUS
                   ------------------------------------------------- */

                const status =
                    request.status ||
                    "UNKNOWN";


                /* -------------------------------------------------
                   DATE
                   ------------------------------------------------- */

                const date =
                    formatDate(
                        request.requestDate
                    );


                /* -------------------------------------------------
                   CARD HTML
                   ------------------------------------------------- */

                requestCard.innerHTML = `

                    <div class="recent-request-info">

                        <div class="recent-request-id">

                            ${requestId}

                        </div>


                        <div class="recent-request-product">

                            ${escapeHtml(productName)}

                        </div>

                    </div>


                    <div class="recent-request-meta">

                        <span class="status ${getStatusClass(status)}">

                            ${formatStatus(status)}

                        </span>


                        <span class="recent-request-date">

                            ${date}

                        </span>

                    </div>

                `;


                requestsContainer.appendChild(
                    requestCard
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Error loading recent requests:",
            error
        );

    }

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

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


/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatStatus(status) {

    if (!status) {

        return "Unknown";

    }


    return status

        .toLowerCase()

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/* =========================================================
   STATUS CSS CLASS
   ========================================================= */

function getStatusClass(status) {

    if (!status) {

        return "unknown";

    }


    return status

        .toLowerCase()

        .replace(
            /_/g,
            "-"
        );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

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


/* =========================================================
   LOGOUT SETUP
   ========================================================= */

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

        function (event) {

            event.preventDefault();

            logoutUser();

        }

    );

}


/* =========================================================
   LOGOUT USER
   ========================================================= */

function logoutUser() {

    console.log(
        "Logging out..."
    );


    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "email"
    );

    localStorage.removeItem(
        "role"
    );

    localStorage.removeItem(
        "fullName"
    );


    window.location.href =
        "index.html";

}


/* =========================================================
   AUTO REFRESH DASHBOARD
   ========================================================= */

setInterval(

    function () {

        const token =
            localStorage.getItem(
                "token"
            );


        if (!token) {

            return;

        }


        loadProductCount();

        loadPendingRequests();

        loadSuppliers();

        loadPendingDeliveries();

        loadRecentRequests();

    },

    60000

);