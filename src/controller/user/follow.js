import mongoose from "mongoose";
import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import errorHandler from "../../utils/errorHandler.js";

const follow = async (req, res) => {
    const user = req.user.id; // Current logged-in user
    const bool = Number(req.params.bool);

    // Validate bool parameter
    if (![0, 1].includes(bool)) {
        throw new ApiError(400, "Invalid action: bool must be 0 or 1");
    }

    // Validate and parse target user ID
    const targetUserId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Find the user to follow/unfollow
    const followingUser = await User.findById(targetUserId);
    if (!followingUser) {
        throw new ApiError(404, "User not found");
    }

    const you = await User.findById(user); // Fetch current user data

    // Handle follow/unfollow logic
    if (bool === 1) {
        if (followingUser?.follower?.includes(user._id)) {
            throw new ApiError(400, "You are already following this user");
        }
        
        if(you?.following){
            you.following.push(followingUser._id);
        }
        followingUser.follower.push(user._id);
    } else {
        if (you.following.length>0 && !you.following.includes(followingUser._id)) {
            throw new ApiError(400, "You are not following this user");
        }

        you.following = you.following.filter(id => id.toString() !== followingUser._id.toString());
        followingUser.follower = followingUser.follower.filter(id => id.toString() !== user._id.toString());
    }

    // Save updated user documents
    try {
        await you.save();
        await followingUser.save();
    } catch (err) {
        console.log(err);
        
        throw new ApiError(500, "Failed to update follow/unfollow status");
    }

    // Respond to client
    const action = bool === 1 ? "followed" : "unfollowed";
    res.status(200).json({ message: `You have successfully ${action} ${followingUser.name}` });
};

export default errorHandler(follow);
