const {Events, validateEvent} = require("../models/event");
const {Bookings} = require("../models/booking");
const {Users} = require("../models/user");
const express = require("express");
const router = express.Router();
// const bcrypt = require("bcrypt");
require("dotenv").config();
const debug = require("debug")("app:dev");
// const APIError = require("../shared/APIError");
const auth = require("../middlewares/auth");
const c = require("config");


router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Get Requests:

// Get all events with pagination
// Example: GET /api/events?page=2&limit=5
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get page number, default to 1
        const limit = parseInt(req.query.limit) || 10; // Get limit, default to 10
        const skip = (page - 1) * limit; // Calculate skip value
        
        // Get events with pagination
        const events = await Events.find()
            .skip(skip)
            .limit(limit);

        // Get total count for pagination metadata
        const total = await Events.countDocuments();
        
        res.status(200).json({
            events,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalEvents: total,
                hasMore: skip + events.length < total
            }
        });
    } catch (error) {
        debug(error);
        res.status(404).json({ message: "No events were found." });
    }
});

// Get all bookings for the authenticated user
// Example: GET /api/events/bookings
router.get("/bookings", auth(), async (req, res) => {
    console.log("GET /events/bookings route hit");
    const userId = req.user._id;
    console.log("user=", userId);

    try {
        const bookings = await Bookings.find({ userId }).select('userId').select('eventId').select('status').select('bookingDate');
        res.status(200).json(bookings);
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// Get a single event by ID
// Example: GET /api/events/1234567890abcdef12345678
router.get("/:id", async (req, res) => {
    try {
        const event = await Events.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        res.status(200).json(event);
    } catch (error) {
        debug(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid event ID format." });
        }
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// Post Requests:
// Create a new event by an authorized user (admin)
// Example: POST /api/events
router.post("/", auth(['admin']), async (req, res) => {
    console.log('POST /events route hit');
    const userId= req.user._id;

    const normalizedDate= new Date(req.body.date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const eventObject= { ...req.body, date: normalizedDate, createdBy: userId };
    debug(userId);

    const { error } = validateEvent(eventObject);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const eventExists = await Events.findOne({ 
            name: eventObject.name, 
            date: {
                $gte: normalizedDate,
                $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (eventExists) {
            return res.status(400).json({ message: "Event already exists." });
        }
        
        const event = new Events(eventObject);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});



// Book an event by an authenticated user
// Example: POST /api/events/book/1234567890abcdef12345678
router.post("/book/:id", auth(), async (req, res) => {
    const userId = req.user._id;
    const eventId = req.params.id;
    console.log("user=", userId);
    try {
        const event = await Events.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        
        const booking = new Bookings({
            userId,
            eventId,
            status: "confirmed",
        });
        
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        debug(error);
        console.log(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal Server Error." });
    }
});


// Delete an event by an authorized user (admin)
// Example: DELETE /api/events/1234567890abcdef12345678
router.delete("/:id", auth(['admin']), async (req, res) => {
    try {
        const event = await Events.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


// Update an existing event by an authorized user (admin)
// Example: PUT /api/events/1234567890abcdef12345678
router.put("/:id", auth(['admin']), async (req, res) => {
    const { error } = validateEvent(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const event = await Events.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        res.status(200).json(event);
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});



module.exports = router;