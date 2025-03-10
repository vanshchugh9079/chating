import User from "../../models/User.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import PostModel from "../../models/Post.js";
import errorHandle from "../../utils/errorHandler.js";
import mongoose from "mongoose";
import Reel from "../../models/Reel.js";
import Comment from "../../models/Comment.js";

let getProfile = async (req, res) => {
    let name = req.params.name;
    let user = req.user;

    try {
        // Fetch the user with populated followers and following (optimized with select)
        let userObj = await User.findOne({ name })
            .populate("follower", "name avatar _id")  // Only essential fields
            .populate("following", "name avatar _id")
            .exec();

        if (!userObj) {
            throw new ApiError(400, "User not found");
        }

        // Fetch posts created by the user with populated comments and people
        let posts = await PostModel.find({ createdBy: userObj._id })
            .populate("createdBy", "name avatar _id")
            .populate({
                path: "comment",  // Assuming posts have a 'comments' field pointing to the Comment collection
                populate: {
                    path: "createdBy",  // Populate the user who created the comment
                }
            }) 
            .exec();

        // Fetch reels with populated comments and people
        let reels = await Reel.find({ createdBy: userObj._id })
            .populate({
                path: "comment",  // Assuming reels have a 'comment' field pointing to the Comment collection
                populate: {
                    path: "createdBy",  // Populate the user who created the comment
                    select: "name avatar _id"
                }
            })
            .populate("createdBy")
            .exec();

        // Check if the current user follows the profile user
        let youFollow = userObj.follower.some(follower => follower._id.toString() === user.id);
        let you = await User.findById(user.id);
        let requestContain = you.request.includes(userObj._id);

        if (userObj.type === "private") {
            // Handle private profile access
            if (youFollow || userObj._id.toString() === user.id.toString()) {
                // Return full data if the user follows or is the same user
                let data = {
                    user: userObj,
                    posts: posts,
                    reels: reels,
                    youFollow: youFollow,
                };
                let response = new ApiResponse(data, 200, "Profile fetched successfully");
                return res.status(200).json(response);
            } else {
                // Limited access for private profiles
                let requested = userObj.request.includes(user.id);
                let data = {
                    user: {
                        _id: userObj._id,
                        name: userObj.name,
                        avatar: userObj.avatar,
                        followers: userObj.follower,
                        following: userObj.following,
                        youFollow: false,
                        type: userObj.type
                    },
                    posts: [],
                    reels: [],
                    youFollow: false,
                    requested: requested,
                    requestContain: requestContain
                };
                let response = new ApiResponse(data, 200, "Please follow to access full data");
                return res.status(200).json(response);
            }
        } else {
            // Public profile access
            let data = {
                user: userObj,
                posts: posts,
                reels: reels,
                youFollow: youFollow,
                requestContain: requestContain,
            };
            let response = new ApiResponse(data, 200, "Profile fetched successfully");
            return res.status(200).json(response);
        }

    } catch (error) {
        // Handle any other errors (database issues, etc.)
        console.error(error);
        return res.status(500).json(new ApiError(500, "Internal server error"));
    }
};

export default errorHandle(getProfile);
