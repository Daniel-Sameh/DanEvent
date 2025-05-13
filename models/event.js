const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("../config");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    name:{
        type: String,
        required: true,
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

const Events = mongoose.model("Events", EventSchema);
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

exports.eventSchema = EventSchema;
exports.Events = Events;
exports.validateEvent = validateEvent;