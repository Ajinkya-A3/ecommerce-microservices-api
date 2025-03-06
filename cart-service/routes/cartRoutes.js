const express = require("express");
const { addToCart, getCart ,removeFromCart, updateCartQuantity, clearCart, removeOrderedItems} = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.delete("/remove/:productId", authMiddleware, removeFromCart);
router.put("/update/:productId", authMiddleware, updateCartQuantity);
router.delete("/clear", authMiddleware, clearCart);
router.put("/remove-items/:userId", removeOrderedItems);

module.exports = router;
