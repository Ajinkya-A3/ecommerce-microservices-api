import pickle
import os

class SentimentAnalyzer:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), "../models/sentiment_model.pkl")
        with open(model_path, "rb") as model_file:
            self.model = pickle.load(model_file)

    def predict(self, text):
        """Returns sentiment prediction for given text."""
        return self.model.predict([text])[0]
