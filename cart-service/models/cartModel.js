const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String },
  image: { type: String },
  description: { type: String },
  quantity: { type: Number, default: 1, required: true },
  price: { type: Number, required: true } // Total = unitPrice * quantity (2 decimal places)
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [cartItemSchema]
});

module.exports = mongoose.model("Cart", cartSchema);
