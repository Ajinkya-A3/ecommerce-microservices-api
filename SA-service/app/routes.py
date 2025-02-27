from flask import Blueprint, request, jsonify
from app.sentiment_model import SentimentAnalyzer

# Blueprint for modular API structure
sentiment_bp = Blueprint("sentiment", __name__)

# Load the sentiment analyzer
sentiment_analyzer = SentimentAnalyzer()

@sentiment_bp.route("/predict", methods=["POST"])
def predict_sentiment():
    """API to predict sentiment from review text."""
    data = request.get_json()
    if not data or "review" not in data:
        return jsonify({"error": "Missing 'review' field"}), 400

    review_text = data["review"]
    sentiment = sentiment_analyzer.predict(review_text)

    return jsonify({"review": review_text, "sentiment": sentiment})

@sentiment_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "OK"})
