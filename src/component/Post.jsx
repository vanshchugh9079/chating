import React, { useState, useEffect, useRef } from "react";
import "../css/post.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBookmark, 
  faHeart, 
  faMessage, 
  faEllipsisH,
  faShare,
  faSmile
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as farHeart, faBookmark as farBookmark } from "@fortawesome/free-regular-svg-icons";
import { useSocket } from "../socket/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setComment, setShowComment } from "../redux/slice/commentSlice";
import { setUserData } from "../redux/slice/user.slice";
import { api } from "../contant";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from 'emoji-picker-react';

export default function Post({ likes, avatar, src, userName, createdAt, _id, youLiked, comment, caption, fixedHeight, isMobile }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likes);
  const [saved, setSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imageRef = useRef(null);
  const optionsRef = useRef(null);
  const dispatch = useDispatch();
  const socket = useSocket();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const savedPost = user.savedPost.filter((post) => {
      return post._id ? post._id == _id : post == _id;
    });
    setSaved(savedPost.length > 0);
  }, [user.savedPost, _id]);

  useEffect(() => {
    setLiked(youLiked);
  }, [youLiked]);

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

  const handleDate = () => {
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

  const handleLike = () => {
    socket.emit("liked-post", {
      post: _id,
      id: user._id,
      liked: !liked
    });
    setLiked(!liked);
    
    if (!liked) {
      const heart = document.createElement('div');
      heart.className = 'heart-animation';
      heart.innerHTML = `
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      `;
      imageRef.current.appendChild(heart);
      
      setTimeout(() => {
        heart.remove();
      }, 1200);
    }
  };

  const handleSavePost = async () => {
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
      
      const saveIcon = document.querySelector(`#save-icon-${_id}`);
      if (saveIcon) {
        saveIcon.classList.add('save-animation');
        setTimeout(() => {
          saveIcon.classList.remove('save-animation');
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setCommentText(prev => prev + emojiData.emoji);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const res = await api.post("/post/comment", {
        post: _id,
        comment: commentText
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        }
      });
      
      socket.emit("new-comment", {
        post: _id,
        comment: res.data.comment
      });
      
      const commentButton = document.querySelector(`#comment-button-${_id}`);
      if (commentButton) {
        commentButton.classList.add('comment-animation');
        setTimeout(() => {
          commentButton.classList.remove('comment-animation');
        }, 1000);
      }
      
      setCommentText("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <div className={`post-container ${isMobile ? 'mobile-post-container' : ''}`} id={_id}>
      <div className="post-top">
        <div className="post-header">
          <motion.div 
            className="post-image rounded-circle"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const profileName = userName.toLowerCase() === "you" ? user.userName : userName;
              navigate("/profile/" + profileName);
            }}
          >
            <img 
              src={avatar} 
              alt="avatar" 
              className="w-100 pointer h-100 rounded-circle" 
              loading="lazy"
            />
          </motion.div>
          <div 
            className="post-user text-white pointer"
            onClick={() => {
              const profileName = userName.toLowerCase() === "you" ? user.userName : userName;
              navigate("/profile/" + profileName);
            }}
          >
            <div className="d-flex align-items-center">
              <span className="username">{userName}</span>
              <span className="verified-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#3897f0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </span>
            </div>
            <span className="text-secondary time-ago">{handleDate()}</span>
          </div>
          <div className="post-options" ref={optionsRef}>
            <motion.button 
              className="options-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowOptions(!showOptions)}
              aria-label="Post options"
            >
              <FontAwesomeIcon icon={faEllipsisH} className="text-white" />
            </motion.button>
            <AnimatePresence>
              {showOptions && (
                <motion.div 
                  className="options-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
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
        
        <div className="post-media">
          <motion.div 
            className="image-container"
            whileHover={{ scale: 1.005 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            <div className="image-wrapper" ref={imageRef}>
              {!isLoaded && (
                <div className="image-placeholder">
                  <div className="placeholder-spinner"></div>
                </div>
              )}
              <img 
                src={src} 
                alt="Post" 
                className={`post-image-content ${isLoaded ? 'visible' : 'hidden'}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsError(true)}
                loading="lazy"
                decoding="async"
                style={{ height: fixedHeight ? '400px' : 'auto' }}
              />
              {isError && (
                <div className="image-error">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Image failed to load</span>
                </div>
              )}
              
              {isHovered && (
                <motion.div 
                  className="image-hover-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.button 
                    className="hover-action-button like-button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                  >
                    <FontAwesomeIcon 
                      icon={liked ? faHeart : farHeart} 
                      className={`${liked ? "text-danger" : "text-white"}`} 
                    />
                  </motion.button>
                  <motion.button 
                    className="hover-action-button comment-button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      dispatch(setComment({
                        media: src,
                        type: "post",
                        comment: comment,
                        _id: _id,
                        on: "comment"
                      }));
                      dispatch(setShowComment(true));
                    }}
                  >
                    <FontAwesomeIcon icon={faMessage} className="text-white" />
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="post-actions">
            <div className="left-actions">
              <motion.button 
                className="action-button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                aria-label={liked ? "Unlike post" : "Like post"}
              >
                <FontAwesomeIcon 
                  icon={liked ? faHeart : farHeart} 
                  className={`${liked ? "text-danger heart-pulse" : "text-white"}`} 
                />
              </motion.button>
              <motion.button 
                id={`comment-button-${_id}`}
                className="action-button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  dispatch(setComment({
                    media: src,
                    type: "post",
                    comment: comment,
                    _id: _id,
                    on: "comment"
                  }));
                  dispatch(setShowComment(true));
                }}
                aria-label="Comment on post"
              >
                <FontAwesomeIcon icon={faMessage} className="text-white" />
              </motion.button>
              <motion.button 
                className="action-button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Share post"
              >
                <FontAwesomeIcon icon={faShare} className="text-white" />
              </motion.button>
            </div>
            <motion.button 
              id={`save-icon-${_id}`}
              className="action-button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSavePost}
              aria-label={saved ? "Remove from saved" : "Save post"}
            >
              <FontAwesomeIcon 
                icon={saved ? faBookmark : farBookmark} 
                className={`${saved ? "text-primary" : "text-white"}`} 
              />
            </motion.button>
          </div>
          
          <div className="post-details">
            <p className="text-white likes-count">
              {count.toLocaleString()} likes
            </p>
            {caption && (
              <p className="text-white caption">
                <span className="username">{userName}</span> {caption}
              </p>
            )}
            {comment.length > 0 && (
              <button 
                className="view-comments text-secondary"
                onClick={() => {
                  dispatch(setComment({
                    media: src,
                    type: "post",
                    comment: comment,
                    _id: _id,
                    on: "comment"
                  }));
                  dispatch(setShowComment(true));
                }}
                aria-label={`View ${comment.length} comments`}
              >
                View all {comment.length} comments
              </button>
            )}
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="form-control comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  aria-label="Add a comment"
                />
                <div className="action-buttons">
                  <motion.button 
                    type="button" 
                    className="emoji-button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    aria-label="Toggle emoji picker"
                  >
                    <FontAwesomeIcon icon={faSmile} className="text-white" />
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="post-comment-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!commentText.trim()}
                  >
                    Post
                  </motion.button>
                </div>
              </div>
              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker 
                    onEmojiClick={handleEmojiClick} 
                    width="100%"
                    height={350}
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    searchDisabled
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}