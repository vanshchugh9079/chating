import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
const cloudinaryUpload = async (element) => {
    const filePath = element.path;
    const fileName = element.filename;
    const fileExtension = path.extname(fileName).toLowerCase();
    let type;

    // Determine file type based on file extension
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(fileExtension)) {
        type = 'image';
    } else if (['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv'].includes(fileExtension)) {
        type = 'video';
    } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExtension)) {
        type = 'document';
    } else if (['.mp3', '.wav', '.ogg', '.aac'].includes(fileExtension)) {
        type = 'audio';
    } else {
        throw new Error('Invalid file type. Supported types are images, videos, documents, and audio.');
    }

    try {
        let uploadResult;
        const uniqueId = uuidv4(); // Generate a unique ID for each upload

        if (type === 'image') {
            // Upload an image
            uploadResult = await cloudinary.uploader.upload(filePath, {
                public_id: `image_${uniqueId}`,
                crop: 'fill',
                format: 'jpg',        // Convert to JPEG for better compression
                eager_async: true,
                transformation: [{ width: 1200, height: 1200 }]  // Generate a thumbnail for images
            });
        }
        else if (type === 'video') {
            uploadResult = await cloudinary.uploader.upload(filePath, {
                resource_type: 'video',
                public_id: `video_${uniqueId}`,
                crop: 'fill',

                video_codec: 'h264',  // Efficient codec
                quality: 'auto:low',  // Reduce file size while keeping acceptable quality
                format: 'mp4',        // Convert to MP4 for better compression
                eager: [
                    { width: 720, height: 480, crop: "limit", format: "mp4", video_codec: "h264", quality: "auto:low" }
                ],
                eager_async: true
            });
        }
        else if (type === 'document') {
            // Upload a document
            uploadResult = await cloudinary.uploader.upload(filePath, {
                resource_type: 'raw',
                public_id: `document_${uniqueId}`,
            });
        } else if (type === 'audio') {
            // Upload an audio file
            uploadResult = await cloudinary.uploader.upload(filePath, {
                resource_type: 'raw',
                public_id: `audio_${uniqueId}`,
            });
        }

        return uploadResult;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};

export { cloudinaryUpload };
