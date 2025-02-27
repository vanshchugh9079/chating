import Reel from "../../models/Reel.js";
import errorHandler from "../../utils/errorHandler.js";

let getReel = async (req, res) => {
  try {
    const posts = await Reel.find({})
      .populate("createdBy", "_id name avatar type follower") 
      .populate({
        path: "comment",
        populate: {
          path: "createdBy",
          select: "_id name avatar", // Fetch only necessary fields
        },
      })
      .exec(); // Execute the query

    const user = req.user;

    // Filter posts based on visibility
    const sendPost = posts
      .filter((element) => {
        return (
          element.createdBy.type === "public" ||
          (element.createdBy.follower &&
            element.createdBy.follower.includes(user.id)) ||
          element.createdBy._id.toString() === user.id
        );
      })
      .map((element) => ({
        ...element.toObject(), // Convert Mongoose document to plain object
        createdBy: {
          _id: element.createdBy._id,
          userName: element.createdBy.name,
          avatar: element.createdBy.avatar,
          youFollow: element.createdBy.follower.some((id) => id == user.id),
          you: user.id == element.createdBy._id,
        },
        comment: element.comment.map((cmt) => ({
          _id: cmt._id,
          text: cmt.text,
          createdBy: {
            _id: cmt.createdBy._id,
            userName: cmt.createdBy.name,
            avatar: cmt.createdBy.avatar,
          },
          content:cmt.content,
          createdAt: cmt.createdAt,
        })),
        youLiked: element.likes.some(id => id.toString() === user.id),
      }));

    res.status(200).json(sendPost);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export default errorHandler(getReel);
