FROM python:3.11-slim

# System deps for librosa/audio + ffmpeg for video
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . /app

# Expose port (Render provides $PORT, but EXPOSE is fine)
EXPOSE 5000

# Run
CMD ["bash", "-lc", "gunicorn -b 0.0.0.0:${PORT:-5000} app:app"]
