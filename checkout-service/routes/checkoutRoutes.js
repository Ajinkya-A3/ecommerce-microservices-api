// routes/checkoutRoutes.js
const express = require("express");
const router = express.Router();
const { placeOrder, getOrders, placeSingleProductOrder , getAllOrdersPublic , updateShippingStatusPublic , getMonthlyStats} = require("../controllers/checkoutController");
const authenticate = require("../middleware/auth");

router.post("/", authenticate, placeOrder);
router.get("/", authenticate, getOrders);
router.post("/single", authenticate, placeSingleProductOrder);
router.get("/admin", getAllOrdersPublic);
router.patch("/update-shipping-status", updateShippingStatusPublic);
router.get("/monthly-stats", getMonthlyStats);


module.exports = router;
