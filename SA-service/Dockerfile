# --- Stage 1: Build Stage ---
    FROM python:3.10-slim as builder

    # Set working directory
    WORKDIR /app
    
    # Install build dependencies (if you had C extensions)
    RUN apt-get update && apt-get install -y --no-install-recommends gcc
    
    # Copy requirement files and install packages into /install
    COPY requirements.txt .
    RUN pip install --user --no-cache-dir -r requirements.txt
    
    # --- Stage 2: Final Image ---
    FROM python:3.10-slim
    
    # Set working directory
    WORKDIR /app
    
    # Copy only what we need: app files
    COPY --from=builder /root/.local /root/.local
    COPY . .
    
    # Set environment variables
    ENV PATH=/root/.local/bin:$PATH
    ENV PYTHONUNBUFFERED=1
    ENV FLASK_APP=run.py
    
    # Expose the port your Flask app runs on
    EXPOSE 3000
    
    # Command to run the app
    CMD ["python", "run.py"]
    