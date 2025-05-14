const cloudinary = require('../config/cloudinary');

class CloudinaryService {
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

    async deleteImage(publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            throw new Error(`Error deleting image: ${error.message}`);
        }
    }
}

module.exports = new CloudinaryService();