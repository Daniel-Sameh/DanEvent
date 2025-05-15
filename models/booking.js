const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("../config");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

/**
 * Booking Schema - Defines the structure for booking documents
 * @property {ObjectId} userId - Reference to the user making the booking (indexed)
 * @property {ObjectId} eventId - Reference to the booked event
 * @property {Date} bookingDate - Date when booking was made (defaults to current date)
 * @property {String} status - Booking status (either "confirmed" or "cancelled")
 */
const BookingSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
        index: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Events",
        required: true,
    },
    bookingDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed",
    },
});

// Ensure one booking per user
BookingSchema.index({ userId: 1 }, { unique: true });

/**
 * Model for interacting with bookings collection
 */
const Bookings = mongoose.model("Bookings", BookingSchema);

/**
 * Validates booking data against required schema
 * @param {Object} booking - The booking object to validate
 * @returns {Object} Validation result
 */
function validateBooking(booking) {
    const schema = Joi.object({
        userId: Joi.objectId().required(),
        eventId: Joi.objectId().required(),
        bookingDate: Joi.date().optional(),
        status: Joi.string().valid("confirmed", "cancelled").optional(),
    });
    return schema.validate(booking, { abortEarly: false });
}

exports.bookingSchema = BookingSchema;
exports.Bookings = Bookings;
exports.validateBooking = validateBooking;