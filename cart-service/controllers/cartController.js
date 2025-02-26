const Cart = require("../models/cartModel");
const axios = require("axios");

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

// Add product to cart
const addToCart = async (req, res) => {
  const userId = req.user.id; // Extracted from JWT
  const { productId } = req.body;

  try {
    // Step 1: Validate product via Product Service
    const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`);
    if (!productResponse.data) return res.status(404).json({ message: "Product not found" });

    // Step 2: Find or create cart for the user
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    // Step 3: Check if product already exists in cart
    const existingItem = cart.items.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ productId, quantity: 1 });
    }

    // Step 4: Save cart
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error adding to cart", error: error.message });
  }
};

// Get cart items
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    res.status(200).json(cart || { userId: req.user.id, items: [] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart", error: error.message });
  }
};

module.exports = { addToCart, getCart };
