# What is a Dockerfile?
# Think of it as a recipe. Railway reads this and builds
# a container (a mini computer) that runs your Python app.

# Start with a Python 3.12 base image
FROM python:3.12-slim

# Install system dependencies Playwright needs to run Chromium
# These are like prerequisites — Chromium won't work without them
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy requirements first (Docker caches this layer — speeds up rebuilds)
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright's Chromium browser
# This is the actual browser that will do the scraping
RUN playwright install chromium

# Copy the rest of the code
COPY . .

# Tell Railway what port to listen on
EXPOSE 8000

# Start the server
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
