🔑 1. Get a JWT Token (Login via User Service)
Before testing cart operations, log in via User Service to get a JWT token.

Request: POST http://localhost:5000/api/users/login

Body (JSON):
json
Copy
Edit
{
  "email": "user@example.com",
  "password": "yourpassword"
}
Response:
json
Copy
Edit
{
  "token": "your_jwt_token_here"
}
👉 Copy this token for the next steps.

🛍 2. Add a Product to the Cart
This endpoint adds a product to the user's cart.

Request: POST http://localhost:5002/api/cart/add

Headers:
plaintext
Copy
Edit
Authorization: Bearer your_jwt_token_here
Content-Type: application/json
Body (JSON):
json
Copy
Edit
{
  "productId": "your_product_id_here"
}
Response:
json
Copy
Edit
{
  "userId": "user_id_here",
  "items": [
    {
      "productId": "your_product_id_here",
      "quantity": 1
    }
  ]
}
✅ Success: Product added to cart
❌ Errors:

"Unauthorized" → Ensure JWT token is correct.
"Product not found" → Check if Product Service is running and productId exists.
📋 3. Get User's Cart
Retrieve all cart items for the logged-in user.

Request: GET http://localhost:5002/api/cart

Headers:
plaintext
Copy
Edit
Authorization: Bearer your_jwt_token_here
Response:
json
Copy
Edit
{
  "userId": "user_id_here",
  "items": [
    {
      "productId": "your_product_id_here",
      "quantity": 1
    }
  ]
}
✅ Success: Returns all cart items
❌ Errors:

"Unauthorized" → Ensure JWT token is correct.
"Cart not found" → The user has no items in their cart.
❌ 4. Remove a Product from Cart
This endpoint removes a product from the cart.

Request: DELETE http://localhost:5002/api/cart/remove/:productId

Headers:
plaintext
Copy
Edit
Authorization: Bearer your_jwt_token_here
Response:
json
Copy
Edit
{
  "message": "Product removed from cart",
  "cart": {
    "userId": "user_id_here",
    "items": []
  }
}
✅ Success: Product removed
❌ Errors:

"Cart not found" → The user has no cart.
"Product not in cart" → The product is not in the cart.
🔄 5. Update Product Quantity in Cart
This endpoint updates the quantity of a product in the cart.

Request: PUT http://localhost:5002/api/cart/update/:productId

Headers:
plaintext
Copy
Edit
Authorization: Bearer your_jwt_token_here
Content-Type: application/json
Body (JSON):
json
Copy
Edit
{
  "quantity": 3
}
Response:
json
Copy
Edit
{
  "message": "Cart updated",
  "cart": {
    "userId": "user_id_here",
    "items": [
      {
        "productId": "your_product_id_here",
        "quantity": 3
      }
    ]
  }
}