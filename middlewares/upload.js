const multer = require('multer');

/**
 * Configure multer for file uploads
 */
const storage = multer.memoryStorage();

/**
 * File size and type validation
 */
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

/**
 * Multer middleware configurations
 */
const upload = {
  // For single file uploads
  single: multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
  }).single('file'),
  
  // For event uploads (multiple fields)
  event: multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
  }).fields([
    { name: 'file', maxCount: 1 },
    { name: 'name', maxCount: 1 },
    { name: 'description', maxCount: 1 },
    { name: 'price', maxCount: 1 },
    { name: 'venue', maxCount: 1 },
    { name: 'category', maxCount: 1 },
    { name: 'date', maxCount: 1 }
  ]),
  
  // For profile image uploads
  profile: multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter
  }).single('profileImage')
};

module.exports = upload;