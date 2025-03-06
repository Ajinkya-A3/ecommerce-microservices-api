const express = require("express");
const { placeOrder } = require("../controllers/orderController");
const authenticateUser = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateUser, placeOrder);

module.exports = router;
