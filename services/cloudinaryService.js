const cloudinary = require('../config/cloudinary');

/**
 * Service class for handling Cloudinary image operations
 */
class CloudinaryService {
    /**
     * Uploads an image file to Cloudinary
     * @param {Object} file - File object containing buffer and mimetype
     * @returns {Promise<String>} Secure URL of the uploaded image
     * @throws {Error} If upload fails
     */
    async uploadImage(file) {
        try {
            const b64 = Buffer.from(file.buffer).toString('base64');
            const dataURI = `data:${file.mimetype};base64,${b64}`;
            
            const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                folder: 'events',
                resource_type: 'auto'
            });
            
            return uploadResponse.secure_url;
        } catch (error) {
            throw new Error(`Error uploading image: ${error.message}`);
        }
    }

    /**
     * Deletes an image from Cloudinary
     * @param {String} publicId - Public ID of the image to delete
     * @throws {Error} If deletion fails
     */
    async deleteImage(publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            throw new Error(`Error deleting image: ${error.message}`);
        }
    }
}

module.exports = new CloudinaryService();