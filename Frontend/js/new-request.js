const API_BASE_URL = "http://localhost:8080";

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}

document.addEventListener("DOMContentLoaded", function () {

    const productSelect = document.getElementById("productId");
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    loadProducts();

    async function loadProducts() {

        try {
            const response = await fetch(
                API_BASE_URL + "/api/products",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                }
            );

            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "index.html";
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to load products.");
            }

            const products = await response.json();

            productSelect.innerHTML =
                '<option value="">Select a product</option>';

            products.forEach(function (product) {

                const option =
                    document.createElement("option");

                option.value = product.id;

                option.textContent =
                    product.name +
                    " — ₹" +
                    product.price;

                productSelect.appendChild(option);
            });

        } catch (error) {

            console.error(
                "Error loading products:",
                error
            );

            productSelect.innerHTML =
                '<option value="">Unable to load products</option>';
        }
    }
});

// =====================================================
// SUBMIT REQUEST BUTTON
// =====================================================
const submitRequestButton =
    document.getElementById("submitRequestButton");

if (submitRequestButton) {

    submitRequestButton.addEventListener("click", async function () {

        const userId = parseInt(
            localStorage.getItem("userId"),
            10
        );

        const productId =
            parseInt(
                document.getElementById("productId").value,
                10
            );

        const quantity =
            parseInt(
                document.getElementById("quantity").value,
                10
            );

        const requestData = {

            userId: userId,

            items: [
                {
                    productId: productId,
                    quantity: quantity
                }
            ],

            deliveryAddress: {

                recipientName:
                    document.getElementById("recipientName").value.trim(),

                phone:
                    document.getElementById("phone").value.trim(),

                addressLine1:
                    document.getElementById("addressLine1").value.trim(),

                addressLine2:
                    document.getElementById("addressLine2").value.trim(),

                city:
                    document.getElementById("city").value.trim(),

                state:
                    document.getElementById("state").value.trim(),

                postalCode:
                    document.getElementById("postalCode").value.trim(),

                country:
                    document.getElementById("country").value.trim()
            }
        };

        const response = await fetch(
    API_BASE_URL + "/api/purchase-requests",
    {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
    }
);

const result = await response.json();

console.log("Create Request Response:", result);
    });
}