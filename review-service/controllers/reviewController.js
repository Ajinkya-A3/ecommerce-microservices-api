const Review = require('../models/Review');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const SENTIMENT_SERVICE_URL = process.env.SENTIMENT_SERVICE_URL;

// Create a new review
const createReview = async (req, res) => {
    try {
        const { productId, reviewText, rating } = req.body;
        const userId = req.user.id; // Extracted from JWT

        // Fetch user name from User Service
        const userResponse = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
        const userName = userResponse.data.name;

        // Get sentiment analysis
        const sentimentResponse = await axios.post(`${SENTIMENT_SERVICE_URL}/predict`, { review: reviewText });
        const sentiment = sentimentResponse.data.sentiment; // Extract sentiment from response

        // Save review in DB
        const newReview = new Review({
            productId,
            userName,
            reviewText,
            rating,
            sentiment
        });

        await newReview.save();
        res.status(201).json({ message: 'Review added successfully', review: newReview });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get reviews for a product
const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId });
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createReview, getReviewsByProduct };
