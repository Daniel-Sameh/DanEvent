const mongoose = require("mongoose");
const Joi = require("joi");
// const APIError = require("../shared/APIError");
const config = require("../config");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

/**
 * User Schema - Defines the structure for user documents
 * @property {String} name - User's full name
 * @property {String} email - Unique email address (indexed)
 * @property {String} password - Hashed password (min 6 characters)
 * @property {Boolean} isAdmin - User role flag (indexed)
 */
const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function(v){
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(v);
            },
            message:"Invalid email format"
        },
        index : true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    isAdmin: {
        type: Boolean,
        default: false,
        index: true,
    },
});

// Ensure email uniqueness
UserSchema.index({ email: 1 }, { unique: true });

/**
 * Generates a JWT token for user authentication
 * @returns {String} JWT token containing user information
 */
UserSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({
        _id: this._id,
        name: this.name,
        email: this.email,
        isAdmin: this.isAdmin,
        role: this.isAdmin ? "admin" : "user",
    }, process.env.JWT_SECRET, {
        expiresIn: "24h",
    });
    return token;
}

// UserSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

const Users = mongoose.model("Users", UserSchema);

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(1024).required(),
        isAdmin: Joi.boolean().optional(),
    });
    return schema.validate(user, { abortEarly: false });
}

exports.userSchema = UserSchema;
exports.Users = Users;
exports.validateUser = validateUser;