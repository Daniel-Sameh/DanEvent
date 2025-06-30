# 🎉 DanEvent Backend API

DanEvent is a backend API designed to manage events, user registrations, bookings, and role-based access control. This project is built using Node.js, Express, and MongoDB, with a focus on security, scalability, and maintainability.

## ✨ Features

- 👥 **User Management**: Register, login, and manage user roles (admin/user).
- 📅 **Event Management**: Create, update, delete, and fetch events with pagination.
- 🎫 **Booking System**: Book events and view user-specific bookings.
- 🔒 **Role-Based Access Control**: Admins can manage events and user roles.
- 🛡️ **Security**: Implements JWT authentication, rate limiting, input sanitization, and secure headers.
- 🚀 **Redis Caching**: Implemented Redis caching through Upstash, reducing response time from 600ms to 200ms (3x performance improvement).
- ✅ **Validation**: Input validation using Joi.
- ⚠️ **Error Handling**: Centralized error handling with custom APIError class.

---

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd danEvent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure the following variables:
   ```env
   NODE_ENV=development
   PORT=8080
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   REDIS_HOST=<your-upstash-redis-url>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. For development, use:
   ```bash
   npm run dev
   ```

---

## 🔌 API Endpoints

### 🔐 **Authentication**

- **POST** `/api/register`  
  Register a new user.  
  **Body**: `{ name, email, password }`

- **POST** `/api/login`  
  Login and receive a JWT token.  
  **Body**: `{ email, password }`

---

### 👥 **Users**

- **GET** `/api/`  
  Get all users (Admin only).

- **GET** `/api/account`  
  Get the profile of the authenticated user.

- **PUT** `/api/`  
  Update the authenticated user's profile.  
  **Body**: Various user profile fields

- **POST** `/api/upload/profile-image`  
  Upload a profile image for the authenticated user.  
  **Body**: Form data with profile image

- **PATCH** `/api/:id/role`  
  Toggle user role between admin and user (Admin only).

---

### 📅 **Events**

- **GET** `/api/events`  
  Fetch all events with pagination, filtering and sorting.  
  **Query Params**: 
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
  - `category`: Filter events by category
  - `startDate`: Filter events starting from this date (format: YYYY-MM-DD)
  - `endDate`: Filter events until this date (format: YYYY-MM-DD)
  - `sort`: Sort by date ('asc' or 'desc', default: 'asc')
  - `booked`: Filter by booking status ('true', 'false', or 'all')

- **GET** `/api/events/:id`  
  Fetch a single event by ID.

- **GET** `/api/events/bookings`  
  Fetch all bookings for the authenticated user.

- **POST** `/api/events`  
  Create a new event (Admin only).  
  **Body**: `{ name, description, price, date, category, venue, file(image) }`

- **POST** `/api/events/book/:id`  
  Book an event by ID for the authenticated user.

- **PUT** `/api/events/:id`  
  Update an event by ID (Admin only).  
  **Body**: Any of `{ name, description, price, date, category, venue, file(image) }`

- **DELETE** `/api/events/:id`  
  Delete an event by ID (Admin only).

---

### 🎫 **Bookings**

- **GET** `/api/events/bookings`  
  Fetch all bookings for the authenticated user.

- **POST** `/api/events/book/:id`  
  Book an event by ID for the authenticated user.

---

## 🔧 Middleware

- **Authentication**: JWT-based authentication with role-based access control.
- **Rate Limiting**: Limits requests to prevent abuse.
- **Input Sanitization**: Protects against NoSQL injection.
- **Secure Headers**: Uses Helmet to set HTTP headers.
- **Caching**: Redis-based caching middleware for improved performance.
- **File Upload**: Multer middleware for handling file uploads.

---

## 🚀 Performance Optimization

### Redis Caching Implementation

This project implements Redis caching through Upstash to dramatically improve response times:

- **Performance Boost**: Response times reduced from 600ms to 200ms (3x improvement).
- **Cached Endpoints**: 
  - Event listings with pagination
  - Individual event details
  - User bookings
  - User profiles
- **Cache Invalidation**: Automatic cache clearing on data updates to ensure fresh content.

The caching system is designed with TTL (Time-To-Live) values optimized for each endpoint's specific needs, balancing between performance and data freshness.

Future performance improvements are planned, including:
- Further optimization of cache TTL values
- Implementation of batch operations
- Query optimization for MongoDB
- Potential migration to serverless functions for specific high-traffic endpoints

---

## 📁 Project Structure

```
danEvent/
├── models/          # Mongoose schemas and validation logic
├── routers/         # API route handlers
├── middlewares/     # Custom middleware (e.g., auth, cache)
├── services/        # External service integrations (e.g., cloudinary)
├── utils/           # Utility functions (e.g., redis)
├── config/          # Configuration modules (e.g., cloudinary)
├── shared/          # Shared utilities (e.g., APIError)
├── docs/            # API documentation
├── index.js         # Entry point of the application
├── config.js        # Configuration and database connection
├── package.json     # Project metadata and dependencies
├── vercel.json      # Vercel deployment configuration
└── README.md        # Project documentation
```

---

## 🛠️ Technologies Used

- **Node.js**: Backend runtime.
- **Express**: Web framework.
- **MongoDB**: NoSQL database.
- **Mongoose**: MongoDB object modeling.
- **Redis**: High-performance caching via Upstash, reducing response times by 3x.
- **Joi**: Input validation.
- **JWT**: Authentication.
- **Helmet**: Security headers.
- **Rate Limiting**: Prevents abuse.
- **dotenv**: Environment variable management.
- **Multer**: File upload handling.
- **Cloudinary**: Cloud storage for images.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

---

## 📄 License

This project is licensed under the ISC License. See the `LICENSE` file for details.

---

## 📬 Contact

For any inquiries or support, please contact the author: **DanielSameh** 📧

