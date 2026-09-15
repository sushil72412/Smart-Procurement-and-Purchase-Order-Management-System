const API_BASE_URL = "http://localhost:8080";

let suppliers = [];

// ===============================
// Initialize
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    initializeAdminSuppliers();
});

async function initializeAdminSuppliers() {

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

    const adminEmail = localStorage.getItem("email");

    if (adminEmail) {
        document.getElementById("adminEmail").textContent = adminEmail;
    }

    setupEventListeners();

    await loadSuppliers();
}


// ===============================
// Event Listeners
// ===============================
function setupEventListeners() {

    const searchInput = document.getElementById("supplierSearch");
    const refreshButton = document.getElementById("refreshSuppliersBtn");
    const logoutButton = document.getElementById("logoutBtn");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            displaySuppliers(searchInput.value);
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
            await loadSuppliers();
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
}


// ===============================
// Load Suppliers
// ===============================
async function loadSuppliers() {

    const tableBody = document.getElementById("suppliersTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-message">
                Loading suppliers...
            </td>
        </tr>
    `;

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_BASE_URL}/api/suppliers`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401 || response.status === 403) {
            alert("You are not authorized to view suppliers.");
            window.location.href = "../index.html";
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        suppliers = Array.isArray(data) ? data : [];

        displaySuppliers();

    } catch (error) {

        console.error("Error loading suppliers:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    Failed to load suppliers.
                </td>
            </tr>
        `;
    }
}


// ===============================
// Display Suppliers
// ===============================
function displaySuppliers(searchTerm = "") {

    const tableBody = document.getElementById("suppliersTableBody");

    const search = searchTerm.trim().toLowerCase();

    const filteredSuppliers = suppliers.filter(supplier => {

        const name = getSupplierName(supplier).toLowerCase();
        const email = getSupplierEmail(supplier).toLowerCase();
        const phone = getSupplierPhone(supplier).toLowerCase();
        const company = getSupplierCompany(supplier).toLowerCase();

        return (
            name.includes(search) ||
            email.includes(search) ||
            phone.includes(search) ||
            company.includes(search)
        );
    });


    if (filteredSuppliers.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No suppliers found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = filteredSuppliers.map(supplier => {

        const id = supplier.id ?? supplier.supplierId ?? "-";
        const name = getSupplierName(supplier);
        const email = getSupplierEmail(supplier);
        const phone = getSupplierPhone(supplier);
        const company = getSupplierCompany(supplier);
        const status = getSupplierStatus(supplier);

        return `
            <tr>

                <td>${escapeHtml(String(id))}</td>

                <td>${escapeHtml(name)}</td>

                <td>${escapeHtml(email)}</td>

                <td>${escapeHtml(phone)}</td>

                <td>${escapeHtml(company)}</td>

                <td>
                    ${getStatusBadge(status)}
                </td>

                <td>
                    <button
                        class="btn btn-secondary"
                        onclick="viewSupplier(${Number(id)})"
                    >
                        View
                    </button>
                </td>

            </tr>
        `;

    }).join("");
}


// ===============================
// View Supplier
// ===============================
function viewSupplier(id) {

    const supplier = suppliers.find(item =>
        Number(item.id ?? item.supplierId) === Number(id)
    );

    if (!supplier) {
        alert("Supplier details not found.");
        return;
    }

    const name = getSupplierName(supplier);
    const email = getSupplierEmail(supplier);
    const phone = getSupplierPhone(supplier);
    const company = getSupplierCompany(supplier);
    const status = getSupplierStatus(supplier);

    alert(
        `Supplier Details\n\n` +
        `ID: ${id}\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `Company: ${company}\n` +
        `Status: ${status}`
    );
}


// ===============================
// Supplier Field Helpers
// ===============================
function getSupplierName(supplier) {

    return String(
        supplier.name ??
        supplier.supplierName ??
        supplier.contactName ??
        "-"
    );
}


function getSupplierEmail(supplier) {

    return String(
        supplier.email ??
        supplier.supplierEmail ??
        "-"
    );
}


function getSupplierPhone(supplier) {

    return String(
        supplier.phone ??
        supplier.phoneNumber ??
        supplier.mobile ??
        "-"
    );
}


function getSupplierCompany(supplier) {

    return String(
        supplier.company ??
        supplier.companyName ??
        supplier.organization ??
        "-"
    );
}


function getSupplierStatus(supplier) {

    if (supplier.active !== undefined) {
        return supplier.active ? "ACTIVE" : "INACTIVE";
    }

    if (supplier.status !== undefined && supplier.status !== null) {
        return String(supplier.status).toUpperCase();
    }

    return "ACTIVE";
}


// ===============================
// Status Badge
// ===============================
function getStatusBadge(status) {

    const normalizedStatus = String(status).toUpperCase();

    if (
        normalizedStatus === "ACTIVE" ||
        normalizedStatus === "APPROVED"
    ) {
        return `
            <span class="status-badge status-active">
                ${escapeHtml(normalizedStatus)}
            </span>
        `;
    }

    return `
        <span class="status-badge status-inactive">
            ${escapeHtml(normalizedStatus)}
        </span>
    `;
}


// ===============================
// Logout
// ===============================
function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    window.location.href = "../index.html";
}


// ===============================
// HTML Escape
// ===============================
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
