const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const orderRoutes = require("./src/routes/orderRoutes");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB().catch((error) => {
    console.error("❌ Database Connection Failed:", error.message);
    process.exit(1); // Exit if DB connection fails
});

// Initialize Express App
const app = express();

// ✅ Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json({ limit: "10mb", strict: false })); // Prevent empty JSON errors

// ✅ Routes
app.use("/api/orders", orderRoutes);

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Internal Server Error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log(`🚀 Order Service running on port ${PORT}`));
