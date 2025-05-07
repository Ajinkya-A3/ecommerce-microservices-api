// index.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const checkoutRoutes = require("./routes/checkoutRoutes");

dotenv.config();

const app = express();

// ✅ Allow all origins
app.use(cors());

app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use("/api/checkout", checkoutRoutes);

const PORT = process.env.PORT || 5009;
app.listen(PORT, () => console.log(`🚀 Checkout service running on port ${PORT}`));
