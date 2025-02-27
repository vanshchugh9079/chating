import PostModel from "../../models/Post.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import errorHandler from "../../utils/errorHandler.js";

const likeOrDislike = async (req, res) => {
    const postId = req.params.id;
    let like = Number.parseInt(req.params.like); // Assuming like is passed in the request body    
    const userId = req.user.id;
    if (!postId) {
        throw new ApiError(400, "Please provide a post ID");
    }

    if (like === undefined || (like !== 0 && like !== 1)) {
        throw new ApiError(400, "Please provide a valid like status (0 for dislike, 1 for like)");
    }

    const post = await PostModel.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Remove user ID from both arrays to prevent duplicates
    if (like === 1) {
        post.likes.forEach((element, id) => {
            if (element == userId) {
                throw new ApiError(400, `you have already liked this video`)
            }
        })
    }
    else {
        post.dislike.forEach((element, id) => {
            if (element == userId) {
                throw new ApiError(400, `you have already disliked this video`)
            }
        })
    }
    // Add user ID to the appropriate array
    if (like === 1) {
        post.likes.push(userId);
    } else if (like === 0) {
        post.dislike.push(userId);
    }

    await post.save();

    const action = like === 1 ? "liked" : "disliked";
    const response = new ApiResponse(post, 200, `You successfully ${action} the post`);
    res.status(200).json(response);
};

export default errorHandler(likeOrDislike);
