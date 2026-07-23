# Project Requirements

## Core Architecture
- Clean Architecture principles.
- Thin controllers, business logic in services.
- Database access through SQLAlchemy ORM.
- Centralized error handling and logging.

## Security Requirements
- Passwords must be hashed using Bcrypt.
- All API endpoints (except login/register) must be protected with JWT Authentication.
- Role-based Access Control (RBAC) middleware must restrict actions (e.g. only Admin can approve claims).
- File uploads must validate MIME type, file extension, and file size to prevent malicious uploads.
- Secure filename generation.

## Frontend Requirements
- Responsive design using Tailwind CSS.
- Reusable UI components (Modals, Tables, Forms, Buttons, Inputs, Badges).
- Real-time form validation using React Hook Form + Zod.
- Loading states and skeletons for async operations.
- Global Toast notifications for feedback (Success, Error).
- Dark Mode toggle support.

## Backend APIs
- RESTful standards (Proper use of GET, POST, PUT, DELETE).
- JSON responses with consistent wrappers `{"status": "success|error", "data": {...}, "message": "..."}`.
- Pagination endpoints (`page`, `limit` query parameters).
- Filtering and search parameters.

## External Libraries
- Backend: Flask, SQLAlchemy, Marshmallow, Flask-JWT-Extended, Flask-Migrate, Werkzeug.
- Frontend: React Router, Axios, Framer Motion, Chart.js, Lucide React, Tailwind CSS.
