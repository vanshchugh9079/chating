import User from "../../models/User.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import PostModel from "../../models/Post.js";
import errorHandle from "../../utils/errorHandler.js";
import mongoose from "mongoose";
import Reel from "../../models/Reel.js";

let getProfile = async (req, res) => {
    let name = req.params.name;
    let user = req.user;

    // Fetch the user with populated followers and following
    let userObj = await User.findOne({ name })
        .populate("follower", "name avatar _id") // Only fetch required fields
        .populate("following", "name avatar _id")
        .exec();

    if (!userObj) {
        throw new ApiError(400, "User not found");
    }

    // Fetch posts created by the user
    let posts = await PostModel.find({ createdBy: userObj._id })
        .populate("people", "name avatar _id")
        .exec();
    let reels=await Reel.find({createdBy:userObj._id}).populate("people","name avatar _id").exec();
    // Check if the current user follows the profile user
    let arr = userObj.follower.map((element) => {
        return element._id.toString();
    })

    let youFollow = arr.includes(user.id);
    let you = await User.findById(user.id);
    let requestContain = you.request.includes(userObj._id);

    if (userObj.type === "private") {
        // Handle private profile access
        if (youFollow || userObj._id.toString() == user.id.toString()) {
            // If the user follows or is the same user, return full data
            let data = {
                user: userObj,
                posts: posts,
                youFollow: youFollow,
            };
            let response = new ApiResponse(data, 200, "Profile fetched successfully");
            return res.status(200).json(response);
        } else {
            // Limited access for private profiles
            let requested = userObj.request.includes(user.id)
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
                reels:[],
                youFollow: false,
                requested: requested,
                requestContain: requestContain
            }
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
};
export default errorHandle(getProfile);
