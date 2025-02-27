const express = require("express");
const { registerUser, loginUser, getCurrentUser} = require("../controllers/userController");
const { getUserById } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/user", protect, getCurrentUser);
router.get("/:id", getUserById);


module.exports = router;
