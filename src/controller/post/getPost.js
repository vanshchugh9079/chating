import Post from "../../models/Post.js";
import errorHandler from "../../utils/errorHandler.js";
import Comment from "../../models/Comment.js";

let getPost = async (req, res) => {
  try {
    let posts = await Post.find({})
      .populate("createdBy", "_id name avatar type follower")
      .exec(); // Only fetch necessary fields
    
    const user = req.user;

    // Process comments asynchronously
    posts = await Promise.all(posts.map(async (element) => {
      element.comment = await Promise.all(element.comment.map(async (c) => {
        let thisComment = await Comment.findById(c._id).populate("createdBy", "avatar name");
        return thisComment;
      }));
      return element;
    }));

    // Filter and format posts
    const sendPost = posts
      .filter((element) => {
        return (
          element.createdBy.type === "public" ||
          (element.createdBy.follower && element.createdBy.follower.includes(user.id)) ||
          element.createdBy._id.toString() === user.id
        );
      })
      .map((element) => ({
        ...element.toObject(), // Convert Mongoose document to plain object
        createdBy: {
          _id: element.createdBy._id,
          userName: element.createdBy.name,
          avatar: element.createdBy.avatar,
        },
        youLiked: element.likes.some(id => id.toString() === user.id),
      }));

    res.status(200).json(sendPost);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export default errorHandler(getPost);
