📌 User Authentication & Management Endpoints
1️⃣ Register a New User
Endpoint: POST /api/users/register
Description: Registers a new user (Customer by default).
Request Body (JSON)

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
Expected Response (201 Created)

{
  "message": "User registered successfully",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}


2️ User Login
Endpoint: POST /api/users/login
Description: Authenticates a user and returns a JWT token.
Request Body (JSON)

{
  "email": "john@example.com",
  "password": "password123"
}
Expected Response (200 OK)

{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}


How to Test: Copy the token from the response and use it in headers for protected routes.
3️ Get Logged-In User Profile
Endpoint: GET /api/users/profile
Description: Returns user details (protected route, requires authentication).
Headers:

Authorization: Bearer jwt_token_here
Expected Response (200 OK)

{
  "id": "user_id_here",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer"
}
 Admin Endpoints
4️ Create First Admin
Endpoint: POST /api/admin/create-first-admin
Description: Creates the first admin (one-time operation).
Request Body (JSON)

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123"
}
Expected Response (201 Created)

{
  "message": "First admin created successfully!"
}
5️ Create Additional Admin Users (By an Existing Admin)
Endpoint: POST /api/admin/create-admin
Description: Allows an admin to create another admin.
Headers:

Authorization: Bearer jwt_admin_token_here
Request Body (JSON)

{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "admin123"
}
Expected Response (201 Created)

{
  "message": "Admin created successfully"
}
 Seller Endpoints

6️ Seller Registration
Endpoint: POST /api/sellers/register
Description: Allows new sellers to register.
Request Body (JSON)

{
  "name": "Seller Name",
  "email": "seller@example.com",
  "password": "seller123"
}
Expected Response (201 Created)

{
  "message": "Seller registered successfully",
  "user": {
    "id": "seller_id_here",
    "name": "Seller Name",
    "email": "seller@example.com",
    "role": "seller"
  }
}
7️ Seller Login
Endpoint: POST /api/sellers/login
Description: Authenticates a seller and returns a JWT token.
Request Body (JSON)

{
  "email": "seller@example.com",
  "password": "seller123"
}
Expected Response (200 OK)

{
  "token": "jwt_token_here",
  "user": {
    "id": "seller_id_here",
    "name": "Seller Name",
    "email": "seller@example.com",
    "role": "seller"
  }
}
 Protected Routes (Require Token)
For all protected routes, you must send the Authorization header:


Authorization: Bearer jwt_token_here

8️ Get All Users (Admin Only)
Endpoint: GET /api/users
Description: Fetches a list of all registered users.
Headers:

Authorization: Bearer jwt_admin_token_here
Expected Response (200 OK)

[
  {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  {
    "id": "admin_id_here",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
]
 How to Test in Postman?
Register a new user/admin/seller

Use POST /api/users/register or /api/sellers/register
Save the returned JWT token.
Login as a user/admin/seller

Use POST /api/users/login or /api/sellers/login
Copy the returned token.
Test protected routes

Add the token in Headers as:

Authorization: Bearer jwt_token_here
Try GET /api/users/profile to see your logged-in user details.
Create the first admin (Only once)

Use POST /api/admin/create-first-admin.
Create additional admins (Only if logged in as an admin)

Use POST /api/admin/create with an admin token.