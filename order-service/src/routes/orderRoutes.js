const express = require("express");
const { placeOrder ,getOrders ,placeSingleProductOrder} = require("../controllers/orderController");
const authenticateUser = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticateUser, placeOrder);
router.get("/", authenticateUser, getOrders); // ✅ Authenticated user can fetch their orders
router.post("/single", authenticateUser, placeSingleProductOrder);

module.exports = router;
