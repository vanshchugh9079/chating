import React, { useEffect, useRef } from 'react';
import "../css/notificationBar.css";
import { useSocket } from '../socket/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setComment, setShowComment } from '../redux/slice/commentSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMultiply, 
  faBell, 
  faUserPlus, 
  faHeart, 
  faComment,
  faCheckCircle,
  faTimesCircle,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons';
import { showNoti } from '../redux/slice/showMobileNotification';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBar({ showBar, notifications, setShowBar, showNotificationBar, setShowNotificationBar, setDecresWidth, allNotification, setNotifications }) {
  const user = useSelector(state => state.user.user);
  const onMobile = useSelector((state) => state.showNoti.show);
  const socket = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // Auto-scroll to top when notifications change
  useEffect(() => {
    if (notificationRef.current) {
      notificationRef.current.scrollTop = 0;
    }
  }, [notifications]);

  const handleRequest = (notification, accept, e) => {
    e.stopPropagation();
    socket.emit("accept-request", {
      userId: notification.user._id,
      id: user._id,
      accept
    });
  };

  const handleFollow = (notification, e) => {
    e.stopPropagation();
    socket.emit("follow-user", { userId: notification.user._id });
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'request': return faUserPlus;
      case 'like': return faHeart;
      case 'comment': return faComment;
      default: return faBell;
    }
  };

  const handleNotificationClick = (notification) => {
    socket.emit("read-notification", allNotification);
    setNotifications(0);

    if (notification.on === "post") {
      dispatch(setComment({
        media: notification.post.media.url,
        type: "post",
        comment: notification.post.comment,
        _id: notification.post._id,
        on: "media"
      }));
      dispatch(setShowComment(true));
      dispatch(showNoti(false));
    } 
    else if (notification.on === "reel") {
      dispatch(setComment({
        media: notification.reel.media.url,
        type: "reel",
        comment: notification.reel.comment,
        _id: notification.reel._id,
        on: "media"
      }));
      dispatch(setShowComment(true));
      dispatch(showNoti(false));
    } 
    else if (notification.on === "profile") {
      setShowBar(false);
      dispatch(showNoti(false));
      navigate("/profile/" + notification.profile.name);
    }
  };

  const handleClose = () => {
    dispatch(showNoti(false));
    setShowBar(true);
    setShowNotificationBar(false);
    
    if(location.pathname.split("/").includes("message")){
      return;
    }
    
    setDecresWidth(false)
  };

  return (
    <AnimatePresence>
      {(showBar || onMobile) && (
        <motion.div 
          className={`notification-bar ${onMobile ? "mobile" : ""}`}
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25 }}
          ref={notificationRef}
        >
          <div className="notification-header">
            {onMobile && (
              <motion.button
                className="mobile-back-btn"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </motion.button>
            )}
            
            <motion.h4 
              className="notification-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FontAwesomeIcon icon={faBell} className="bell-icon" />
              Notifications
            </motion.h4>
            
            {!onMobile && (
              <motion.div 
                className="close-btn"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FontAwesomeIcon icon={faMultiply} />
              </motion.div>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="empty-bell">
                  <FontAwesomeIcon icon={faBell} />
                </div>
                <p>No notifications yet</p>
                <small>When you get notifications, they'll appear here</small>
              </motion.div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    className={`notification-item ${!notification.seen ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: onMobile ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="notification-content">
                      <div className="avatar-container">
                        {notification?.user?.avatar?.url ? (
                          <motion.img
                            src={notification.user.avatar.url}
                            className="user-avatar"
                            alt={notification.user.username}
                            whileHover={{ scale: 1.1 }}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            <FontAwesomeIcon icon={getNotificationIcon(notification.type)} />
                          </div>
                        )}
                      </div>
                      
                      <div className="notification-details">
                        <p className="notification-text">
                          {notification.content}
                        </p>
                        <small className="notification-time">
                          {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </div>
                    </div>

                    {notification.type === "request" && (
                      <motion.div 
                        className="action-buttons"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.button
                          className="accept-btn"
                          onClick={(e) => handleRequest(notification, true, e)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} /> {onMobile ? '' : 'Accept'}
                        </motion.button>
                        <motion.button
                          className="reject-btn"
                          onClick={(e) => handleRequest(notification, false, e)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FontAwesomeIcon icon={faTimesCircle} /> {onMobile ? '' : 'Reject'}
                        </motion.button>
                      </motion.div>
                    )}

                    {notification.type === "follow" && (
                      <motion.button
                        className="follow-btn"
                        onClick={(e) => handleFollow(notification, e)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {onMobile ? 'Follow' : 'Follow Back'}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}