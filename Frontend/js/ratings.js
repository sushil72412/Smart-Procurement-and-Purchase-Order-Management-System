const API_BASE_URL = "http://localhost:8080";

let selectedPurchaseRequestId = null;
let selectedProductId = null;


// ========================================
// PAGE LOAD
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    loadRatingsPage();

    setupLogout();

    loadUserInfo();

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


// ========================================
// LOAD RATING DATA
// ========================================

async function loadRatingsPage() {

    const container =
        document.getElementById("ratingContainer");


    try {

        // --------------------------------
        // Purchase Requests
        // --------------------------------

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

// --------------------------------
// Deliveries
// --------------------------------

const deliveries = [];


for (const request of requests) {

    const deliveryResponse = await fetch(
        API_BASE_URL +
        "/api/deliveries/purchase-request/" +
        request.id,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );


    // 404 means this purchase request
    // does not have a delivery yet.
    if (
        deliveryResponse.status === 404 ||
        deliveryResponse.status === 400
    ) {
        continue;
    }


    if (deliveryResponse.status === 401) {

        logout();

        return;
    }


    if (!deliveryResponse.ok) {

        throw new Error(
            "Failed to load delivery for purchase request #" +
            request.id
        );

    }


    const delivery =
        await deliveryResponse.json();


    deliveries.push(delivery);

}

        // --------------------------------
        // Existing Ratings
        // --------------------------------

        const ratingsResponse = await fetch(
            API_BASE_URL + "/api/ratings",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (ratingsResponse.status === 401) {

            logout();

            return;
        }


        if (!ratingsResponse.ok) {

            throw new Error(
                "Failed to load ratings"
            );

        }


        const ratings =
            await ratingsResponse.json();


        displayRatings(
            requests,
            deliveries,
            ratings
        );


    } catch (error) {

        console.error(
            "Rating loading error:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ★
                </div>

                <h3>
                    Unable to load ratings
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }

}


// ========================================
// DISPLAY DELIVERED PRODUCTS
// ========================================

function displayRatings(
    requests,
    deliveries,
    ratings
) {

    const container =
        document.getElementById("ratingContainer");


    container.innerHTML = "";


    if (!requests || requests.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ★
                </div>

                <h3>
                    No Purchase Requests
                </h3>

                <p>
                    Delivered products will appear here
                    when they are ready for rating.
                </p>

            </div>

        `;

        return;
    }


    let deliveredProductFound = false;


    requests.forEach(request => {

        // Find delivery belonging to this request
        const delivery = deliveries.find(
            d =>
                d.purchaseRequestId === request.id
        );


        // Only delivered orders can be rated
        if (
            !delivery ||
            delivery.status !== "DELIVERED"
        ) {

            return;

        }


        if (!request.items) {
            return;
        }


        request.items.forEach(item => {

            deliveredProductFound = true;


            // Check whether this product
            // has already been rated
            const existingRating =
                ratings.find(
                    r =>
                        r.purchaseRequestId === request.id &&
                        r.productId === item.productId
                );


            const card =
                document.createElement("div");


            card.className = "summary-card";


            let content = `

                <h3>
                    ${item.productName}
                </h3>

                <p>
                    Purchase Request:
                    <strong>
                        #${request.id}
                    </strong>
                </p>

                <p>
                    Quantity:
                    <strong>
                        ${item.quantity}
                    </strong>
                </p>

            `;


            if (existingRating) {

                content += `

                    <p>
                        Your Rating:
                        <strong>
                            ${"★".repeat(existingRating.rating)}
                            ${"☆".repeat(5 - existingRating.rating)}
                        </strong>
                    </p>

                    <p>
                        Review:
                        ${existingRating.review || "No review"}
                    </p>

                    <p>
                        <strong>
                            Already Rated
                        </strong>
                    </p>

                `;

            } else {

                content += `

                    <button
                        type="button"
                        class="new-request-btn"
                        onclick="openRatingModal(
                            ${request.id},
                            ${item.productId},
                            '${escapeHtml(item.productName)}'
                        )">

                        ★ Rate Product

                    </button>

                `;

            }


            card.innerHTML = content;

            container.appendChild(card);

        });

    });


    if (!deliveredProductFound) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ★
                </div>

                <h3>
                    No Products Available for Rating
                </h3>

                <p>
                    You can rate a product after
                    its delivery is marked as DELIVERED.
                </p>

            </div>

        `;

    }

}


// ========================================
// ESCAPE PRODUCT NAME
// ========================================

function escapeHtml(value) {

    return String(value)
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

}


// ========================================
// OPEN RATING MODAL
// ========================================

function openRatingModal(
    purchaseRequestId,
    productId,
    productName
) {

    selectedPurchaseRequestId =
        purchaseRequestId;

    selectedProductId =
        productId;


    document.getElementById(
        "ratingProductInfo"
    ).textContent =
        "Product: " + productName +
        " | Purchase Request #" +
        purchaseRequestId;


    document.getElementById(
        "ratingValue"
    ).value = "5";


    document.getElementById(
        "ratingReview"
    ).value = "";


    document.getElementById(
        "ratingModal"
    ).style.display = "flex";

}


// ========================================
// CLOSE RATING MODAL
// ========================================

function closeRatingModal() {

    selectedPurchaseRequestId = null;

    selectedProductId = null;


    document.getElementById(
        "ratingModal"
    ).style.display = "none";

}


// ========================================
// SUBMIT RATING
// ========================================

async function submitRating() {

    if (
        !selectedPurchaseRequestId ||
        !selectedProductId
    ) {

        alert(
            "Product or purchase request not selected."
        );

        return;
    }


    const rating =
        Number(
            document.getElementById(
                "ratingValue"
            ).value
        );


    const review =
        document.getElementById(
            "ratingReview"
        ).value.trim();


    const ratingData = {

        purchaseRequestId:
            selectedPurchaseRequestId,

        productId:
            selectedProductId,

        rating:
            rating,

        review:
            review

    };


    try {

        const response = await fetch(
            API_BASE_URL + "/api/ratings",
            {
                method: "POST",

                headers: getAuthHeaders(),

                body:
                    JSON.stringify(ratingData)
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
                "Rating submission failed."
            );

            return;
        }


        alert(
            "Rating submitted successfully!"
        );


        closeRatingModal();


        // Refresh the page data
        loadRatingsPage();


    } catch (error) {

        console.error(
            "Rating submission error:",
            error
        );


        alert(
            "Something went wrong while submitting the rating."
        );

    }

}


// ========================================
// LOGOUT
// ========================================

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