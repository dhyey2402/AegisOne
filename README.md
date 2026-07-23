# Insurance Management Platform

A production-ready Enterprise Insurance Management system, providing full lifecycle management of customers, policies, claims, and premium payments.

## Stack

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form + Zod
- Framer Motion
- Chart.js

### Backend
- Flask
- Flask Blueprints
- SQLAlchemy (PostgreSQL)
- Flask-Migrate
- Flask-JWT-Extended
- Flask-Bcrypt
- Marshmallow

## Getting Started

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. `pip install -r requirements.txt`
5. Configure `.env` with database URL and JWT secret
6. `flask db upgrade`
7. `flask run`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`
