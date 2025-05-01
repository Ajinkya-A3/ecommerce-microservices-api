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
  const { userId } = req.params;
  const { orderedItems, quantity } = req.body;

  console.log("Received userId:", userId);
  console.log("Received orderedItems:", orderedItems);
  console.log("Received quantity:", quantity);

  // ✅ Ensure orderedItems exists and is an array, and quantity is a valid number
  if (!orderedItems || !Array.isArray(orderedItems) || !quantity || typeof quantity !== "number") {
      console.log("Invalid request body:", req.body);
      return res.status(400).json({ message: "Invalid request data: orderedItems must be an array and quantity must be a number" });
  }

  try {
      let cart = await Cart.findOne({ userId });

      if (!cart) return res.status(404).json({ message: "Cart not found" });

      // ✅ Remove items based on quantity
      cart.items = cart.items.map(item => {
          if (orderedItems.includes(item.productId)) {
              if (item.quantity > quantity) {
                  // Reduce the quantity
                  item.quantity -= quantity;
                  return item;
              } else {
                  // Remove item if quantity is equal or less
                  return null;
              }
          }
          return item;
      }).filter(Boolean); // Remove null values (fully removed items)

      await cart.save();

      res.status(200).json({ message: "Ordered items updated", cart });
  } catch (error) {
      res.status(500).json({ message: "Error updating cart", error: error.message });
  }
};

const removeSingleProduct = async (req, res) => {
  const userId = req.user.id; // Extracted from JWT by auth middleware
  const { productId } = req.params;

  try {
      const cart = await Cart.findOne({ userId });

      if (!cart) {
          return res.status(404).json({ message: "Cart not found" });
      }

      const originalLength = cart.items.length;

      // Remove item from cart
      cart.items = cart.items.filter(item => item.productId !== productId);

      if (cart.items.length === originalLength) {
          return res.status(404).json({ message: "Product not found in cart" });
      }

      await cart.save();

      res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
      res.status(500).json({ message: "Failed to remove product", error: error.message });
  }
};

module.exports = { addToCart, getCart ,removeFromCart, updateCartQuantity, clearCart, removeOrderedItems , removeSingleProduct };
