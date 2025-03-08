import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import errorHandler from "../../utils/errorHandler.js";

let getUser = async (req, res) => {
    if (req.params.id) {
        const user = await User.findById(req.params.id);
        if (!user) throw new ApiError(404, "User not found");
        
        return res.status(200).json({
            name: user.name,
            avatar: user.avatar,
            followerCount: user.follower.length,
            followingCount: user.following.length,
            isFollowing: req.user?.following.includes(user._id) || false,
            isFollower: req.user?.follower.includes(user._id) || false,

        });
    }
    const limit = 10;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;
    const users = await User.find({})
        .skip(skip)
        .limit(limit)
        .select("name avatar follower following");
    const sendData = users.map(user => ({
        name: user.name,
        avatar: user.avatar,
        followerCount: user.follower.length,
        followingCount: user.following.length,
        isFollowing: req.user?.following.includes(user._id) || false,
        isFollower: req.user?.follower.includes(user._id) || false,
    }));
    res.status(200).json(sendData);
};
export default errorHandler(getUser);
