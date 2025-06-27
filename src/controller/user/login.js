import User from "../../models/User.js";
import Chat from "../../models/Chat.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";
import jsonResponse from "../../utils/jsonResponse.js";
import cloudinary from "cloudinary";

let login = async (req, res) => {
    const { by, type, email, name, phone, password, avatar } = req.body;
    const enterSource = name || email || phone;
    let user;

    console.log("LOGIN REQUEST:", { name, phone, email, by, password });

    // Google Login Flow
    if (by === "google") {
        if (!email || !name) {
            throw new ApiError(400, "Google login failed: Missing required fields.");
        }

        user = await User.findOne({ email });

        console.log("Google Login User:", user);

        if (!user) {
            let uploadedResult = null;

            if (avatar) {
                try {
                    const result = await cloudinary.uploader.upload(avatar);
                    uploadedResult = {
                        public_id: result.public_id,
                        url: result.secure_url,
                    };
                } catch (uploadError) {
                    console.error("Cloudinary Upload Error:", uploadError);
                    throw new ApiError(500, "Avatar upload failed.");
                }
            }

            const newUser = await User.create({
                email,
                name,
                password: "", // Google users don’t need password
                type: type?.toLowerCase() || "public",
                isOnline: true,
                avatar: uploadedResult,
            });

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

            const data = await jsonResponse(newUser);
            const response = new ApiResponse(data, 200, "User created successfully");
            res.cookie("token", response.data.token, { httpOnly: true, secure: true, sameSite: "Strict" });
            return res.status(200).json(response);
        }
    }

    // Non-Google Login Flow
    if (by !== "google") {
        if (!enterSource) throw new ApiError(400, "Please enter a name, email, or phone number.");
        if (!password) throw new ApiError(400, "Please enter a password.");
    }

    // Find user by email, name, or phone
    user = await User.findOne({
        $or: [{ email }, { name }, { phone }],
    })
        .select('+password') // Important for password checking
        .populate("notification savedPost savedReel reel post follower following")
        .populate({
            path: "savedPost",
            populate: { path: "comment", populate: { path: "createdBy" } },
        })
        .populate({
            path: "savedReel",
            populate: { path: "comment", populate: { path: "createdBy" } },
        });

    if (!user) throw new ApiError(404, "User not found.");
    console.log("Fetched User:", user);

    // Verify password for non-Google logins
    if (by !== "google") {
        if (!user.password) throw new ApiError(400, "This account is registered via Google. Please use Google login.");
        const isPasswordMatch = await user.comparePassword(password);
        console.log("Password match:", isPasswordMatch);
        if (!isPasswordMatch) throw new ApiError(401, "Invalid password.");
    }

    // Set user as online
    user.isOnline = true;
    await user.save();

    await user.generateToken(); // Generates and saves token
    const response = new ApiResponse(user, 200, "Login successful");

    res.cookie("token", response.data.token, { httpOnly: true, secure: true, sameSite: "Strict" });
    return res.status(200).json(response);
};

export default errorHandler(login);
