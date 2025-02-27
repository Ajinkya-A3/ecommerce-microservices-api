const express = require("express");
const { registerUser, loginUser, getCurrentUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/user", protect, getCurrentUser);

module.exports = router;
