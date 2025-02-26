const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Create Admin (Only an existing admin can create a new one)
const createAdminUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if requester is an admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check if the email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    user = new User({ name, email, password: hashedPassword, role: "admin" });
    await user.save();

    res.status(201).json({ message: "Admin created successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createAdminUser };
