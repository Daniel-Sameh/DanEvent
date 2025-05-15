const {Events, validateEvent} = require("../models/event");
const {Bookings} = require("../models/booking");
const {Users} = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
require("dotenv").config();
const debug = require("debug")("app:development");
const APIError = require("../shared/APIError");
const auth = require("../middlewares/auth");


router.use(express.json());
router.use(express.urlencoded({ extended: true }));
/**
 * User Routes
 * Handles user authentication, registration, and management
 * @module routers/users
 */

/**
 * POST /api/register
 * Registers a new user with hashed password
 * @route POST /api/register
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's password (will be hashed)
 */
// Register a new user
router.post("/register", async (req, res) => {
    const { name, password, email } = req.body;
    debug(req.body);
    // Validate the input
    if (!name || !password || !email) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // Check if the user already exists
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "this email already exists." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new Users({
            name,
            password: hashedPassword,
            email,
            isAdmin: false,
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


/**
 * POST /api/login
 * Authenticates user and returns JWT token
 * @route POST /api/login
 * @param {string} email - User's email address
 * @param {string} password - User's password
 */
// Login a user
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    debug(email, password);
    // Validate the input
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // Check if the user exists
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const token = user.generateAuthToken();

        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


/**
 * PATCH /api/users/:id/role
 * Toggles admin privileges for a user
 * @route PATCH /api/users/:id/role
 * @middleware auth(['admin']) - Requires admin privileges
 */
// Update user role with admin privileges
router.patch("/:id/role", auth(['admin']), async (req, res) => {
    try {
        // Check if the user exists
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        // Update the user role
        user.isAdmin = !user.isAdmin;
        await user.save();

        res.status(200).json({ message: "User role updated successfully." });
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


/**
 * GET /api/users
 * Retrieves all users (admin only)
 * @route GET /api/users
 * @middleware auth(['admin']) - Requires admin privileges
 */
// Get all users with admin privileges
router.get("/", auth(['admin']), async (req, res) => {
    try {
        const users = await Users.find();
        res.status(200).json(users);
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

module.exports = router;