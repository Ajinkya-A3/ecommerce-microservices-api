const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const orderRoutes = require("./src/routes/orderRoutes");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log(`🚀 Order Service running on port ${PORT}`));
