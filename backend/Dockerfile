FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run database migrations and seed data on startup, then start server
CMD ["sh", "-c", "flask db upgrade && python seed.py && gunicorn -w 4 -b 0.0.0.0:5000 app:app"]
