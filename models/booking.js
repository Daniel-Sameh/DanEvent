const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("../config");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

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

BookingSchema.index({ userId: 1 }, { unique: true });

const Bookings = mongoose.model("Bookings", BookingSchema);
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