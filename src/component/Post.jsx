import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faHeart,
  faMessage,
  faEllipsisH,
  faSmile,
  faPaperPlane
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as farHeart, faBookmark as farBookmark, faComment as farComment } from "@fortawesome/free-regular-svg-icons";
import EmojiPicker from 'emoji-picker-react';
import { useSocket } from "../socket/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setComment, setShowComment } from "../redux/slice/commentSlice";
import { setUserData } from "../redux/slice/user.slice";
import { api } from "../contant";
import { useNavigate } from "react-router-dom";
import "../css/post.css";

const Post = ({
  likes,
  avatar,
  src,
  userName,
  createdAt,
  _id,
  youLiked,
  comment,
  caption,
  fixedHeight,
  isMobile
}) => {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likes);
  const [saved, setSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imageRef = useRef(null);
  const optionsRef = useRef(null);
  const captionRef = useRef(null);
  const commentInputRef = useRef(null);
  const postRef = useRef(null);

  const dispatch = useDispatch();
  const socket = useSocket();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  // Check saved status
  useEffect(() => {
    const savedPost = user.savedPost.filter((post) => {
      return post._id ? post._id == _id : post == _id;
    });
    setSaved(savedPost.length > 0);
  }, [user.savedPost, _id]);

  // Initialize liked state
  useEffect(() => {
    setLiked(youLiked);
  }, [youLiked]);

  // Socket listeners for likes
  useEffect(() => {
    if (!socket) return;

    const getLike = ({ post }) => {
      if (post._id === _id) {
        setCount(post.likes.length);
      }
    };

    const likeSuccess = (post) => {
      if (post._id == _id) {
        setCount(post.likes.length);
      }
    };

    socket.on("liked-post", getLike);
    socket.on("liked-post-success", likeSuccess);

    return () => {
      socket.off("liked-post", getLike);
      socket.off("liked-post-success", likeSuccess);
    };
  }, [socket, _id]);

  // Check if caption is truncated
  useEffect(() => {
    if (captionRef.current) {
      const isTruncated = captionRef.current.scrollWidth > captionRef.current.clientWidth;
      if (isTruncated && !showFullCaption) {
        setShowFullCaption(false);
      }
    }
  }, [caption, showFullCaption]);

  // Format post date
  const handleDate = useCallback(() => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mon`;
    return `${Math.floor(diffInSeconds / 31536000)}y`;
  }, [createdAt]);

  // Handle like with enhanced overlay
  const handleLike = useCallback(async () => {
    socket.emit("liked-post", {
      post: _id,
      id: user._id,
      liked: !liked
    });

    setLiked(!liked);
    setCount(prev => liked ? prev - 1 : prev + 1);

    if (!liked) {
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 800);
    }
  }, [socket, _id, user._id, liked]);

  // Double tap to like
  const handleDoubleTap = useCallback(() => {
    if (!liked) {
      handleLike();
    }
  }, [liked, handleLike]);

  // Save post
  const handleSavePost = useCallback(async () => {
    try {
      let res;
      if (!saved) {
        res = await api.get("/post/save/1/" + _id, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        });
      } else {
        res = await api.get("/post/save/0/" + _id, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        });
      }

      setSaved(!saved);
      dispatch(setUserData({
        user: res.data.data,
        loggedIn: true
      }));
    } catch (error) {
      console.error("Error saving post:", error);
    }
  }, [saved, _id, user.token, dispatch]);

  // Handle emoji selection
  const handleEmojiClick = useCallback((emojiData) => {
    setCommentText(prev => prev + emojiData.emoji);
    commentInputRef.current.focus();
  }, []);

  // Submit comment
  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const payload = {
      post:_id,
      id: user._id,
      content: commentText,
    }
    socket.emit("comment-post",payload)
    setCommentText("")
  }, [commentText, _id, user.token, socket]);

  // Open comment section
  const openCommentSection = useCallback(() => {
    dispatch(setComment({
      media: src,
      type: "post",
      comment: comment,
      _id: _id,
      on: "comment"
    }));
    dispatch(setShowComment(true));
  }, [dispatch, src, comment, _id]);

  // Navigate to profile
  const navigateToProfile = useCallback(() => {
    const profileName = userName.toLowerCase() === "you" ? user.name : userName;
    navigate("/profile/" + profileName);
  }, [userName, user.userName, navigate]);

  // Toggle caption visibility
  const toggleCaption = useCallback(() => {
    setShowFullCaption(!showFullCaption);
  }, [showFullCaption]);

  // Handle outside click for options menu
  const handleOutsideClick = useCallback((e) => {
    if (optionsRef.current && !optionsRef.current.contains(e.target)) {
      setShowOptions(false);
    }
  }, []);

  // Add/remove click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  // Image load handler
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Image error handler
  const handleImageError = useCallback(() => {
    setIsError(true);
  }, []);

  return (
    <motion.div
      ref={postRef}
      className={`post-container ${isMobile ? 'mobile' : ''}`}
      style={{ height: fixedHeight ? (isMobile ? 'auto' : '650px') : 'auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
      
    >
      {/* Post Header */}
      <div className="post-header">
        <div className="user-info" onClick={navigateToProfile}>
          <div className="avatar-container">
            <div className="avatar-gradient">
              <img
                src={avatar}
                alt="avatar"
                className="avatar-image"
                onError={(e) => e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'}
              />
            </div>
          </div>

          <div className="user-details">
            <div className="username-container">
              <span className="username">{userName}</span>
              {userName !== "you" && (
                <span className="verified-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#3897f0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              )}
            </div>
            <span className="time-ago">
              {handleDate()}
            </span>
          </div>
        </div>

        <div className="post-options" ref={optionsRef}>
          <button
            className="options-button"
            onClick={() => setShowOptions(!showOptions)}
            aria-label="Post options"
          >
            <FontAwesomeIcon icon={faEllipsisH} />
          </button>

          <AnimatePresence>
            {showOptions && (
              <motion.div
                className="options-menu"
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <button className="option-item">Report</button>
                <button className="option-item">Unfollow</button>
                <button className="option-item">Copy Link</button>
                <button className="option-item">Share to...</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Media with Interactive Overlay */}
      <div 
        className="post-media"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onTouchStart={() => isMobile && setIsHovered(true)}
        onTouchEnd={() => isMobile && setIsHovered(false)}
      >
        <div className="media-container">
          <div 
            className="media-wrapper" 
            ref={imageRef}
            onDoubleClick={handleDoubleTap}
          >
            {!isLoaded && !isError && (
              <div className="media-placeholder shimmer">
                <div className="placeholder-spinner"></div>
              </div>
            )}

            <img
              src={src}
              alt="Post"
              className={`media-content ${isLoaded ? 'visible' : 'hidden'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                height: fixedHeight ? (isMobile ? '350px' : '500px') : 'auto',
                objectFit: 'cover'
              }}
            />

            {isError && (
              <div className="media-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Image failed to load</span>
              </div>
            )}

            {/* Enhanced Interactive Overlay */}
            <AnimatePresence>
              {(showOverlay || isHovered) && (
                <motion.div 
                  className="interactive-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 0.7 : showOverlay ? 0.9 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="overlay-buttons">
                    <motion.button
                      className="overlay-action-button like-button"
                      whileTap={{ scale: 0.9 }}
                      onClick={handleLike}
                      initial={{ scale: showOverlay ? 1.5 : 1 }}
                      animate={{ 
                        scale: showOverlay ? [1.5, 1.2, 1] : 1,
                        color: liked ? '#ff2d55' : '#ffffff'
                      }}
                      transition={{ 
                        duration: showOverlay ? 0.8 : 0.2,
                        ease: "easeOut"
                      }}
                    >
                      <FontAwesomeIcon icon={faHeart} size="2x" />
                    </motion.button>
                    
                    <motion.button
                      className="overlay-action-button comment-button"
                      whileTap={{ scale: 0.9 }}
                      onClick={openCommentSection}
                      initial={{ scale: 1 }}
                      animate={{ scale: 1 }}
                    >
                      <FontAwesomeIcon icon={faMessage} size="2x" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Like Animation Overlay */}
            <AnimatePresence>
              {showOverlay && (
                <motion.div 
                  className="like-animation-overlay"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.5 }}
                  exit={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <FontAwesomeIcon 
                    icon={faHeart} 
                    className="overlay-icon" 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <div className="actions-left">
          <motion.button
            className="action-button like-button"
            onClick={handleLike}
            aria-label={liked ? "Unlike post" : "Like post"}
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon
              icon={liked ? faHeart : farHeart}
              className={liked ? "liked" : ""}
            />
          </motion.button>

          <motion.button
            className="action-button comment-button"
            onClick={openCommentSection}
            aria-label="Comment on post"
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={farComment} />
          </motion.button>

          <motion.button
            className="action-button share-button"
            aria-label="Share post"
            whileTap={{ scale: 0.9 }}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </motion.button>
        </div>

        <motion.button
          className="action-button save-button"
          onClick={handleSavePost}
          aria-label={saved ? "Remove from saved" : "Save post"}
          whileTap={{ scale: 0.9 }}
        >
          <FontAwesomeIcon
            icon={saved ? faBookmark : farBookmark}
            className={saved ? "saved" : ""}
          />
        </motion.button>
      </div>

      {/* Post Details */}
      <div className="post-details">
        <p className="likes-count">
          {count.toLocaleString()} likes
        </p>

        {caption && (
          <div className="caption-container">
            <p
              className={`post-caption ${showFullCaption ? 'expanded' : ''}`}
              ref={captionRef}
              onClick={toggleCaption}
            >
              <span className="caption-username">{userName}</span>
              <span className="caption-text">{caption}</span>
            </p>
            {caption.length > 100 && (
              <button
                className="read-more-btn"
                onClick={toggleCaption}
              >
                {showFullCaption ? 'Show less' : '...more'}
              </button>
            )}
          </div>
        )}

        {comment.length > 0 && (
          <button
            className="view-comments"
            onClick={openCommentSection}
            aria-label={`View ${comment.length} comments`}
          >
            View all {comment.length} comments
          </button>
        )}
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <div className="form-group">
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  className="emoji-picker-container"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="100%"
                    height="100%"
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    searchDisabled
                    theme="dark"
                    style={{ width: '100%' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="input-container">
              <input
                type="text"
                placeholder="Add a comment..."
                className="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                aria-label="Add a comment"
                ref={commentInputRef}
              />

              <div className="input-actions">
                <motion.button
                  type="button"
                  className="emoji-button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  aria-label="Toggle emoji picker"
                  whileTap={{ scale: 0.9 }}
                >
                  <FontAwesomeIcon icon={faSmile} />
                </motion.button>

                <motion.button
                  type="submit"
                  className="submit-button"
                  disabled={!commentText.trim()}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="submit-text">Post</span>
                  <FontAwesomeIcon icon={faPaperPlane} className="submit-icon" />
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Post;