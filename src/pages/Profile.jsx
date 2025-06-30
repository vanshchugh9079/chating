import React, { useEffect, useState } from 'react';
import '../css/profile.css';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTableCells, faUser, faVideo, faEllipsisH, faHeart, faComment, faBookmark } from '@fortawesome/free-solid-svg-icons';
import getProfile from '../fetch/getProfile';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../socket/SocketContext.jsx';
import { setComment, setShowComment } from '../redux/slice/commentSlice.js';
import { setShowEditModel } from '../redux/slice/editSlice.js';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_AVATAR = '/default-avatar.png';
const DEFAULT_POST = '/default-post.png';
const DEFAULT_REEL = '/default-reel.png';

const Profile = () => {
  const { profile } = useSelector((state) => state.profile);
  const { token, name, _id, savedPost, savedReel } = useSelector((state) => state.user.user);
  const [youFollow, setYouFollow] = useState(false);
  const [requested, setRequested] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [currentTab, setCurrentTab] = useState("post");
  const [reels, setReels] = useState([]);
  const [isHoveringPost, setIsHoveringPost] = useState(null);
  const navigate = useNavigate();
  
  const [user, setUser] = useState({
    _id: "",
    avatar: { url: '' },
    name: '',
    follower: [],
    following: [],
    type: ""
  });

  let socket = useSocket();
  const [post, setPost] = useState([]);
  const dispatch = useDispatch();
  const param = useParams();

  useEffect(() => {
    getProfile(param.name, token, dispatch).catch((err) =>
      console.error('Failed to fetch profile:', err)
    );
  }, [param.name, token, dispatch, youFollow]);

  useEffect(() => {
    if (socket) {
      socket.on("follow-success", (user) => {
        setYouFollow(true);
        setUser((prev) => {
          prev.follower.push(user)
          return prev;
        })
      });
      
      socket.on("unfollow-success", (data) => {
        setYouFollow(false)
        setUser((prev) => {
          prev.follower = prev.follower.filter(follower => follower._id !== user._id)
          return prev;
        })
      });
      
      socket.on("requested", () => {
        setRequested(true)
      });
      
      socket.on("accept-request", () => {
        setShowAccept(false)
        setYouFollow(true)
      });
      
      socket.on("decline-request", (user) => {
        setRequested(false);
      });
      
      socket.on("decline-request-success", (user) => {
        setShowAccept(false)
      });
      
      socket.on("follow-request", (user) => {
        getProfile(param.name, token, dispatch).catch((err) =>
          console.error('Failed to fetch profile:', err)
        );
        setShowAccept(true)
      });
      
      socket.on("accept-request-success", (user) => {
        setShowAccept(false)
        getProfile(param.name, token, dispatch)
      });
    }
  }, [socket]);

  useEffect(() => {
    if (profile.user) {
      setUser({
        _id: profile?.user._id,
        avatar: { url: profile.user.avatar.url || DEFAULT_AVATAR },
        name: profile.user.name || profile.name,
        follower: profile.user.follower || profile.followers || [],
        following: profile.user.following || profile.following || [],
        type: profile.user.type
      });
      setRequested(profile.requested)
      setYouFollow(profile.youFollow)
      setShowAccept(profile.requestContain)
      setPost(profile.posts || []);
      setReels(profile.reels || []);
    }
  }, [profile]);

  const handleFollow = () => {
    if (!youFollow) {
      if (user.type === "public") {
        socket.emit("follow", {
          id: _id,
          userId: user._id,
        });
      } else if (!requested) {
        socket.emit("send-request", {
          id: _id,
          userId: user._id,
        });
      }
    } else {
      socket.emit("unfollow", {
        id: _id,
        userId: user._id,
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="profile-container"
    >
      <header className="profile-header-container">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="profile-avatar-container"
        >
          <img
            className="profile-avatar-image"
            src={user.avatar.url}
            alt="Profile"
          />
        </motion.div>
        
        <div className="profile-info-container">
          <div className="profile-actions-container">
            <h1 className="profile-username">{user.name}</h1>
            
            {name === param.name ? (
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="profile-edit-btn"
                onClick={() => dispatch(setShowEditModel(true))}
              >
                Edit profile
              </motion.button>
            ) : (
              <>
                {youFollow && (
                  <>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="profile-message-btn"
                    >
                      Message
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="profile-unfollow-btn"
                      onClick={() => {
                        socket.emit("unfollow", {
                          id: _id,
                          userId: user._id,
                        })
                      }}
                    >
                      Unfollow
                    </motion.button>
                  </>
                )}
                
                {!youFollow && (
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    className={`profile-follow-btn ${user.type === "private" && requested ? "profile-requested-btn" : ""}`}
                    onClick={handleFollow}
                    disabled={user.type === "private" && requested}
                  >
                    {user.type === "public" ? "Follow" : 
                     requested ? "Requested" : "Follow"}
                  </motion.button>
                )}
                
                {showAccept && (
                  <>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="profile-accept-btn"
                      onClick={() => {
                        socket.emit("accept-request", {
                          id: _id,
                          userId: user._id,
                          accept: true,
                        })
                        setShowAccept(false)
                        setRequested(false)
                      }}
                    >
                      Accept
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="profile-decline-btn"
                      onClick={() => {
                        socket.emit("accept-request", {
                          id: _id,
                          userId: user._id,
                          accept: false
                        })
                        setRequested(false)
                        setShowAccept(false)
                      }}
                    >
                      Decline
                    </motion.button>
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="profile-stats-container">
            <motion.div whileHover={{ scale: 1.05 }} className="profile-stat-item">
              <span className="profile-stat-number">{post.length}</span>
              <span className="profile-stat-label">posts</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="profile-stat-item">
              <span className="profile-stat-number">{user.follower.length}</span>
              <span className="profile-stat-label">followers</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="profile-stat-item">
              <span className="profile-stat-number">{user.following.length}</span>
              <span className="profile-stat-label">following</span>
            </motion.div>
          </div>
          
          <div className="profile-bio-container">
            <p className="profile-bio-name">{user.name}</p>
            <p className="profile-bio-text">Self obsessed 😊</p>
          </div>
        </div>
      </header>
      
      <motion.section 
        className="profile-highlights-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <motion.div 
            key={index} 
            className="profile-highlight-item"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="profile-highlight-circle">
              <img
                src={user.avatar.url}
                className="profile-highlight-image"
                alt={`Highlight ${index + 1}`}
              />
            </div>
            <p className="profile-highlight-label">Highlight {index + 1}</p>
          </motion.div>
        ))}
      </motion.section>
      
      <nav className="profile-nav-container">
        <motion.ul 
          className="profile-nav-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.li 
            variants={itemVariants}
            className={`profile-nav-item ${currentTab === "post" ? "profile-nav-active" : ""}`}
            onClick={() => setCurrentTab("post")}
          >
            <FontAwesomeIcon icon={faTableCells} className="profile-nav-icon" />
            <span>POSTS</span>
          </motion.li>
          <motion.li 
            variants={itemVariants}
            className={`profile-nav-item ${currentTab === "reel" ? "profile-nav-active" : ""}`}
            onClick={() => setCurrentTab("reel")}
          >
            <FontAwesomeIcon icon={faVideo} className="profile-nav-icon" />
            <span>REELS</span>
          </motion.li>
          <motion.li 
            variants={itemVariants}
            className={`profile-nav-item ${currentTab === "saved" ? "profile-nav-active" : ""}`}
            onClick={() => setCurrentTab("saved")}
          >
            <FontAwesomeIcon icon={faSave} className="profile-nav-icon" />
            <span>SAVED</span>
          </motion.li>
        </motion.ul>
      </nav>
      
      <AnimatePresence mode="wait">
        <motion.section
          key={currentTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="profile-content-grid"
        >
          {currentTab === "post" && (
            post.map((p, index) => (
              <motion.div 
                className="profile-content-item"
                key={index}
                whileHover={{ scale: 0.98 }}
                onMouseEnter={() => setIsHoveringPost(index)}
                onMouseLeave={() => setIsHoveringPost(null)}
              >
                <img
                  src={p?.media?.url}
                  alt={`Post ${index + 1}`}
                  className="profile-content-image"
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(setComment({
                      media: p.media.url,
                      type: "post",
                      comment: p.comment,
                      _id: p._id,
                      on: "media"
                    }));
                    dispatch(setShowComment(true));
                  }}
                  onError={(e) => (e.target.src = DEFAULT_POST)}
                />
                {isHoveringPost === index && (
                  <motion.div 
                    className="profile-content-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="profile-content-stats">
                      <span><FontAwesomeIcon icon={faHeart} /> {p.likes?.length || 0}</span>
                      <span><FontAwesomeIcon icon={faComment} /> {p.comments?.length || 0}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
          
          {currentTab === "reel" && (
            reels.map((r, index) => (
              <motion.div 
                className="profile-content-item"
                key={index}
                whileHover={{ scale: 0.98 }}
              >
                <video
                  muted
                  src={r?.media?.url}
                  alt={`Reel ${index + 1}`}
                  className="profile-content-video"
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(setComment({
                      media: r.media.url,
                      type: "reel",
                      comment: r?.comment,
                      _id: r._id,
                      on: "media"
                    }));
                    dispatch(setShowComment(true));
                  }}
                  onError={(e) => (e.target.src = DEFAULT_REEL)}
                />
                <div className="profile-reel-indicator">
                  <FontAwesomeIcon icon={faVideo} />
                </div>
              </motion.div>
            ))
          )}
          
          {currentTab === "saved" && (
            <>
              {savedPost && savedPost.map((element, index) => (
                <motion.div 
                  className="profile-content-item"
                  key={`post-${index}`}
                  whileHover={{ scale: 0.98 }}
                >
                  <img
                    src={element?.media?.url}
                    alt="Saved Post"
                    className="profile-content-image"
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(setComment({
                        media: element?.media?.url,
                        type: "post",
                        comment: element?.comment,
                        _id: element?._id,
                        on: "media"
                      }));
                      dispatch(setShowComment(true));
                    }}
                    onError={(e) => (e.target.src = DEFAULT_POST)}
                  />
                  <div className="profile-saved-indicator">
                    <FontAwesomeIcon icon={faBookmark} />
                  </div>
                </motion.div>
              ))}
              
              {savedReel && savedReel.map((element, index) => (
                <motion.div 
                  className="profile-content-item"
                  key={`reel-${index}`}
                  whileHover={{ scale: 0.98 }}
                >
                  <video
                    muted
                    src={element?.media?.url}
                    alt="Saved Reel"
                    className="profile-content-video"
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(setComment({
                        media: element?.media?.url,
                        type: "reel",
                        comment: element?.comment,
                        _id: element?._id,
                        on: "media"
                      }));
                      dispatch(setShowComment(true));
                    }}
                    onError={(e) => (e.target.src = DEFAULT_REEL)}
                  />
                  <div className="profile-saved-indicator">
                    <FontAwesomeIcon icon={faBookmark} />
                  </div>
                  <div className="profile-reel-indicator">
                    <FontAwesomeIcon icon={faVideo} />
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </motion.section>
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;