import { Row } from "react-bootstrap";
import "../css/commentModel.css";
import { faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from "react-redux";
import { setComment, setShowComment } from "../redux/slice/commentSlice";
import { useEffect, useState } from "react";
import { useSocket } from "../socket/SocketContext";

export default function CommentModel({ comment }) {
  const [input, setInput] = useState("");
  const [allComments, setAllComments] = useState(comment.comment || []);
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const socket = useSocket();

  // Function to handle date formatting
  const handleDate = (createdAt) => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mon`;
    return `${Math.floor(diffInSeconds / 31536000)}y`;
  };

  // Handle real-time comment updates via socket
  useEffect(() => {
    const handlePostComment = ({ comment }) => {
      setAllComments((prev) => [...prev, comment]);
      setInput("");
    };

    if (socket) {
      socket.on("comment-post-success", handlePostComment);
      socket.on("comment-post", handlePostComment);
      socket.on("comment-reel", handlePostComment);
      socket.on("comment-reel-success", handlePostComment);
    }

    return () => {
      if (socket) {
        socket.off("comment-reel", handlePostComment);
        socket.off("comment-post", handlePostComment);
        socket.off("comment-post-success", handlePostComment);
        socket.off("comment-reel-success", handlePostComment);
      }
    };
  }, [socket]);

  // Function to handle comment submission
  const handleCommentSubmit = () => {
    if (input.trim() === "") return;

    const payload = {
      post: comment._id,
      id: user._id,
      content: input,
    };

    if (comment.type === "post") {
      socket.emit("comment-post", payload);
    } else if (comment.type === "reel") {
      socket.emit("comment-reel", payload);
    }

    setInput(""); // Clear input after sending
  };

  return (
    <div
      className="modal-overlay justify-content-center d-flex align-items-center   border-box"
      role="dialog"
      aria-modal="true"
    >
      {/* Close button */}
      <FontAwesomeIcon
        icon={faXmark}
        className="text-white fs-2 position-absolute end-0 top-0 me-4 mt-3 pointer"
        onClick={() => {
          dispatch(setComment({ type: "", comment: [], media: {}, _id: "" }));
          dispatch(setShowComment(false));
        }}
      />

      {/* Main Comment Modal */}
      <Row className="modal-content-comment bg-dark m-0 p-0 bg-secondary ">
        {/* Left Side: Image or Video */}
        <div className="v-border col-lg-5 col-md-6 col-12 d-flex img-parent h-100 bg-black justify-content-center align-items-center">
          <div className={`v-border col-lg-5 col-md-6 col-12 d-lg-flex img-parent border-0 bg-black justify-content-center align-items-center h-100 w-100 ${comment.on!=="media" && "d-none"}`}>
            {comment.type === "post" && <img src={comment.media} className="v-img w-100 h-100" alt="Post " />}
            {comment.type === "reel" && (
              <div className="video-container ">
                <video
                  src={comment?.media}
                  className="w-100 h-100"
                  controls
                  type="video/mp4"
                  onError={(e) => console.error("Video Error:", e.target.error)}
                />
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Comments Section */}
        <div className={`v-border col-lg-7 col-md-6 col-12 position-relative d-lg-flex h-100 flex-column ${comment.on!=="comment" && "d-none"}`}>
          <h3 className="text-white px-3 pt-2">{allComments.length} Comments</h3>
          {/* Comments List */}
          <div className="all-comment d-flex flex-column flex-grow-1 px-3">
            {allComments.length > 0 ? (
              allComments.map((c, i) => (
                <div key={i} className="d-flex gap-3 comment-box align-items-center">
                  <img
                    src={c.createdBy.avatar.url}
                    alt="User Avatar"
                    className="message-avatar rounded-circle"
                  />
                  <div className="d-flex flex-column">
                    <span className="text-white fw-bold">{c.createdBy.name || c.createdBy.userName}</span>
                    <p className="text-white m-0">{c.content}</p>
                  </div>
                  <p className="date ms-auto">{handleDate(c.createdAt)} ago</p>
                </div>
              ))
            ) : (
              <p className="text-muted text-center mt-4">No comments yet</p>
            )}
          </div>

          {/* Input Section */}
          <div className="comment-input-container position-relative end-0 w-100 bottom-0 mt-auto mb-2  bg-dark d-flex align-items-center justify-content-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="form-control  text-white"
              placeholder="Add a comment..."
            />
            <FontAwesomeIcon
              icon={faPaperPlane}
              className="fs-4 text-primary  end-0 pointer"
              onClick={handleCommentSubmit}
            />
          </div>
        </div>
      </Row>
    </div>
  );
}
