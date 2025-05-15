const express = require('express');
const app = express();
const config = require('./config'); //my config file
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const debug = require("debug")("app:development");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const users = require('./routers/users');
const events = require('./routers/events');

app.set('trust proxy', 1); // Trust first proxy - required for rate limiting on Vercel
app.enable('trust proxy'); // Required for rate limiting behind reverse proxies

app.use(cors());
app.use(helmet()); // Set security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.log(`This request[${key}] has been sanitized`, req);
  }
}));*/ // Prevent NoSQL injection


// Configure rate limiting middleware to prevent abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100,                  // Maximum 100 requests per IP within the window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,     // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,      // Disable the `X-RateLimit-*` headers
    trustProxy: true,          // Trust the X-Forwarded-For header for IP detection
    skipFailedRequests: true   // Failed requests won't count against the rate limit
});

// Apply middleware and route handlers
app.use('/api', apiLimiter);           // Apply rate limiting to all API routes
app.use('/api', users);                // Mount user-related routes
app.use('/api/events', events);        // Mount event-related routes

// Handle favicon requests to prevent unnecessary processing
app.use((req, res, next) => {
    if (req.path === '/favicon.ico') {
        res.status(204).end();         // Return empty response for favicon requests
    } else {
        next();                        // Continue to next middleware for other requests
    }
});

//Connecting to the database
config.connectToDatabase();

// Start the server and listen for incoming requests
app.listen(config.PORT, () => {
    console.log(`Server listening at http://localhost:${config.PORT}`);
});
