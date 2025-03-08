import Reel from "../../models/Reel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import errorHandle from "../../utils/errorHandler.js";
import User from "../../models/User.js";
import PostModel from "../../models/Post.js";

let saveReel = async (req, res) => {
    try {
        let user = req.user;
        let saved = req.params.saved;
        let you = await User.findById(user.id)
            .populate("notification savedPost savedReel reel post follower following")
            .exec();
        
        let reelId = req.params.id;
        let reel = await PostModel.findById(reelId);

        if (!reel) {
            return res.status(404).json(new ApiError("Reel not found", 404));
        }

        if (saved == 1) {
            if (!you.savedPost.some(savedPost => savedPost._id.toString() === reel._id.toString())) {
                you.savedPost.push(reel._id);
            }
        } else {
            you.savedPost = you.savedPost.filter(savedPost => savedPost._id.toString() !== reel._id.toString());
        }

        await you.save();

        // Re-fetch the user with fully populated `savedPost`
        you = await User.findById(user.id)
            .populate([
                "notification savedReel reel post follower following",
                {
                    path: "savedPost",
                    populate: [
                        { path: "createdBy" },
                        { path: "likes" },
                        { 
                            path: "comment", 
                            populate: { path: "createdBy" } // Populating comment's creator directly
                        }
                    ]
                }
            ])
            .exec();

        let response = new ApiResponse(you, 200, "Saved post successfully");
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError("Internal Server Error", 500));
    }
};

export default errorHandle(saveReel);
