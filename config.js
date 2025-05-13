const express = require('express');

const mongoose = require('mongoose');

require('dotenv').config();
const APP_NAME = "DanEvents API";
const ENV = process.env.NODE_ENV;
const PORT = process.env.PORT || 8080;
const debug = require("debug")(`app:${ENV}`);
debug("Debugging enabled");
// console.log(process.env.MONGODB_URI);

/**
 * Connect to mongoose asynchronously or bail out if it fails
 */
async function connectToDatabase() {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://mongodb/";

  mongoose.Promise = Promise;
  if (ENV === "development" || ENV === "test") {
    mongoose.set("debug", true);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
       autoIndex: true,
       
    });
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(`${APP_NAME} successfully connected to database.`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

/**
 * Configuration middleware to enable cors and set some other allowed headers.
 *  You can also just use the 'cors' package.
 */
function globalResponseHeaders(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization"
  );
  response.header(
    "Access-Control-Allow-Methods",
    "POST,GET,PATCH,DELETE,OPTIONS"
  );
  response.header("Content-Type", "application/json");
  return next();
}

module.exports = {
  APP_NAME,
  ENV,
  PORT,
  connectToDatabase,
  globalResponseHeaders,
};