import User from "../../models/User.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import jsonResponse from "../../utils/jsonResponse.js";
import errorHandler from "../../utils/errorHandler.js";
import { cloudinaryUpload } from "../../utils/cloudniaryUpload.js";
import Chat from "../../models/Chat.js";
import fs from "fs/promises";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const register = async (req, res) => {
        const file = req.file;
        console.log(file);
        
        const { name, email, password, phone, type, by, avatar } = req.body;

        console.log("REGISTER REQUEST:", { name, email, phone, by });
        if (by !== "google") {
            if (!name || !email || !password || !type) {
                throw new ApiError(400, "Please provide name, email, password, and type.");
            }
            if (password.length < 8) {
                throw new ApiError(400, "Password must be at least 8 characters long.");
            }
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { name }, ...(by !== "google" ? [{ phone }] : [])],
        });

        if (existingUser) {
            if (file) await fs.unlink(file.path);
            throw new ApiError(400, "User already exists.");
        }

        let uploadResult = null;

        if (file) {
            try {
                uploadResult = await cloudinaryUpload(file);
                await fs.unlink(file.path);
            } catch (err) {
                await fs.unlink(file.path);
                throw new ApiError(500, "File upload failed.");
            }
        } else if (avatar) {
            try {
                const result = await cloudinary.uploader.upload(avatar);
                uploadResult = {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            } catch (err) {
                console.error("Cloudinary direct upload failed:", err);
            }
        }

        const newUser = await User.create({
            name,
            email,
            password: by === "google" ? "" : password,
            phone: phone || "",
            type: (type || "public").toLowerCase(),
            isOnline: true,
            avatar: uploadResult
                ? { public_id: uploadResult.public_id, url: uploadResult.url }
                : avatar
                    ? { public_id: Date.now(), url: avatar }
                    : undefined,
        });

        await Chat.create({
            name: "Chat with AI",
            people: [newUser._id],
            createdBy: newUser._id,
            avatar: {
                url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBQg72aurdEpJDu8909EdLHRsS6-_BL9CXrQ&s",
                public_id: Date.now(),
            },
            messages: [],
            groupChat: false,
        });

        const data = await jsonResponse(newUser);
        const response = new ApiResponse(data, 200, "User created successfully");

        res.cookie("token", response.data.token, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
        });

        return res.status(200).json(response);

    }

export default errorHandler(register);
