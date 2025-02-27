const express = require('express');
const { createReview, getReviewsByProduct } = require('../controllers/reviewController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, createReview); // Create review (Protected)
router.get('/:productId', getReviewsByProduct); // Get reviews by product ID

module.exports = router;
