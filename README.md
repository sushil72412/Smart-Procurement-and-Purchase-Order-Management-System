Enterprise Procurement Management System (EPMS)

A full-stack procurement management system developed using Java, Spring Boot, Spring Security, JWT, MySQL, HTML, CSS, and JavaScript.

🎯 Objective

EPMS digitizes the procurement process and provides a centralized platform for managing:

Products → Purchase Requests → Approval → Suppliers → Delivery → Payment → Ratings → Reports

👥 User Roles
Employee – Browse products, manage cart, create requests, track orders, payments, and submit ratings.
Manager – Review, approve, or reject purchase requests.
Supplier – View assigned orders and update shipment/delivery status.
Admin – Manage users, products, suppliers, requests, deliveries, payments, and reports.
✨ Main Features
🔐 JWT Authentication & Spring Security
👤 Role-Based Access Control
📦 Product Management
🛒 Shopping Cart
📋 Purchase Requests
✅ Manager Approval/Rejection
🏢 Supplier Management
🚚 Delivery Tracking
💳 Payment Management
⭐ Product Ratings & Reviews
🔔 Procurement Notifications
📊 Reports & CSV Export
🔐 Security

The system uses JWT-based authentication.

Login
  ↓
Credential Verification
  ↓
JWT Token
  ↓
Bearer Token
  ↓
Spring Security
  ↓
Role Verification
  ↓
Authorized API Access

Users can access only the operations permitted for their role.

🛠️ Technology Stack

Backend: Java 17, Spring Boot, Spring Data JPA, Hibernate, Spring Security, JWT

Frontend: HTML5, CSS3, JavaScript, Fetch API

Database: MySQL

Tools: VS Code, IntelliJ IDEA, Postman, Git, GitHub

🏗️ Architecture
Frontend
    ↓
REST API / Controller
    ↓
Service Layer
    ↓
Repository / JPA
    ↓
MySQL
📁 Project Structure
EPMS/
├── Backend/
│   └── src/main/java/com/epms/
│       ├── config/
│       ├── controller/
│       ├── dto/
│       ├── entity/
│       ├── repository/
│       ├── service/
│       └── util/
│
└── Frontend/
    ├── admin/
    ├── employee/
    ├── manager/
    ├── supplier/
    ├── css/
    └── js/
🔄 Procurement Workflow
Employee
   ↓
Select Product
   ↓
Shopping Cart
   ↓
Purchase Request
   ↓
Manager Approval
   ↓
Supplier Processing
   ↓
Delivery
   ↓
Payment
   ↓
Rating & Review
📊 Reports

Admin can monitor procurement information and download relevant data in CSV format for reporting and analysis.

🚀 Running the Project
Backend
mvn spring-boot:run

Backend:

http://localhost:8080
Frontend

Open the Frontend folder using VS Code Live Server.

🧪 Testing

The project was tested using:

Postman
REST API testing
Login & JWT authentication
Role-based authorization
CRUD operations
Purchase workflow
Delivery tracking
Payment monitoring
CSV export

🔮 Future Enhancements
Online payment gateway
Email/SMS notifications
Advanced analytics
PDF reports
Cloud deployment
Docker & CI/CD
AI-based procurement recommendations
👨‍💻 Author

Sushil Kumar

EPMS — Enterprise Procurement Management System

A secure, role-based full-stack application for managing the complete enterprise procurement lifecycle.

📑 Project Presentation

A detailed project presentation with system workflow, architecture, modules, security, and application screenshots is included separately in the project PPT.
