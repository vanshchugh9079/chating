import React, { useEffect, useRef, useState } from "react";
import "../css/videoReel.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBookmark, 
  faComment, 
  faHeart, 
  faPlay, 
  faShare, 
  faVolumeHigh, 
  faVolumeMute,
  faEllipsis
} from "@fortawesome/free-solid-svg-icons";
import { setComment, setShowComment } from "../redux/slice/commentSlice";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../socket/SocketContext";
import { setUserData } from "../redux/slice/user.slice";
import { api } from "../contant";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@mui/material";
import { FaMusic } from "react-icons/fa";

const VideoReel = React.forwardRef(({ 
  setMute, 
  mute, 
  userName, 
  avatar, 
  src, 
  playable, 
  youFollow, 
  you, 
  like, 
  _id, 
  comment, 
  youLiked 
}, ref) => {
  const [likes, setLikes] = useState(like.length);
  const [liked, setLiked] = useState(youLiked);
  const [showPlayIcon, setShowPlayIcon] = useState(!playable);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [doubleTapActive, setDoubleTapActive] = useState(false);
  const user = useSelector((state) => state.user.user);
  const lastTap = useRef(0);
  const socket = useSocket();
  const dispatch = useDispatch();
  const videoRef = useRef(null);

  useEffect(() => {
    const savedReel = user.savedReel.filter(reel => reel === _id);
    if (savedReel.length > 0) {
      setSaved(true);
    }
  }, [_id, user.savedReel]);

  const handleLike = () => {
    socket.emit("liked-post", {
      post: _id,
      id: user._id,
      liked: !liked,
      type: "reel"
    });
    
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    
    if (!liked) {
      setDoubleTapActive(true);
      setTimeout(() => setDoubleTapActive(false), 1000);
    }
  };

  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;
    
    if (tapLength < 300 && tapLength > 0) {
      handleLike();
    }
    
    lastTap.current = currentTime;
  };

  useEffect(() => {
    if (videoRef.current) {
      if (playable) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = mute;
        videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
        setShowPlayIcon(false);
      } else {
        videoRef.current.pause();
        setShowPlayIcon(true);
      }
    }
  }, [playable, mute]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage || 0);
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadeddata", () => setLoading(false));
    video.addEventListener("waiting", () => setLoading(true));
    video.addEventListener("playing", () => setLoading(false));

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadeddata", () => setLoading(false));
      video.removeEventListener("waiting", () => setLoading(true));
      video.removeEventListener("playing", () => setLoading(false));
    };
  }, []);

  const handleSeek = (e) => {
    if (videoRef.current) {
      const newTime = (e.target.value / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(e.target.value);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.log("Play failed:", e));
        setShowPlayIcon(false);
      } else {
        videoRef.current.pause();
        setShowPlayIcon(true);
      }
    }
  };

  const handleSaveReel = async (e) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/reel/save/${saved ? "0" : "1"}/${_id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSaved(!saved);
      dispatch(setUserData({ user: res.data.data, loggedIn: true }));
    } catch (error) {
      console.error("Error saving reel:", error);
    }
  };

  const heartVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [1.5, 1], 
      opacity: [0.8, 0],
      transition: { 
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const reelVariants = {
    hover: { scale: 1.005 },
    tap: { scale: 0.995 }
  };

  return (
    <motion.div
      ref={ref}
      className="video-reel-container"
      style={{
        margin: '10px 0',
        height: 'calc(100vh - 20px)',
      }}
      onClick={togglePlay}
      onDoubleClick={handleDoubleTap}
      variants={reelVariants}
      whileHover="hover"
      whileTap="tap"
    >
      <AnimatePresence>
        {doubleTapActive && (
          <motion.div
            className="double-tap-heart"
            variants={heartVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <FontAwesomeIcon icon={faHeart} className="text-danger" size="5x" />
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="video-loader">
          <div className="spinner" />
        </div>
      )}

      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          src={src}
          loop
          muted={mute}
          playsInline
          preload="auto"
        />
      </div>

      <div className="reel-overlay">
        <div className="left-side-content">
          <div className="user-info">
            <img 
              src={avatar.url} 
              alt={userName} 
              className="user-avatar" 
            />
            <span className="username">@{userName}</span>
            {!youFollow && !you && (
              <button className="follow-button">Follow</button>
            )}
          </div>

          <div className="caption-section">
            <p className="caption">Check out this amazing reel! #fun #viral</p>
          </div>

          <div className="music-tag">
            <FaMusic className="music-icon" />
            <span className="music-name">Original Sound</span>
          </div>
        </div>

        <div className="right-side-actions">
          <Tooltip title={mute ? "Unmute" : "Mute"} placement="left">
            <motion.button
              className="mute-button"
              onClick={(e) => {
                e.stopPropagation();
                setMute(!mute);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FontAwesomeIcon icon={mute ? faVolumeMute : faVolumeHigh} />
            </motion.button>
          </Tooltip>

          <div className="action-item">
            <motion.div
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              whileTap={{ scale: 0.8 }}
            >
              <FontAwesomeIcon 
                icon={faHeart} 
                className={liked ? "text-danger" : "text-white"} 
                size="lg"
              />
            </motion.div>
            <span className="action-count">{likes}</span>
          </div>

          <div className="action-item">
            <motion.div
              onClick={(e) => {
                e.stopPropagation();
                dispatch(setComment({
                  media: src,
                  type: "reel",
                  comment: comment,
                  _id: _id,
                  on: "comment"
                }));
                dispatch(setShowComment(true));
              }}
              whileTap={{ scale: 0.8 }}
            >
              <FontAwesomeIcon icon={faComment} size="lg" />
            </motion.div>
            <span className="action-count">{comment?.length}</span>
          </div>

          <div className="action-item">
            <motion.div
              onClick={handleSaveReel}
              whileTap={{ scale: 0.8 }}
            >
              <FontAwesomeIcon 
                icon={faBookmark} 
                className={saved ? "text-white" : ""} 
                size="lg"
              />
            </motion.div>
          </div>

          <div className="action-item">
            <motion.div
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              whileTap={{ scale: 0.8 }}
            >
              <FontAwesomeIcon icon={faEllipsis} size="lg" />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="progress-container">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          onClick={(e) => e.stopPropagation()}
          className="progress-bar"
        />
      </div>

      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            className="play-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <FontAwesomeIcon icon={faPlay} className="play-icon" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            className="options-menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="option-item">
              <FontAwesomeIcon icon={faShare} />
              <span>Share</span>
            </button>
            <button className="option-item" onClick={handleSaveReel}>
              <FontAwesomeIcon icon={faBookmark} />
              <span>{saved ? "Unsave" : "Save"}</span>
            </button>
            <button className="option-item" onClick={() => setMute(!mute)}>
              <FontAwesomeIcon icon={mute ? faVolumeMute : faVolumeHigh} />
              <span>{mute ? "Unmute" : "Mute"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default VideoReel;