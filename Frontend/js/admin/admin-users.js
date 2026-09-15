const API_BASE_URL = "http://localhost:8080";

let allUsers = [];


// =========================================================
// PAGE INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeUsersPage();
});


async function initializeUsersPage() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    try {

        const user = getUserFromToken();

        if (!user) {
            throw new Error("Unable to read authentication token.");
        }

        if (user.role && user.role !== "ADMIN") {

            alert("Access denied. Admin account required.");

            window.location.href = "../index.html";

            return;
        }

        updateAdminInfo(user);

        await loadUsers();

    } catch (error) {

        console.error(
            "Admin Users initialization failed:",
            error
        );

        showError(error.message);
    }


    setupLogout();

    setupUserManagement();

    setupEditUserModal();

    setupAddUserModal();
}


// =========================================================
// AUTH
// =========================================================

function getAuthHeaders() {

    const token =
        localStorage.getItem("token");

    return {

        "Content-Type": "application/json",

        "Authorization":
            "Bearer " + token

    };
}


function getUserFromToken() {

    const token =
        localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {

        const payload =
            token.split(".")[1];

        const decoded =
            atob(
                payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            );

        return JSON.parse(decoded);

    } catch (error) {

        console.error(
            "JWT parsing failed:",
            error
        );

        return null;
    }
}


// =========================================================
// ADMIN INFORMATION
// =========================================================

function updateAdminInfo(user) {

    const email =
        user.email ||
        user.sub ||
        "admin@epms.com";

    const name =
        user.fullName ||
        user.name ||
        "Administrator";


    setText(
        "adminName",
        name
    );

    setText(
        "adminEmail",
        email
    );


    const avatar =
        document.getElementById(
            "adminAvatar"
        );

    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();
    }
}


// =========================================================
// LOAD USERS
// =========================================================

async function loadUsers() {

    const tableBody =
        document.getElementById(
            "usersTableBody"
        );

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="loading-cell">
                    Loading users...
                </td>
            </tr>
        `;
    }


    try {

        const users =
            await fetchUsers();

        renderUsers(users);

    } catch (error) {

        console.error(
            "Failed to load users:",
            error
        );

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center; padding:30px;">
                        Unable to load users.
                    </td>
                </tr>
            `;
        }
    }
}


// =========================================================
// API
// =========================================================

async function fetchUsers() {

    return fetchJson(
        "/api/users"
    );
}


async function fetchJson(endpoint) {

    const response =
        await fetch(
            API_BASE_URL + endpoint,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


    console.log(
        endpoint,
        "→",
        response.status
    );


    if (response.status === 401) {

        handleUnauthorized();

        throw new Error(
            "Authentication expired."
        );
    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to access " +
            endpoint
        );
    }


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            endpoint,
            errorText
        );

        throw new Error(
            "Failed to load " + endpoint
        );
    }


    return await response.json();
}


// =========================================================
// RENDER USERS
// =========================================================

function renderUsers(users) {

    allUsers =
        Array.isArray(users)
            ? users
            : [];

    displayUsers(allUsers);
}


// =========================================================
// DISPLAY USERS
// =========================================================

