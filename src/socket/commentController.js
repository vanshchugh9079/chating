import PostModel from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import Reel from "../models/Reel.js";

let commentOnPost = async (socket, allUser, postId, id, content) => {
    try {
        // Fetch the user who commented
        const you = await User.findById(id);
        if (!you) {
            socket.emit("error", { message: "User not found" });
            return; // Early return on error
        }

        // Fetch the post being commented on and populate both comments and post creator
        let post = await PostModel.findById(postId)
            .populate('createdBy', 'avatar name') // Populate createdBy for the post itself
        if (!post) {
            socket.emit("error", { message: "Post not found" });
            return; // Early return on error
        }

        // Fetch the user who created the post
        const userId = post.createdBy._id;
        const user = await User.findById(userId);
        if (!user) {
            socket.emit("error", { message: "Post creator not found" });
            return; // Early return on error
        }

        // Create and save the comment
        let commentObj = await Comment.create({
            content,
            createdBy: you._id,
        });

        // Add the comment to the post and save
        post.comment.push(commentObj._id);
        await post.save();
        post.comment = await Promise.all(
            post.comment.map(async (commentId) => {
                return await Comment.findById(commentId)
                    .populate('createdBy', 'avatar name')
            })
        )
        let postObj = post

        commentObj = await Comment.findById(commentObj._id).populate("createdBy", "avatar name")
        // Send notification to the post owner if the commenter is not the post creator
        if (post.createdBy._id.toString() !== id) {
            let notification = await Notification.create({
                user: you._id,
                type: "information",
                content: `${you.name} commented on your post`,
                post: postObj._id,
                on: "post",
            });

            // Populate notification and add to post owner's notifications
            notification = await Notification.findById(notification._id).populate("user", "avatar name");
            user.notification.push(notification);
            await user.save();
            notification.post=postObj;

            // Emit the notification to the post creator if they are  online
            if (allUser.has(post.createdBy._id.toString())) {
                socket.to(allUser.get(post.createdBy._id.toString())).emit("comment-post", { comment: commentObj, notification });
            }
        }

        // Emit the new comment back to the commenter
        socket.emit("comment-post-success", { comment: commentObj });

    } catch (error) {
        console.error("Error in commentOnPost:", error);
        socket.emit("error", { message: "Something went wrong while commenting on the post." });
    }
};
let commentOnReel = async (socket, allUser, postId, id, content) => {
    try {
        // Fetch the user who commented
        const you = await User.findById(id);
        if (!you) {
            socket.emit("error", { message: "User not found" });
            return; // Early return on error
        }

        // Fetch the post being commented on and populate both comments and post creator
        let post = await Reel.findById(postId)
            .populate('createdBy', 'avatar name') // Populate createdBy for the post itself
        if (!post) {
            socket.emit("error", { message: "Post not found" });
            return; // Early return on error
        }

        // Fetch the user who created the post
        const userId = post.createdBy._id;
        const user = await User.findById(userId);
        if (!user) {
            socket.emit("error", { message: "Post creator not found" });
            return; // Early return on error
        }

        // Create and save the comment
        let commentObj = await Comment.create({
            content,
            createdBy: you._id,
        });

        // Add the comment to the post and save
        post.comment.push(commentObj._id);
        await post.save();
        post.comment = await Promise.all(
            post.comment.map(async (commentId) => {
                return await Comment.findById(commentId)
                    .populate('createdBy', 'avatar name')
            })
        )
        let postObj = post

        commentObj = await Comment.findById(commentObj._id).populate("createdBy", "avatar name")
        // Send notification to the post owner if the commenter is not the post creator
        if (post.createdBy._id.toString() !== id) {
            let notification = await Notification.create({
                user: you._id,
                type: "information",
                content: `${you.name} commented on your reel`,
                post: postObj._id,
                on: "reel",
            });

            // Populate notification and add to post owner's notifications
            notification = await Notification.findById(notification._id).populate("user", "avatar name");
            user.notification.push(notification);
            await user.save();
            notification.reel=postObj;

            // Emit the notification to the post creator if they are  online
            if (allUser.has(post.createdBy._id.toString())) {
                socket.to(allUser.get(post.createdBy._id.toString())).emit("comment-reel", { comment: commentObj, notification });
            }
        }

        // Emit the new comment back to the commenter
        socket.emit("comment-reel-success", { comment: commentObj });

    } catch (error) {
        console.error("Error in commentOnPost:", error);
        socket.emit("error", { message: "Something went wrong while commenting on the reel." });
    }
};
export { commentOnPost ,commentOnReel };
