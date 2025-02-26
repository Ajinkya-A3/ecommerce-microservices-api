require("dotenv").config();
const express = require("express");
const mongoose = require("./config/db"); // Import DB connection
const cors = require("cors");
const bodyParser = require("body-parser");

const cartRoutes = require("./routes/cartRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/cart", cartRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Cart Service running on port ${PORT}`));
