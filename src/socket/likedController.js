import User from "../models/User.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import Notification from "../models/Notification.js";

let likedController = async (socket, allUser, postId, id, liked, type = "post") => {
    try {
        let you = await User.findById(id);
        if (!you) return console.log("User not found");

        // Determine whether it's a Post or Reel
        
        
        
        let content = type === "reel" ? await Reel.findById(postId) : await Post.findById(postId).populate("comment");
        if (!content) return console.log(`${type} not found`);

        let userId = content.createdBy._id.toString();
        let user = await User.findById(userId);
        if (!user) return console.log("Content creator not found");

        // Update likes
        if (liked) {
            if (!content.likes.includes(you._id)) {
                content.likes.push(you._id);
            }
        } else {
            content.likes = content.likes.filter((like) => like.toString() !== you._id.toString());
        }
        await content.save();

        let notification;
        if (userId !== id) {
            let notiObj={
                type: "information",
                content: `${you.name} ${liked? "liked" : "disliked"} your ${type}`,
                user: userId,
                on: type,
            }
            if(type==="reel"){
                notiObj.reel=content
            }else{
                notiObj.post=content
            }
            notification = await Notification.create(notiObj);

            user.notification.push(notification);
            await user.save();

            // Populate notification with post (or reel) and its comments
            notification = await Notification.findById(notification._id)
                .populate("user", "name avatar")
                .populate({
                    path: type,
                    populate: {
                        path: "comment", // Populate comments of the post
                         // Fetch only relevant fields
                    },
                });
        }

        // Emit events
        let recipientSocketId = allUser.get(userId);
        if (userId !== id && recipientSocketId) {
            socket.to(recipientSocketId).emit(`liked-${type}`, { content, notification });
        }

        socket.emit(`liked-${type}-success`, content);
    } catch (error) {
        console.error("Error in likedController:", error);
    }
};

export { likedController };
