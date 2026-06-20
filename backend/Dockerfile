# Use official thin Python image as base
FROM python:3.10-slim

# Set environment variables to optimize Python within Docker container
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (curl for healthcheck, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project files
COPY . /app/

# Expose port 8002 for the application
EXPOSE 8002

# Run migrations and start the Django server on port 8002
# We use python manage.py runserver for development/hosting simplicity,
# but we also install gunicorn so you can switch to gunicorn easily if needed.
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8002"]
