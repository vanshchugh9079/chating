import Story from "../../models/Story.js";
import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";

const getFriendStory = async (req, res) => {
    try {
        const user = req.user;

        // Fetch the user's details
        const userObj = await User.findById(user.id);
        if (!userObj) {
            throw new ApiError(404, "User not found");
        }

        // Use Promise.all with map to fetch stories for all followed users
        const storyArr = await Promise.all(
            userObj.following.map(async (follower) => {
                const stories = await Story.find({ user: follower._id }).populate("user","name avatar");
                return stories;
            })
        );

        // Flatten the array of story arrays
        const flattenedStories = storyArr.flat();

        // Create and send a response
        const response = new ApiResponse(flattenedStories, 200, "Stories retrieved successfully");
        res.status(200).json(response);
    } catch (error) {
        throw new ApiError(500, "An error occurred while fetching stories");
    }
};

export default errorHandler(getFriendStory);
