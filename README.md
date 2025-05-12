# 🎉 DanEvent Backend API

DanEvent is a backend API designed to manage events, user registrations, bookings, and role-based access control. This project is built using Node.js, Express, and MongoDB, with a focus on security, scalability, and maintainability.

## ✨ Features

- 👥 **User Management**: Register, login, and manage user roles (admin/user).
- 📅 **Event Management**: Create, update, delete, and fetch events with pagination.
- 🎫 **Booking System**: Book events and view user-specific bookings.
- 🔒 **Role-Based Access Control**: Admins can manage events and user roles.
- 🛡️ **Security**: Implements JWT authentication, rate limiting, input sanitization, and secure headers.
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

- **PATCH** `/api/:id/role`  
  Toggle user role between admin and user (Admin only).

---

### 📅 **Events**

- **GET** `/api/events`  
  Fetch all events with pagination.  
  **Query Params**: `page`, `limit`

- **GET** `/api/events/:id`  
  Fetch a single event by ID.

- **POST** `/api/events`  
  Create a new event (Admin only).  
  **Body**: `{ name, description, price, date, category, ... }`

- **PUT** `/api/events/:id`  
  Update an event by ID (Admin only).

- **DELETE** `/api/events/:id`  
  Delete an event by ID (Admin only).

---

### 🎫 **Bookings**

- **GET** `/api/events/bookings`  
  Fetch all bookings for the authenticated user.

- **POST** `/api/events/book/:id`  
  Book an event by ID.

---

## 🔧 Middleware

- **Authentication**: JWT-based authentication with role-based access control.
- **Rate Limiting**: Limits requests to prevent abuse.
- **Input Sanitization**: Protects against NoSQL injection.
- **Secure Headers**: Uses Helmet to set HTTP headers.

---

## 📁 Project Structure

```
danEvent/
├── models/          # Mongoose schemas and validation logic
├── routers/         # API route handlers
├── middlewares/     # Custom middleware (e.g., auth)
├── shared/          # Shared utilities (e.g., APIError)
├── index.js         # Entry point of the application
├── config.js        # Configuration and database connection
├── package.json     # Project metadata and dependencies
└── README.md        # Project documentation
```

---

## 🛠️ Technologies Used

- **Node.js**: Backend runtime.
- **Express**: Web framework.
- **MongoDB**: NoSQL database.
- **Mongoose**: MongoDB object modeling.
- **Joi**: Input validation.
- **JWT**: Authentication.
- **Helmet**: Security headers.
- **Rate Limiting**: Prevents abuse.
- **dotenv**: Environment variable management.

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

