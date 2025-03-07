const express = require("express");
const { placeOrder ,getOrders } = require("../controllers/orderController");
const authenticateUser = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateUser, placeOrder);
router.get("/", authenticateUser, getOrders); // ✅ Authenticated user can fetch their orders

module.exports = router;
