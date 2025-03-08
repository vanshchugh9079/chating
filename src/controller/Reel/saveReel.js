import Reel from "../../models/Reel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import errorHandle from "../../utils/errorHandler.js";
import User from "../../models/User.js";

let saveReel = async (req, res) => {
    try {
        let user = req.user;
        let reelId = req.params.id;
        let saved = req.params.saved;

        if (!reelId) {
            throw new ApiError("Reel ID not provided", 400);
        }

        let you = await User.findById(user.id).populate("notification savedPost savedReel reel post follower following");
        if (!you) {
            throw new ApiError("User not found", 404);
        }

        let reel = await Reel.findById(reelId);
        if (!reel) {
            throw new ApiError("Reel not found", 404);
        }

        if (saved == 1) {
            if (!you.savedReel.some(savedReel => savedReel._id == reel._id.toString())) {
                you.savedReel.push(reel._id);
            }
        } else {
            you.savedReel = you.savedReel.filter(savedReel => savedReel._id != reel._id.toString());
        }

        await you.save();

        // Re-fetch the user with fully populated `savedReel`
        you = await User.findById(user.id)
            .populate([
                "notification savedPost reel post follower following",
                {
                    path: "savedReel",
                    populate: [{ path: "createdBy" }, { path: "likes" }, { path: "comment", populate: { path: "createdBy" } }]
                }
            ])
            .exec();

        let response = new ApiResponse(you, 200, "Saved reel successfully");
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiError("Internal Server Error", 500));
    }
};

export default errorHandle(saveReel);