function displayUsers(users) {

    const tableBody =
        document.getElementById(
            "usersTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (
        !users ||
        users.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    users.forEach(user => {

        const row =
            document.createElement("tr");


        const role =
            user.role ||
            "UNKNOWN";


        row.innerHTML = `

            <td>
                #${user.id}
            </td>

            <td>
                ${escapeHtml(
                    user.fullName ||
                    "N/A"
                )}
            </td>

            <td>
                ${escapeHtml(
                    user.email ||
                    "N/A"
                )}
            </td>

            <td>
                ${escapeHtml(
                    user.phone ||
                    "N/A"
                )}
            </td>

            <td>

                <span
                    class="user-role-badge ${getRoleClass(role)}">

                    ${formatStatus(role)}

                </span>

            </td>

            <td>

                <div class="user-action-buttons">

                    <button
                        class="user-action-btn"
                        onclick="editUser(${user.id})">

                        Edit

                    </button>


                    <button
                        class="user-action-btn delete"
                        onclick="deleteUser(
                            ${user.id},
                            '${escapeJs(
                                user.fullName ||
                                "this user"
                            )}'
                        )">

                        Delete

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);
    });
}


// =========================================================
// SEARCH + ROLE FILTER
// =========================================================

function setupUserManagement() {

    const searchInput =
        document.getElementById(
            "userSearch"
        );


    const roleFilter =
        document.getElementById(
            "roleFilter"
        );


    const refreshButton =
        document.getElementById(
            "refreshUsersBtn"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterUsers
        );
    }


    if (roleFilter) {

        roleFilter.addEventListener(
            "change",
            filterUsers
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.disabled =
                    true;

                refreshButton.textContent =
                    "↻ Loading...";


                try {

                    await loadUsers();

                } catch (error) {

                    console.error(
                        "User refresh failed:",
                        error
                    );

                } finally {

                    refreshButton.disabled =
                        false;

                    refreshButton.textContent =
                        "↻ Refresh";
                }

            }
        );
    }
}


// =========================================================
// FILTER USERS
// =========================================================

function filterUsers() {

    const searchInput =
        document.getElementById(
            "userSearch"
        );


    const roleFilter =
        document.getElementById(
            "roleFilter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedRole =
        roleFilter
            ? roleFilter.value
            : "ALL";


    const filteredUsers =
        allUsers.filter(user => {

            const name =
                (
                    user.fullName ||
                    ""
                ).toLowerCase();


            const email =
                (
                    user.email ||
                    ""
                ).toLowerCase();


            const phone =
                (
                    user.phone ||
                    ""
                ).toLowerCase();


            const role =
                user.role ||
                "";


            const matchesSearch =
                name.includes(searchTerm) ||
                email.includes(searchTerm) ||
                phone.includes(searchTerm);


            const matchesRole =
                selectedRole === "ALL" ||
                role === selectedRole;


            return (
                matchesSearch &&
                matchesRole
            );

        });


    displayUsers(
        filteredUsers
    );
}


// =========================================================
// ROLE CSS CLASS
// =========================================================

function getRoleClass(role) {

    switch (role) {

        case "ADMIN":
            return "role-admin";

        case "MANAGER":
            return "role-manager";

        case "EMPLOYEE":
            return "role-employee";

        case "SUPPLIER":
            return "role-supplier";

        default:
            return "";
    }
}


// =========================================================
// DELETE USER
// =========================================================

async function deleteUser(
    userId,
    userName
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete ${userName}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/users/${userId}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "Delete user response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to delete users."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Delete user error:",
                errorText
            );

            alert(
                "Unable to delete user."
            );

            return;
        }


        alert(
            "User deleted successfully."
        );


        await loadUsers();

    } catch (error) {

        console.error(
            "Delete user failed:",
            error
        );

        alert(
            "Something went wrong while deleting the user."
        );
    }
}


// =========================================================
// EDIT USER
// =========================================================

function editUser(userId) {

    const user =
        allUsers.find(
            item => item.id === userId
        );


    if (!user) {

        alert(
            "User not found."
        );

        return;
    }


    setValue(
        "editUserId",
        user.id
    );

    setValue(
        "editFullName",
        user.fullName || ""
    );

    setValue(
        "editEmail",
        user.email || ""
    );

    setValue(
        "editPhone",
        user.phone || ""
    );

    setValue(
        "editRole",
        user.role || "EMPLOYEE"
    );


    const modal =
        document.getElementById(
            "editUserModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );
    }
}


// =========================================================
// EDIT USER MODAL
// =========================================================

function setupEditUserModal() {

    const modal =
        document.getElementById(
            "editUserModal"
        );


    const closeButton =
        document.getElementById(
            "closeEditModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelEditBtn"
        );


    const form =
        document.getElementById(
            "editUserForm"
        );


    function closeModal() {

        if (modal) {

            modal.classList.remove(
                "show"
            );
        }
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();
                }

            }
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await saveUserChanges(
                    closeModal
                );

            }
        );
    }
}


// =========================================================
// SAVE USER CHANGES
// =========================================================

async function saveUserChanges(
    closeModal
) {

    const userId =
        document.getElementById(
            "editUserId"
        ).value;


    const fullName =
        document.getElementById(
            "editFullName"
        ).value.trim();


    const email =
        document.getElementById(
            "editEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "editPhone"
        ).value.trim();


    const role =
        document.getElementById(
            "editRole"
        ).value;


    if (
        !fullName ||
        !email ||
        !phone ||
        !role
    ) {

        alert(
            "Please fill all fields."
        );

        return;
    }


    const saveButton =
        document.querySelector(
            "#editUserForm .save-btn"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/users/${userId}`,
                {
                    method: "PUT",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            fullName:
                                fullName,

                            email:
                                email,

                            phone:
                                phone,

                            role:
                                role

                        })
                }
            );


        console.log(
            "Update user response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to update users."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Update user error:",
                errorText
            );

            alert(
                "Unable to update user."
            );

            return;
        }


        alert(
            "User updated successfully."
        );


        closeModal();


        await loadUsers();

    } catch (error) {

        console.error(
            "Update user failed:",
            error
        );

        alert(
            "Something went wrong while updating the user."
        );

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Changes";
        }
    }
}


