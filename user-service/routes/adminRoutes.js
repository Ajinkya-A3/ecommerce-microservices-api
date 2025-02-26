const express = require("express");
const { createAdminUser } = require("../controllers/adminController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

//  Route to create a new admin (only accessible by an existing admin)
router.post("/create-admin", protect, isAdmin, createAdminUser);

module.exports = router;
