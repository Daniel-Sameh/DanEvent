const {Events, validateEvent, validateEventUpdate} = require("../models/event");
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
const cloudinary = require('../config/cloudinary');
const upload = require('../middlewares/upload');
const cache = require('../middlewares/cache');
const redis = require('../utils/redis');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const cloudinaryService = require('../services/cloudinaryService');

// Get Requests:
// Get all events with pagination, filtering, and sorting
// Example: GET /api/events?page=2&limit=10&category=music&startDate=2025-06-30&endDate=2025-07-15&sort=asc&booked=true
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get page number, default to 1
        const limit = parseInt(req.query.limit) || 10; // Get limit, default to 10
        const skip = (page - 1) * limit; // Calculate skip value
        
        // Extract filter parameters
        const category = req.query.category;
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        const sortOrder = req.query.sort === 'desc' ? -1 : 1; // Default to ascending if not specified
        const bookedFilter = req.query.booked;
        
        // If booked filter is provided, we need the user to be authenticated
        let userId = null;
        if (bookedFilter && req.query.booked !== 'all') {
            if (!req.user) {
                return res.status(401).json({ message: "Authentication required to filter by booking status." });
            }
            userId = req.user._id;
        }
        
        // Build query object
        const query = {};
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }
        
        // Create cache key that includes all filter parameters
        const cacheKey = `events:page:${page}:limit:${limit}:category:${category || 'all'}:startDate:${startDate || 'none'}:endDate:${endDate || 'none'}:sort:${sortOrder}:booked:${bookedFilter || 'all'}:userId:${userId || 'none'}`;

        const fetchedData = await cache(cacheKey, 120, async () => {
            let events;
            let total;
            
            // If filtering by booking status
            if (bookedFilter === 'true' || bookedFilter === 'false') {
                // First get all bookings for this user
                const userBookings = await Bookings.find({ 
                    userId,
                    status: "confirmed"  
                }).select('eventId').lean();
                
                const bookedEventIds = userBookings.map(booking => booking.eventId);
                
                // Adjust query based on booked filter
                if (bookedFilter === 'true') {
                    query._id = { $in: bookedEventIds };
                } else if (bookedFilter === 'false') {
                    query._id = { $nin: bookedEventIds };
                }
            }
            
            // Apply filters, sorting and pagination
            events = await Events.find(query)
                               .sort({ date: sortOrder })
                               .skip(skip)
                               .limit(limit);
                               
            // Count documents that match the filter
            total = await Events.countDocuments(query);

            return {
                events,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalEvents: total,
                    hasMore: skip + events.length < total
                }
            };
        });
        
        res.status(200).json(fetchedData.data);
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
    // console.log("user=", userId);

    try {
        const cacheKey = `bookings:user:${userId}`;
        const fetchedData = await cache(cacheKey, 200, async ()=>{
            const bookings = await Bookings.find({ userId })
                                        .populate('eventId')
                                        .select('eventId status bookingDate');
            return bookings;
        });

        res.status(200).json(fetchedData.data);
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// Get a single event by ID
// Example: GET /api/events/1234567890abcdef12345678
router.get("/:id", async (req, res) => {
    try {
        const cacheKey = `event:${req.params.id}`;
        const event = await cache(cacheKey, 120, async()=> {return await Events.findById(req.params.id)});
        if (!event.data) {
            return res.status(404).json({ message: "Event not found." });
        }
        res.status(200).json(event.data);
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
router.post("/", auth(['admin']), upload.event, async (req, res) => {
    console.log('POST /events route hit');
    
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    
    try {
        const userId= req.user._id;

        const normalizedDate= new Date(req.body.date);
        
        let eventObject= { ...req.body, date: normalizedDate, createdBy: userId };
        
        if (req.files.file && req.files.file[0]) {
            try {
                const imageUrl = await cloudinaryService.uploadImage(req.files.file[0]);
                eventObject.imageUrl = imageUrl;
            } catch (uploadError) {
                return res.status(400).json({ message: "Error uploading image" });
            }
        } else if (!req.body.imageUrl) {
            // If no image file and no imageUrl provided, set default image
            eventObject.imageUrl = 'https://default-image-url.com/placeholder.jpg';
        }

        // Validate event object
        const { error } = validateEvent(eventObject);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        
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

        // Clear Cache
        await redis.del('events:all');

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
        ;
        const event = await cache(`event:${eventId}`, 200, async () => {return await Events.findById(eventId)});
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        const bookingExists = await Bookings.findOne({
            userId,
            eventId,
            status: "confirmed"
        });

        if(bookingExists){
            return res.status(400).json({ message: "You have already booked this event." });
        }
        const booking = new Bookings({
            userId,
            eventId,
            status: "confirmed",
        });
        
        await booking.save();

        // Clear user bookings cache
        await redis.del(`bookings:user:${userId}`); 
        
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
        const fetchedEvent = await cache(`event:${req.params.id}`, 200, async () => {return await Events.findByIdAndDelete(req.params.id)});
        
        if (!fetchedEvent.data) {
            return res.status(404).json({ message: "Event not found." });
        }

        await redis.del(`event:${req.params.id}`);
        res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
        debug(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


// Update an existing event
router.put("/:id", auth(['admin']), upload.event, async (req, res) => {
    /**
     * Update an existing event
     * @route PUT /api/events/:id
     * @middleware auth(['admin']) - Ensures only admin users can update events
     * @middleware upload - Handles multipart form data and file uploads
     */
    try {
        // Check if event exists in database
        const cacheKey = `event:${req.params.id}`;
        const existingEvent = await cache(cacheKey, 200, async ()=> {return Events.findById(req.params.id)});
        if (!existingEvent.data) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Initialize object to store fields that need to be updated
        const updateFields = {};
        
        // Selectively update only the fields that are provided in the request
        if (req.body.name) updateFields.name = req.body.name;
        if (req.body.description) updateFields.description = req.body.description;
        if (req.body.price) updateFields.price = req.body.price;
        if (req.body.venue) updateFields.venue = req.body.venue;
        if (req.body.category) updateFields.category = req.body.category;
        if (req.body.imageUrl) updateFields.imageUrl = req.body.imageUrl;
        
        // Handle date field separately to ensure proper date formatting
        if(req.body.date) {
            const normalizedDate = new Date(req.body.date);
            updateFields.date = normalizedDate;
        }

        // Handle image upload if a new file is provided
        if (req.files.file && req.files.file[0]) {
            try {
                const imageUrl = await cloudinaryService.uploadImage(req.files.file[0]);
                updateFields.imageUrl = imageUrl;
            } catch (uploadError) {
                return res.status(400).json({ message: "Error uploading image" });
            }
        }
        console.log("updateFields after file stuff=", updateFields);

        //Validate the updated event data
        const { error } = validateEventUpdate(updateFields);
        console.log("error=", error);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Update the event
        const updatedEvent = await Events.findByIdAndUpdate(
            req.params.id, 
            updateFields,
            { new: true }
        );

        // Update the cache
        await redis.set(`event:${req.params.id}`, JSON.stringify(updatedEvent), 'EX', 200);

        res.status(200).json(updatedEvent);

    } catch (error) {
        // debug(error);
        res.status(500).json({ message: `Internal Server Error: ${error}.` });
    }
});



module.exports = router;