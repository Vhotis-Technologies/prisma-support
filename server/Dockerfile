FROM python:3.12-slim

# Set the environment variable
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONHASHSEED=random

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=prisma.settings

EXPOSE 8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "prisma.asgi:application"]
