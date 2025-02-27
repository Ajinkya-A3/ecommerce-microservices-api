from flask import Flask
from app.routes import sentiment_bp

app = Flask(__name__)

# Register blueprint
app.register_blueprint(sentiment_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)
