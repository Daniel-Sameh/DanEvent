const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("../config");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

/**
 * Event Schema - Defines the structure for event documents
 * @property {ObjectId} createdBy - Reference to the user who created the event
 * @property {String} name - Event name (indexed for faster queries)
 * @property {String} description - Detailed event description
 * @property {String} imageUrl - Optional URL for event image (must be HTTPS)
 * @property {Number} price - Event ticket price (must be non-negative)
 * @property {Date} date - Event date (indexed for faster queries)
 * @property {String} venue - Optional event location
 * @property {String} category - Event category for classification
 */
const EventSchema = new Schema({
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    name:{
        type: String,
        required: true,
        index: true,
    },
    description:{
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500,
    },
    imageUrl:{
        type: String,
        required: false,
        validate: {
            validator: function(v){
                const urlRegex = /^https:\/\/.+/i;
                return urlRegex.test(v);
            },
            message:"Invalid URL format"
        }
    },
    price:{
        type: Number,
        required: true,
        min: 0,
    },
    date:{
        type: Date,
        required: true,
        set: (date) => new Date(date),
        index: true,
    },
    venue:{
        type: String,
        required: false,
    },
    category:{
        type: String,
        required: true,
    },
});

// Compound index to ensure unique events (same name cannot occur on same date)
EventSchema.index({ name: 1, date: 1 }, { unique: true });

const Events = mongoose.model("Events", EventSchema);

/**
 * Validates a new event object against required schema
 * @param {Object} event - The event object to validate
 * @returns {Object} Validation result
 */
function validateEvent(event) {
    const schema = Joi.object({
        createdBy: Joi.objectId().required(),
        name: Joi.string().min(3).max(100).required(),
        description: Joi.string().min(10).max(500).required(),
        imageUrl: Joi.string().optional().pattern(/^https:\/\/.+/i),
        price: Joi.number().min(0).required(),
        date: Joi.date().required(),
        venue: Joi.string().optional(),
        category: Joi.string().required(),
    });
    return schema.validate(event, { abortEarly: false });
}

/**
 * Validates event update data, making all fields optional
 * @param {Object} event - The event update object to validate
 * @returns {Object} Validation result
 */
function validateEventUpdate(event) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).optional(),
        description: Joi.string().min(10).max(500).optional(),
        imageUrl: Joi.string().optional().pattern(/^https:\/\/.+/i),
        price: Joi.number().min(0).optional(),
        date: Joi.date().optional(),
        venue: Joi.string().optional(),
        category: Joi.string().optional(),
    });
    return schema.validate(event, { abortEarly: false });
}


exports.eventSchema = EventSchema;
exports.Events = Events;
exports.validateEvent = validateEvent;
exports.validateEventUpdate = validateEventUpdate;