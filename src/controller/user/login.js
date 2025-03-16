import User from "../../models/User.js";
import Chat from "../../models/Chat.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";
import jsonResponse from "../../utils/jsonResponse.js";

let login = async (req, res) => {
    try {
        let { by, type, email, name, phone, password, avatar } = req.body;
        let enterSource = name || email || phone;
        let user;

        // If logging in with Google
        if (by === "google") {
            user = await User.findOne({ email: email });
            console.log("Google Login User:", user);

            if (!user) {
                if (!email || !name) {
                    throw new ApiError(400, "Google login failed: Missing required fields.");
                }

                let userObj = {
                    email,
                    name,
                    password: "", // Google users don’t need a password
                    phone: phone || "",
                    type: type?.toLowerCase() || "public",
                    isOnline: true,
                    avatar: { public_id: Date.now(), url: avatar || "" }, // Ensure avatar is set
                };

                const newUser = await User.create(userObj);

                // Create a chat for the new Google user
                await Chat.create({
                    name: "Chat with AI",
                    people: [newUser._id],
                    createdBy: newUser._id,
                    avatar: {
                        url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBQg72aurdEpJDu8909EdLHRsS6-_BL9CXrQ&s",
                    },
                    messages: [],
                    groupChat: false,
                });

                let data = await jsonResponse(newUser);
                const response = new ApiResponse(data, 200, "User created successfully");
                res.cookie("token", response.data.token);
                return res.status(200).json(response);
            }
        }

        
        // Non-Google login
        if (by !== "google") {
            if (!enterSource) {
                throw new ApiError(400, "Please enter a name, email, or phone number.");
            }
            if (!password) {
                throw new ApiError(400, "Please enter a password.");
            }
        }

        // Find user by email, name, or phone
        user = await User.findOne({
            $or: [{ email }, { name }, { phone }],
        })
            .populate("notification savedPost savedReel reel post follower following")
            .populate({
                path: "savedPost",
                populate: { path: "comment", populate: { path: "createdBy" } },
            })
            .populate({
                path: "savedReel",
                populate: { path: "comment", populate: { path: "createdBy" } },
            });

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        // If password-based login, verify password
        if (by !== "google") {
            let isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                throw new ApiError(401, "Invalid password.");
            }
        }

        // Set user as online
        user.isOnline = true;
        await user.save();

        // Prepare and send response
        let sanitizedUser = await jsonResponse(user);
        let response = new ApiResponse(sanitizedUser, 200, "Login successful");

        res.cookie("token", response.data.token);
        return res.status(200).json(response);
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(error.statusCode || 500).json({ error: error.message || "Internal Server Error" });
    }
};

export default errorHandler(login);
