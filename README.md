# DanEvent

Backend API server for event management with user authentication, booking, and image handling.

![npm](https://img.shields.io/npm/v/DanEvent.svg?logo=npm)
![](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen.svg?logo=node.js)
![](https://img.shields.io/badge/express-5.x-blue.svg?logo=express)
![](https://img.shields.io/badge/mongodb-8.x-green.svg?logo=mongodb)
![](https://img.shields.io/badge/redis-ioredis-red.svg?logo=redis)

DanEvent is a RESTful API backend built with Express and MongoDB. It provides endpoints for managing events, user accounts, and bookings, with features including pagination, filtering, Redis-based caching, JWT authentication, and Cloudinary-powered image uploads.

## Overview

DanEvent is a Node.js backend server that powers event management workflows. The application provides a complete API for creating, browsing, and booking events, alongside user registration and profile management. The entry point (`index.js`) initializes the Express server via `config.connectToDatabase()`, mounts middleware and routes, and starts listening on the configured port.

Key responsibilities include:

- **Event Management** — CRUD operations for events with filtering, pagination, and category browsing
- **User Management** — Registration, authentication, profile management, and role-based access control
- **Booking System** — Event booking with confirmation status and duplicate prevention
- **Image Handling** — Profile and event image uploads through Cloudinary
- **Caching Layer** — Redis-based response caching to reduce database load

### Architecture

The application follows a modular structure:

| Directory | Purpose |
|-----------|---------|
| `config/` | Service configurations (Cloudinary) |
| `middlewares/` | Authentication, caching, and file upload middleware |
| `models/` | Mongoose schemas for Event, User, and Booking |
| `routers/` | Express route handlers for API endpoints |
| `services/` | CloudinaryService singleton for image operations |
| `shared/` | Shared utilities (APIError class) |
| `utils/` | Redis client initialization |

Routes are mounted under two base paths:
- **`/api`** — User-related endpoints (registration, login, profile, role management)
- **`/api/events`** — Event and booking endpoints

## Features

- **JWT Authentication** — Token-based authentication with role-based access control (admin/user roles)
- **Event CRUD** — Create, read, update, and delete events; write operations restricted to admin users
- **Pagination & Filtering** — Query events by page, category, date range, and booking status
- **Booking Management** — Book events with confirmation status and duplicate booking prevention
- **Redis Caching** — Response caching with configurable TTL for events, users, bookings, and categories
- **Cloudinary Image Upload** — Base64 data URI upload for profile and event images via a singleton service
- **User Role Management** — Admin role toggling and admin-only user management endpoints
- **Standardized Error Handling** — Consistent error responses through the `APIError` class with status, title, and message serialization

## Requirements

- Node.js 18 or higher
- MongoDB instance (local or hosted)
- Redis instance
- Cloudinary account (for image upload features)

## Installation

```bash
# Clone the repository
git clone https://github.com/Daniel-Sameh/DanEvent.git
cd DanEvent

# Install dependencies
npm install
```

### Environment Configuration

The application requires configuration for the following services:

| Service | Purpose |
|---------|---------|
| MongoDB | Primary database for events, users, and bookings |
| Redis | Response caching layer (`utils/redis.js` connects using environment-based configuration) |
| Cloudinary | Image upload and storage (`config/cloudinary.js`) |
| JWT Secret | Token signing for authentication |

Set the appropriate environment variables (e.g., via a `.env` file or environment configuration) for the MongoDB connection, Redis host, Cloudinary credentials, JWT secret, and server port.

## Quick Start

```bash
# Start the server
npm start
```

The server initializes the database connection via `config.connectToDatabase()` and begins listening on the configured port. Verify the server is running by fetching event categories:

```bash
curl http://localhost:{PORT}/api/events/categories
# Returns a JSON array of category strings
```

## Usage

### Register a User

```bash
curl -X POST http://localhost:{PORT}/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "password": "securePass123"}'
```

### Login and Obtain a JWT Token

```bash
curl -X POST http://localhost:{PORT}/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com", "password": "securePass123"}'
# Returns a JWT token for authenticated requests
```

### Retrieve Events with Pagination and Filtering

```bash
# Paginated event listing
curl "http://localhost:{PORT}/api/events?page=1&limit=10"

# Filter by category
curl "http://localhost:{PORT}/api/events?category=concerts"

# Filter by date range
curl "http://localhost:{PORT}/api/events?startDate=2024-01-01&endDate=2024-12-31"
```

### Book an Event (Authenticated)

```bash
curl -X POST http://localhost:{PORT}/api/events/book/{eventId} \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Access Admin-Only Endpoints

The authentication middleware supports role-based access. Pass the allowed roles as an array:

```javascript
const { auth } = require('./middlewares/auth');

// Admin-only route
router.delete('/:id', auth(['admin']), async (req, res) => { ... });

// Any authenticated user
router.get('/account', auth(), async (req, res) => { ... });
```

## Additional Documentation

- [API Documentation](api_documentation.yaml) - Generated API reference with endpoint schemas and request/response details