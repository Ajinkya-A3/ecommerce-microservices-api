const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to check if user is authenticated
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decoded); // Debugging

      // Attach user data to request object
      req.user = { id: decoded.id, role: decoded.role };

      if (!req.user) {
        return res.status(401).json({ message: "User not found, unauthorized" });
      }

      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user?.role === "admin") {
    next();
  } else {
    console.error("Admin access denied:", req.user ? req.user.role : "No user found");
    return res.status(403).json({ message: "Admin access required" });
  }
};

// Middleware to check if user is a seller
const isSeller = (req, res, next) => {
  if (req.user?.role === "seller") {
    next();
  } else {
    console.error("Seller access denied:", req.user ? req.user.role : "No user found");
    return res.status(403).json({ message: "Seller access required" });
  }
};

module.exports = { protect, isAdmin, isSeller };
