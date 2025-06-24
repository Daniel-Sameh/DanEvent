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
const upload = require('../middlewares/upload');
const cache = require('../middlewares/cache');
const redis = require('../utils/redis');
const cloudinaryService = require('../services/cloudinaryService');

const dummyHash = '$2b$10$invalidDummyHashUsedForTimingEqualization12345678901234567890';

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
        let newUser = new Users({
            name,
            password: hashedPassword,
            email,
            isAdmin: false,
        });

        await newUser.save();
        await redis.del('users:all');
        
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
            await bcrypt.compare(password, dummyHash); // Timing attack mitigation
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
 * POST /api/profile-image
 * Uploads a profile image for the logged-in user
 * @route POST /api/profile-image
 * @middleware auth() - Requires the user to be logged in
 * @param {file} profileImage - The profile image file to upload
 * @returns {Object} 200 - Success message with image URL
 * @returns {Object} 400 - If the file is not an image or exceeds the size limit
 * @returns {Object} 500 - On internal server error
 */
router.post("/upload/profile-image", auth(), upload.profile, async (req, res) => {
    try{
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No image provided" });
        }
        
        const imageUrl = await cloudinaryService.uploadImage(req.files[0]);
        
        // Update user profile with image URL
        const user = await Users.findByIdAndUpdate(
            req.user._id,
            { profileImageUrl: imageUrl },
            { new: true }
        ).select('-password');
        
        await redis.del(`user:${req.user._id}`);
        await redis.del('users:all');
        
        res.status(200).json({ 
            message: "Profile image updated successfully",
            profileImageUrl: imageUrl
        }); 
    }catch (error) {
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
        await redis.del('users:all');

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
        const usersData = await cache('users:all', 120, async () => {
            const users = await Users.find().select('-password'); // exclude password
            return users;
        });

        if (!usersData.data) {
            return res.status(404).json({ message: "No users found." });
        }
        
        res.status(200).json(usersData.data);
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


/**
 * GET /api/users/:id
 * Retrieves the profile of a user by ID.
 * Uses Redis caching to optimize performance and reduce database load.
 *
 * @route GET /api/users/:id
 * @middleware auth() - Requires the user to be logged in (any role)
 * @returns {Object} 200 - User profile data excluding password
 * @returns {Object} 404 - If the user is not found
 * @returns {Object} 500 - On internal server error
 *
 */
router.get("/account", auth(), async (req, res) => {
    try {
        const userId = req.user._id;
        const cacheKey = `user:${userId}`;

        const userData = await cache(cacheKey, 120, async () => {
            return await Users.findById(userId).select("-password");
        });

        if (!userData.data) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json(userData.data);
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

/** 
 * PATCH /api/users/
 * Updates the profile of the logged-in user.
 * Uses Redis caching to optimize performance and reduce database load.
 * @route PATCH /api/users/
 * @middleware auth() - Requires the user to be logged in (any role)
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - If required fields are missing
 * @returns {Object} 404 - If the user is not found
*/
router.put("/", auth(), upload.profile, async (req, res) => {
    const updatedFields = req.body;
    const userId = req.user._id;

    try {
        // Check if the user exists
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Define fields that should NOT be updated
        const restrictedFields = ['_id', 'isAdmin', '__v'];

        // Special handling for password
        if (updatedFields.password) {
            const salt = await bcrypt.genSalt(10);
            updatedFields.password = await bcrypt.hash(updatedFields.password, salt);
        }

        // Update all fields except restricted ones
        Object.keys(updatedFields).forEach(field => {
            if (!restrictedFields.includes(field)) {
                user[field] = updatedFields[field];
            }
        });

        // Handle image upload if a new file is provided
        if (req.files.file && req.files.file[0]) {
            try {
                const imageUrl = await cloudinaryService.uploadImage(req.files.file[0]);
                user.profileImageUrl = imageUrl;
            } catch (uploadError) {
                return res.status(400).json({ message: "Error uploading image" });
            }
        }
        
        await user.save();
        await redis.del(`user:${userId}`);
        await redis.del('users:all');

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({ 
            message: "User profile updated successfully.",
            user: userResponse
        });
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


module.exports = router;