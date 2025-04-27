To test the Reviews Microservice API in Postman, follow these steps:

✅ 1. Start the Microservices
Ensure your services are running:

User Service (USER_SERVICE_URL=http://localhost:5001)

Sentiment Analysis Service (SENTIMENT_SERVICE_URL=http://localhost:5005)

Reviews Microservice (http://localhost:5004)

Run the Reviews Microservice:

sh
Copy
Edit
node server.js
✅ 2. Generate a JWT Token
If you don't have a JWT token, you can create one manually using an online tool like jwt.io or by running:

javascript
Copy
Edit
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: "67bf2abebe7290c357decd0d", role: "customer" }, "your_secret_key", { expiresIn: "7d" });
console.log(token);
Copy this JWT token for authorization.

✅ 3. Create a Review (POST Request)
Method: POST
URL: http://localhost:5004/api/reviews
Headers:

pgsql
Copy
Edit
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
Body (JSON):

json
Copy
Edit
{
    "productId": "123456",
    "reviewText": "This product is amazing!",
    "rating": 5
}
🔹 What Happens?

The JWT token is decoded to get userId.

The service calls User Service to fetch the username.

The Sentiment Analysis Service determines the sentiment.

The review is stored in MongoDB.

✅ 4. Get Reviews for a Product (GET Request)
Method: GET
URL:

bash
Copy
Edit
http://localhost:5004/api/reviews/123456
🔹 Expected Response (JSON):

json
Copy
Edit
[
    {
        "_id": "65fe3b...",
        "productId": "123456",
        "userName": "John Doe",
        "reviewText": "This product is amazing!",
        "rating": 5,
        "sentiment": "positive",
        "createdAt": "2025-02-27T12:34:56.789Z"
    }
]