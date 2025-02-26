const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String },
  stock_quantity: { type: Number, required: true },
  image_url: { type: String }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
