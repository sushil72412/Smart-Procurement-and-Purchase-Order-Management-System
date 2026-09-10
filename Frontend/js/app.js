document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       LOGIN FORM
       ===================================================== */

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            const message = document.getElementById("loginMessage");
            const loginButton =
                loginForm.querySelector(".auth-button");


            // Clear previous message
            message.className = "message";
            message.textContent = "";


            // Basic validation
            if (email === "" || password === "") {

                showMessage(
                    message,
                    "Please enter email and password.",
                    "error"
                );

                return;
            }


            try {

                loginButton.disabled = true;
                loginButton.textContent = "Logging in...";


                // Call Spring Boot Login API
                const response = await fetch(
                    "http://localhost:8080/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


                // Read response
                const responseText = await response.text();

                console.log("Login status:", response.status);
                console.log("Login response:", responseText);


                // Convert response to JSON
                let data = {};

                if (responseText) {

                    try {
                        data = JSON.parse(responseText);
                    }
                    catch (error) {
                        console.log("Login response is not JSON.");
                    }

                }


                // Login failed
                if (!response.ok) {

                    showMessage(
                        message,
                        data.message || "Invalid email or password.",
                        "error"
                    );

                    return;
                }


                // Login successful
                console.log("Login response:", data);


                /*
                 * Store authentication information
                 */

                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "email",
                    data.email
                );

                localStorage.setItem(
                    "role",
                    data.role
                );


                console.log("JWT Token:", data.token);
                console.log("Email:", data.email);
                console.log("Role:", data.role);

                showMessage(                
                    message,
                    "Login successful!",
                    "success"
                );
                
                
    /* =====================================================                
    ROLE-BASED DASHBOARD REDIRECTION
   ===================================================== */
                
                setTimeout(function () {
                    const role =
                        String(data.role || "")
                            .toUpperCase()
                            .trim();


                    switch (role) {

                        case "ADMIN":

                            window.location.href =
                                "admin-dashboard.html";

                            break;


                        case "MANAGER":

                            window.location.href =
                                "manager-dashboard.html";

                            break;


                        case "SUPPLIER":

                            window.location.href =
                                "supplier-dashboard.html";

                            break;


                        case "EMPLOYEE":

                            window.location.href =
                                "dashboard.html";

                            break;


                        default:

                            console.error(
                                "Unknown user role:",
                                data.role
                            );

                            showMessage(
                                message,
                                "Login successful, but user role is invalid.",
                                "error"
                            );

                            localStorage.removeItem("token");
                            localStorage.removeItem("email");
                            localStorage.removeItem("role");

                            break;
                    }

                }, 500);


                /*
                 * Dashboard redirection will be added
                 * after dashboard pages are created.
                 */


            }
            catch (error) {

                console.error("Login error:", error);

                showMessage(
                    message,
                    "Unable to connect to the server.",
                    "error"
                );

            }
            finally {

                loginButton.disabled = false;
                loginButton.textContent = "Login";

            }

        });

    }



    /* =====================================================
       REGISTRATION FORM
       ===================================================== */

    const registerForm =
        document.getElementById("registerForm");


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                /* ---------------------------------------------
                   GET FORM VALUES
                   --------------------------------------------- */

                const fullName =
                    document.getElementById("fullName")
                        .value
                        .trim();


                const email =
                    document.getElementById("registerEmail")
                        .value
                        .trim();


                const phone =
                    document.getElementById("phone")
                        .value
                        .trim();


                const password =
                    document.getElementById("registerPassword")
                        .value;


                const confirmPassword =
                    document.getElementById("confirmPassword")
                        .value;


                const role =
                    document.getElementById("role")
                        .value;


                const message =
                    document.getElementById("registerMessage");


                const registerButton =
                    registerForm.querySelector(".auth-button");


                // Clear previous message
                message.className = "message";
                message.textContent = "";


                /* ---------------------------------------------
                   VALIDATION
                   --------------------------------------------- */

                // Empty field validation
                if (
                    fullName === "" ||
                    email === "" ||
                    phone === "" ||
                    password === "" ||
                    confirmPassword === "" ||
                    role === ""
                ) {

                    showMessage(
                        message,
                        "Please fill in all fields.",
                        "error"
                    );

                    return;
                }


                // Email validation
                if (!isValidEmail(email)) {

                    showMessage(
                        message,
                        "Please enter a valid email address.",
                        "error"
                    );

                    return;
                }


                // Phone validation
                if (!/^[0-9]{10}$/.test(phone)) {

                    showMessage(
                        message,
                        "Phone number must be exactly 10 digits.",
                        "error"
                    );

                    return;
                }


                // Password validation
                if (password.length < 6) {

                    showMessage(
                        message,
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;
                }


                // Confirm password
                if (password !== confirmPassword) {

                    showMessage(
                        message,
                        "Passwords do not match.",
                        "error"
                    );

                    return;
                }


                /* ---------------------------------------------
                   REGISTRATION API
                   --------------------------------------------- */

                try {

                    registerButton.disabled = true;
                    registerButton.textContent =
                        "Creating Account...";


                    /*
                     * Call Spring Boot User API
                     */

                    const response = await fetch(
                        "http://localhost:8080/api/auth/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({

                                fullName: fullName,

                                email: email,

                                password: password,

                                phone: phone,

                                role: role

                            })
                        }
                    );


                    /*
                     * Read response as text first.
                     *
                     * This prevents JSON parsing errors when
                     * Spring Security returns an empty response.
                     */

                    const responseText =
                        await response.text();


                    console.log(
                        "Registration status:",
                        response.status
                    );


                    console.log(
                        "Registration response:",
                        responseText
                    );


                    /*
                     * Convert response to JSON
                     */

                    let data = {};


                    if (responseText) {

                        try {

                            data =
                                JSON.parse(responseText);

                        }
                        catch (error) {

                            console.log(
                                "Registration response is not JSON."
                            );

                        }

                    }


                    /* ---------------------------------------------
                       HANDLE REGISTRATION ERRORS
                       --------------------------------------------- */

                    if (!response.ok) {


                        // 400 Bad Request
                        if (response.status === 400) {

                            showMessage(
                                message,
                                data.message ||
                                "Invalid registration details.",
                                "error"
                            );

                        }


                        // 401 Unauthorized
                        else if (response.status === 401) {

                            showMessage(
                                message,
                                "Authentication required.",
                                "error"
                            );

                        }


                        // 403 Forbidden
                        else if (response.status === 403) {

                            showMessage(
                                message,
                                "You are not allowed to create this account.",
                                "error"
                            );

                        }


                        // 409 Conflict
                        else if (response.status === 409) {

                            showMessage(
                                message,
                                data.message ||
                                "Email already exists.",
                                "error"
                            );

                        }


                        // Other errors
                        else {

                            showMessage(
                                message,
                                data.message ||
                                "Registration failed. Status: " +
                                response.status,
                                "error"
                            );

                        }

                        return;
                    }


                    /* ---------------------------------------------
                       REGISTRATION SUCCESS
                       --------------------------------------------- */

                    console.log(
                        "Registration successful:",
                        data
                    );


                    showMessage(
                        message,
                        "Account created successfully! Redirecting to login...",
                        "success"
                    );


                    /*
                     * Redirect to login page
                     */

                    setTimeout(function () {

                        window.location.href =
                            "index.html";

                    }, 1500);


                }
                catch (error) {

                    console.error(
                        "Registration error:",
                        error
                    );


                    showMessage(
                        message,
                        "Unable to connect to the server.",
                        "error"
                    );

                }
                finally {

                    registerButton.disabled = false;

                    registerButton.textContent =
                        "Create Account";

                }

            }
        );

    }

});



/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(element, text, type) {

    element.textContent = text;

    element.className =
        "message " + type;

}



/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);

}