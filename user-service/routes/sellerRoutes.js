const express = require("express");
const { registerSeller } = require("../controllers/sellerController");

const router = express.Router();

router.post("/register", registerSeller);

module.exports = router;

