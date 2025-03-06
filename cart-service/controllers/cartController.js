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

//  Remove Product from Cart
const removeFromCart = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item => item.productId !== productId);
    await cart.save();

    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Error removing product", error: error.message });
  }
};

// ✅ Update Quantity in Cart
const updateCartQuantity = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity <= 0) return res.status(400).json({ message: "Quantity must be greater than 0" });

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(item => item.productId === productId);
    if (!item) return res.status(404).json({ message: "Product not in cart" });

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ message: "Cart updated", cart });
  } catch (error) {
    res.status(500).json({ message: "Error updating cart", error: error.message });
  }
};


// Clear Entire Cart
const clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing cart", error: error.message });
  }
};


//  Remove Ordered Items from User's Cart
const removeOrderedItems = async (req, res) => {
  const { userId } = req.params; // Extract userId from request params
  const { orderedItems } = req.body; // Array of ordered product IDs

  if (!orderedItems || !Array.isArray(orderedItems)) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Remove ordered products from cart
    cart.items = cart.items.filter(item => !orderedItems.includes(item.productId));

    await cart.save();

    res.status(200).json({ message: "Ordered items removed", cart });
  } catch (error) {
    res.status(500).json({ message: "Error removing ordered items", error: error.message });
  }
};

module.exports = { addToCart, getCart ,removeFromCart, updateCartQuantity, clearCart, removeOrderedItems };
