const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    userName: { type: String, required: true },
    reviewText: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    sentiment: { 
        type: String, 
        enum: ["positive", "neutral", "negative"], 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
