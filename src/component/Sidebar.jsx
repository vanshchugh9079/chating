import React, { useEffect, useState, useCallback, useRef } from 'react';
import "../css/sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faBell, faCompass, faEllipsisH, faHouse,
  faMagnifyingGlass, faMessage, faPlus, faUser, faVideo
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setShowModel } from '../redux/slice/showCreateModel';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Row } from 'react-bootstrap';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import logo from "../asset/images/favicon.webp";
import { useSocket } from '../socket/SocketContext';
import { api } from '../contant';
import NotificationBar from './NotificationBar';
import { setUserData } from '../redux/slice/user.slice';
import popup from '../model/popup';
import { setCall, setShowCall, setWho } from '../redux/slice/callSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const [decreaseWidth, setDecreaseWidth] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [messageNoti, setMessageNoti] = useState(0);
  const [allNotification, setAllNotification] = useState([]);
  const [showNotificationBar, setShowNotificationBar] = useState(false);
  const [current, setCurrent] = useState("home");
  const [prev, setPrev] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const sidebarRef = useRef(null);

  const socket = useSocket();

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  let handleBorder = () => {
    if (!current) return;
    if (prev === current) return;
    let currElement = document.querySelector("." + current);
    let prevElement = document.querySelector("." + prev);
    if (currElement) {
      currElement.classList.add("active");
      if (prevElement) prevElement.classList.remove("active");
      setPrev(current);
    }
  };

  const goNotification = useCallback(() => {
    const isMessagePage = location.pathname.includes("message");
    if (showNotificationBar) {
      socket.emit("read-notification", allNotification);
      setNotifications(0);
    }
    setShowNotificationBar(!showNotificationBar);
    if (isMessagePage) {
      setDecreaseWidth(true);
      return;
    }
    setDecreaseWidth(!showNotificationBar);
  }, [allNotification, location.pathname, showNotificationBar, socket]);

  const handleNavigation = useCallback((path, adjustWidth = false) => {
    if (adjustWidth) setDecreaseWidth(true);
    if (showNotificationBar) {
      socket.emit("read-notification", allNotification);
      setNotifications(0);
    }
    setShowNotificationBar(false);
    if (isMobile) setShowMobileMenu(false);
    navigate(path);
  }, [allNotification, navigate, showNotificationBar, socket, isMobile]);

  useEffect(() => {
    setDecreaseWidth(location.pathname.includes("message"));
    if (location.pathname.includes("message")) {
      setCurrent("message")
    }
    else if (location.pathname.includes("profile")) {
      setCurrent("v-profile");
    }
  }, [location]);

  useEffect(() => {
    handleBorder()
  }, [current, location])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        let sum = 0;
        const mesResponse = await api.get("/notification/get/message", {
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        setMessageNoti(mesResponse.data.data.length);

        const notificationTypes = ["post", "reel", "follow", "request", "information"];
        const arr = [];
        for (const type of notificationTypes) {
          const response = await api.get(`/notification/get/${type}`, {
            headers: { 'Authorization': `Bearer ${user.token}` },
          });
          console.log(response);

          response.data.data.forEach((element) => {
            if (!element.seen) sum += 1;
          });
          arr.push(...response.data.data);
        }
        setAllNotification(arr);
        setNotifications(sum);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleMessageReceived = (data) => setMessageNoti((prev) => prev + 1);
      const handleNotification = (data) => {
        setNotifications((prev) => prev + 1);
        setAllNotification((prev) => [...prev, data.notification]);
      };
      const handleYourNotification = (data) => {
        setNotifications((prev) => prev - 1);
        setAllNotification((prev) => prev.filter((e) => e._id !== data.notification._id));
      };
      const handleRead = (data) => data && setAllNotification(data);
      let handleCall = (data) => {
        console.log(data);
        navigate("/")
        dispatch(setShowCall(true))
        dispatch(setCall(data))
      }
      let handleCallEnded = (data) => {
        dispatch(setShowCall(false))
      }
      let handleMakeCall = (call) => {
        console.log(call);
        dispatch(setShowCall(true))
        navigate("/")
        if(call.sender==user._id){
          dispatch(setWho("sender"))
        }
        else{
          dispatch(setWho("receiver"))
        }
        dispatch(setCall(call))
      }
      socket.on("unfollow", handleNotification);
      socket.on("follow", handleNotification);
      socket.on('message-recieved', handleMessageReceived);
      socket.on("follow-request", handleNotification);
      socket.on("accept-request", handleNotification);
      socket.on("liked-post", handleNotification);
      socket.on("comment-post", handleNotification)
      socket.on("accept-request-success", handleYourNotification);
      socket.on("decline-request-success", handleYourNotification);
      socket.on("read-notification", handleRead);
      socket.on("recieving-call", handleCall)
      socket.on("call-ended", handleCallEnded)
      socket.on("make-call", handleMakeCall)
      socket.on("recieving-call", handleMakeCall)

      return () => {
        socket.off('message-recieved', handleMessageReceived);
        socket.off("follow", handleNotification);
        socket.off("unfollow", handleNotification);
        socket.off("follow-request", handleNotification);
        socket.off("accept-request", handleNotification);
        socket.off("accept-request-success", handleYourNotification);
        socket.off("decline-request-success", handleYourNotification);
        socket.off("read-notification", handleRead);
        socket.off("liked-post", handleNotification);
        socket.off("comment-post", handleNotification)
        socket.off("recieving-call", handleCall)
        socket.off("call-ended", handleCallEnded)
        socket.off("make-call", handleMakeCall)
      };
    }
  }, [socket]);

  const sidebarClass = classNames('bg-black d-none d-lg-block sidebar', {
    'w-25': !decreaseWidth,
    'sidebar-dec': decreaseWidth,
  });

  const mobileSidebarClass = classNames('mobile-sidebar bg-black', {
    'open': showMobileMenu,
  });

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  return (
    <>
      {/* Mobile Hamburger Menu Button */}
      {isMobile && (
        <motion.button 
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          whileTap={{ scale: 0.9 }}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={faBars} size="lg" />
        </motion.button>
      )}

      {/* Desktop Sidebar */}
      <Row className="m-0 p-0 d-none d-lg-flex">
        <div className={sidebarClass}>
          {!decreaseWidth ? (
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Chat Fight
            </motion.h2>
          ) : (
            <motion.img 
              src={logo} 
              alt="logo" 
              className="m-0 p-0 d-inline bg-black logo-img" 
              width={50} 
              height={50}
              whileHover={{ scale: 1.1 }}
            />
          )}

          <ul className="d-flex flex-column gap-3 p-0 m-0">
            {[
              { icon: faHouse, label: "Home", path: "/", className: "home" },
              { icon: faMagnifyingGlass, label: "Search", path: "/search", className: "search" },
              { icon: faCompass, label: "Explore", path: "/explore", className: "explore" },
              { icon: faVideo, label: "Reels", path: "/reel", className: "reels" },
              { 
                icon: faMessage, 
                label: "Message", 
                path: "/message", 
                className: "message",
                badge: messageNoti > 0 ? messageNoti : null,
                adjustWidth: true
              },
              { 
                icon: faBell, 
                label: "Notification", 
                path: null, 
                className: "notification",
                badge: notifications > 0 ? notifications : null,
                onClick: goNotification
              },
              { 
                icon: faUser, 
                label: "Profile", 
                path: `/profile/${user?.name || 'guest'}`, 
                className: "v-profile" 
              },
              { 
                icon: faPlus, 
                label: "Create", 
                path: null, 
                className: "create",
                onClick: () => dispatch(setShowModel(false))
              },
            ].map((item, index) => (
              <div 
                key={index} 
                className={item.className}
                onClick={() => {
                  setCurrent(item.className);
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.path) {
                    handleNavigation(item.path, item.adjustWidth);
                  }
                }}
              >
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  decreaseWidth={decreaseWidth}
                >
                  {item.badge && (
                    <motion.span 
                      className={`notification-badge${item.className === 'message' ? '-message' : ''} m-0 p-0`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </SidebarItem>
              </div>
            ))}

            <Dropdown className="v-dd mt-1">
              <Dropdown.Toggle
                variant="black"
                id="dropdown-basic"
                className="text-white d-flex align-items-center gap-2 p-0"
                onMouseEnter={(e) => e.preventDefault()}
                aria-label="More Options"
              >
                <FontAwesomeIcon icon={faBars} className="text-white" />
                {!decreaseWidth && <span>More</span>}
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow w-25 v-drop-item">
                <Dropdown.Item
                  className="text-danger fw-bold"
                  onClick={() =>
                    popup("warning", "Are you sure to log out?", "", true, 10000000, true, dispatch, navigate)
                  }
                >
                  Log Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </ul>
        </div>
      </Row>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobile && showMobileMenu && (
          <motion.div
            className={mobileSidebarClass}
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            ref={sidebarRef}
          >
            <div className="mobile-sidebar-header">
              <img src={logo} alt="logo" className="logo-img" width={50} height={50} />
              <h2>Chat Fight</h2>
            </div>

            <ul className="mobile-sidebar-menu">
              {[
                { icon: faHouse, label: "Home", path: "/", className: "home" },
                { icon: faMagnifyingGlass, label: "Search", path: "/search", className: "search" },
                { icon: faCompass, label: "Explore", path: "/explore", className: "explore" },
                { icon: faVideo, label: "Reels", path: "/reel", className: "reels" },
                { 
                  icon: faMessage, 
                  label: "Message", 
                  path: "/message", 
                  className: "message",
                  badge: messageNoti > 0 ? messageNoti : null
                },
                { 
                  icon: faBell, 
                  label: "Notification", 
                  path: null, 
                  className: "notification",
                  badge: notifications > 0 ? notifications : null,
                  onClick: goNotification
                },
                { 
                  icon: faUser, 
                  label: "Profile", 
                  path: `/profile/${user?.name || 'guest'}`, 
                  className: "v-profile" 
                },
                { 
                  icon: faPlus, 
                  label: "Create", 
                  path: null, 
                  className: "create",
                  onClick: () => dispatch(setShowModel(false))
                },
              ].map((item, index) => (
                <motion.li
                  key={index}
                  className={item.className}
                  onClick={() => {
                    setCurrent(item.className);
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.path) {
                      handleNavigation(item.path);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    decreaseWidth={false}
                    forMobile={true}
                  >
                    {item.badge && (
                      <span className={`notification-badge${item.className === 'message' ? '-message' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </SidebarItem>
                </motion.li>
              ))}

              <motion.li
                className="logout-item"
                onClick={() => popup("warning", "Are you sure to log out?", "", true, 10000000, true, dispatch, navigate)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faBars} className="me-2" />
                <span>Log Out</span>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile menu */}
      {isMobile && showMobileMenu && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      <NotificationBar 
        showBar={showNotificationBar} 
        setShowBar={setShowNotificationBar} 
        setDecresWidth={setDecreaseWidth} 
        notifications={allNotification} 
        allNotification={allNotification} 
        setNotifications={setNotifications} 
      />
    </>
  );
};

const SidebarItem = ({ icon, label, decreaseWidth, onClick, forMobile, children }) => (
  <motion.li
    className="fs-6 d-flex align-items-center position-relative"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="notification-icon">
      <FontAwesomeIcon 
        icon={icon} 
        className={`me-2 ${forMobile && "fs-2 ms-auto me-auto mb-auto mt-auto"}`} 
      />
      {children}
    </div>
    {!decreaseWidth && (
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label}
      </motion.span>
    )}
  </motion.li>
);

SidebarItem.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string,
  decreaseWidth: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node,
  forMobile: PropTypes.bool,
};

SidebarItem.defaultProps = {
  label: '',
  decreaseWidth: false,
  onClick: () => { },
  children: null,
  forMobile: false,
};

export default Sidebar;
export { SidebarItem };