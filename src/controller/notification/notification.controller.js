import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";
import Notification from "../../models/Notification.js";
import Comment from "../../models/Comment.js";
import PostModel from "../../models/Post.js";
import Reel from "../../models/Reel.js";

let getNotification = async (req, res, next) => {
    try {
        let user = req.user;
        let type = req.params.type;

        // Fetch user and populate notifications along with user details
        let userObj = await User.findById(user.id)
            .populate({
                path: "notification",
                populate: { path: "user", select: "avatar name" },
            });

        if (!userObj) {
            return next(new ApiError(404, "User not found"));
        }

        let notifications = await Promise.all(
            userObj.notification.map(async (noti) => {
                let populatedNoti = await Notification.findById(noti._id)
                    .populate("user", "avatar name")
                let media
                if (populatedNoti.on == "post") {
                    media = await PostModel.findById(populatedNoti.post._id).populate("comment")
                }
                else if (populatedNoti.on == "reel") {
                    media = await Reel.findById(populatedNoti.reel._id).populate("comment")
                }
                else {
                    media = await User.findById(populatedNoti.profile)
                }
                if(populatedNoti.on=="post" ||populatedNoti.on=="reel" ){
                    media.comment = await Promise.all(
                        media.comment.map(async (commentId) => {
                            return await Comment.findById(commentId)
                                .populate("createdBy", "avatar name")
                        })
                    )
                }
              
                if(populatedNoti.on=="post"){
                    populatedNoti.post = media;
                }
                else if(populatedNoti.on=="reel"){
                    populatedNoti.reel = media;
                }
                else {
                    populatedNoti.profile = media;
                }
                return populatedNoti;
            })
        );

        // Filter notifications by type if specified
        if (type) {
            notifications = notifications.filter((n) => n.type === type);
        }

        // Send response
        let response = new ApiResponse(notifications, 200, "Get notifications successfully");
        res.status(200).json(response);
    } catch (error) {
        console.error("Error in getNotification:", error);
        next(error); // Pass error to error handler
    }
};

export default errorHandler(getNotification);
