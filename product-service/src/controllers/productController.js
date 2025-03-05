const Product = require("../models/productModel");


// @desc Get all products with filtering & sorting
exports.getProducts = async (req, res) => {
  try {
    let { name, category, brand, minPrice, maxPrice, sortBy, order } = req.query;
    let filter = {};

    if (name) filter.name = new RegExp(name, "i");  // Case-insensitive search
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    let sort = {};
    if (sortBy) {
      order = order === "desc" ? -1 : 1;
      sort[sortBy] = order;
    }

    const products = await Product.find(filter).sort(sort);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
};

// @desc Create new product
exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: "Error creating product", error });
  }
};

// @desc Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// @desc Update product
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error });
  }
};

// @desc Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
};


// Deduct stock quantity when a product is purchased
exports.deductStock = async (req, res) => {
  try {
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
          return res.status(400).json({ error: "Invalid product ID or quantity" });
      }

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      if (product.stock_quantity < quantity) {
          return res.status(400).json({ error: "Insufficient stock" });
      }

      product.stock_quantity -= quantity;
      await product.save();

      res.json({ message: "Stock deducted successfully", product });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

// Add stock to the product inventory
exports.addStock = async (req, res) => {
  try {
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
          return res.status(400).json({ error: "Invalid product ID or quantity" });
      }

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      product.stock_quantity += quantity;
      await product.save();

      res.json({ message: "Stock added successfully", product });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};


