const express = require("express");
const { 
  getProducts, 
  createProduct, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  deductStock,
  addStock,
  getLowStockProducts // Import the low stock function
} = require("../controllers/productController");

const router = express.Router();

// Move the /low-stock route to the top to avoid route conflicts
router.get("/low-stock", getLowStockProducts); // Fetch low stock products

// Other Product Routes
router.get("/", getProducts);  // List all products with filtering & sorting
router.post("/", createProduct);  // Create a new product
router.put("/deduct-stock", deductStock);  // Deduct stock
router.put("/add-stock", addStock);  // Add stock
router.get("/:id", getProductById);  // Get a single product by ID
router.put("/:id", updateProduct);  // Update product by ID
router.delete("/:id", deleteProduct);  // Delete product by ID

module.exports = router;
