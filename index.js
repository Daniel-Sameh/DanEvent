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


// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use('/', apiLimiter);
app.use('/', users);
app.use('/events', events);
app.use((req, res, next) => {
    if (req.path === '/favicon.ico') {
        res.status(204).end();
    } else {
        next();
    }
});
//Connecting to the database
config.connectToDatabase();

app.listen(config.PORT, () => {
  console.log(`Server listening at http://localhost:${config.PORT}`);
});