// =========================================================
// ADD USER MODAL
// =========================================================

function setupAddUserModal() {

    const modal =
        document.getElementById(
            "addUserModal"
        );


    const openButton =
        document.getElementById(
            "addUserBtn"
        );


    const closeButton =
        document.getElementById(
            "closeAddModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelAddBtn"
        );


    const form =
        document.getElementById(
            "addUserForm"
        );


    function closeModal() {

        if (modal) {

            modal.classList.remove(
                "show"
            );
        }


        if (form) {

            form.reset();
        }
    }


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                if (modal) {

                    modal.classList.add(
                        "show"
                    );
                }

            }
        );
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();
                }

            }
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await createUser(
                    closeModal
                );

            }
        );
    }
}


// =========================================================
// CREATE USER
// =========================================================

async function createUser(
    closeModal
) {

    const fullName =
        document.getElementById(
            "addFullName"
        ).value.trim();


    const email =
        document.getElementById(
            "addEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "addPhone"
        ).value.trim();


    const password =
        document.getElementById(
            "addPassword"
        ).value;


    const role =
        document.getElementById(
            "addRole"
        ).value;


    if (
        !fullName ||
        !email ||
        !phone ||
        !password ||
        !role
    ) {

        alert(
            "Please fill all fields."
        );

        return;
    }


    const button =
        document.getElementById(
            "createUserBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Creating...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/users`,
                {
                    method: "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            fullName:
                                fullName,

                            email:
                                email,

                            phone:
                                phone,

                            password:
                                password,

                            role:
                                role

                        })
                }
            );


        console.log(
            "Create user response:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;
        }


        if (response.status === 403) {

            alert(
                "You do not have permission to create users."
            );

            return;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Create user error:",
                errorText
            );

            alert(
                "Unable to create user."
            );

            return;
        }


        alert(
            "User created successfully."
        );


        closeModal();


        await loadUsers();

    } catch (error) {

        console.error(
            "Create user failed:",
            error
        );

        alert(
            "Something went wrong while creating the user."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Create User";
        }
    }
}


// =========================================================
// LOGOUT
// =========================================================

function setupLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        logout
    );
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

    localStorage.removeItem(
        "name"
    );


    window.location.href =
        "../index.html";
}


// =========================================================
// UNAUTHORIZED
// =========================================================

function handleUnauthorized() {

    localStorage.removeItem(
        "token"
    );


    alert(
        "Your session has expired. Please login again."
    );


    window.location.href =
        "../index.html";
}


// =========================================================
// HELPERS
// =========================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }
}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value;
    }
}


function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return status
        .toLowerCase()
        .split("_")
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}


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


function escapeJs(value) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\n/g,
            "\\n"
        )
        .replace(
            /\r/g,
            "\\r"
        );
}


// =========================================================
// ERROR
// =========================================================

function showError(message) {

    console.error(
        "Admin Users error:",
        message
    );


    const tableBody =
        document.getElementById(
            "usersTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center; padding:30px;">
                    Unable to load users.
                </td>
            </tr>
        `;
    }
}