import User from "../../models/User.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import jsonResponse from "../../utils/jsonResponse.js";
import errorHandler from "../../utils/errorHandler.js";
import { cloudinaryUpload } from "../../utils/cloudniaryUpload.js";
import Chat from "../../models/Chat.js";
import fs from "fs/promises";
import cloudinary from "cloudinary";

// Configure Cloudinary (move this to a separate config file if needed)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const register = async (req, res) => {
    try {
        let { name, email, password, phone, type, by, avatar } = req.body;
        let file = req.file;

        if (by !== "google" && (!name || !email || !type || !password)) {
            throw new ApiError(400, "Please provide all required fields");
        }

        if (by !== "google" && password.length < 8) {
            throw new ApiError(400, "Password must be at least 8 characters long");
        }

        // Check if user already exists
        let existingUser = await User.findOne({
            $or: [{ email }, { name }, by !== "google" ? { phone } : null].filter(Boolean)
        });

        if (existingUser) {
            if (file) await fs.unlink(file.path); // Delete uploaded file if user exists
            throw new ApiError(400, "User already exists");
        }

        let uploadResult;
        if (!file) {
            cloudinary.uploader.upload(avatar, function (error, result) {
                console.log(result);
            });
        }
        if (file) {
            try {
                uploadResult = await cloudinaryUpload(file);
                await fs.unlink(file.path); // Delete local file after upload
            } catch (error) {
                await fs.unlink(file.path);
                throw new ApiError(500, "File upload failed");
            }
        }

        let userObj = {
            email,
            name,
            password,
            type: type.toLowerCase(),
            isOnline: true,
            avatar: uploadResult
                ? { public_id: uploadResult.public_id, url: uploadResult.url }
                : avatar ? { public_id: Date.now(), url: avatar } : undefined,
        };

        if (by != "google") {
            userObj = {
                email,
                name,
                password,
                phone,
                type: type.toLowerCase(),
                isOnline: true,
                avatar: uploadResult
                    ? { public_id: uploadResult.public_id, url: uploadResult.url }
                    : avatar ? { public_id: Date.now(), url: avatar } : undefined,
            }
        }

        const user = await User.create(userObj);

        // Create a default chat for the user
        await Chat.create({
            name: "chat with ai",
            people: [user._id],
            createdBy: user._id,
            avatar: {
                url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBQg72aurdEpJDu8909EdLHRsS6-_BL9CXrQ&s",
                public_id: Date.now(),
            },
            messages: [],
            groupChat: false,
        });

        let data = await jsonResponse(user);
        const response = new ApiResponse(data || user, 200, "User created successfully");
        res.cookie("token", response.data.token);
        res.status(200).json(response);

    } catch (error) {
        console.error("Error in register:", error);
        res.status(error.statusCode || 500).json(new ApiResponse(null, error.statusCode || 500, error.message));
    }
};

export default errorHandler(register);
