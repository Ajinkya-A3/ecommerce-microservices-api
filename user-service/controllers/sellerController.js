const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Seller registration (Only admin can create sellers)
const registerSeller = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Ensure only admin can create a seller
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required to register a seller" });
    }

    // Check if the email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Seller already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new seller
    user = new User({ name, email, password: hashedPassword, role: "seller" });
    await user.save();

    res.status(201).json({ message: "Seller registered successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { registerSeller };
