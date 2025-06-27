import React, { useEffect, useState, useCallback } from 'react';
import "../css/sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faBell, faCompass, faEllipsisH, faHouse,
  faMagnifyingGlass, faMessage, faPlus, faUser, faVideo
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setShowModel } from '../redux/slice/showCreateModel';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import logo from "../asset/images/favicon.webp";
import { useSocket } from '../socket/SocketContext';
import { api } from '../contant';
import NotificationBar from './NotificationBar';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideIn, staggerContainer } from '../utlis/motion';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [isOpen, setIsOpen] = useState(false);

  const socket = useSocket();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992 && showNotificationBar) {
        setShowNotificationBar(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showNotificationBar]);

  const handleBorder = () => {
    if (!current) return;
    if (prev === current) return;
    let currElement = document.querySelector("." + current);
    let prevElement = document.querySelector("." + prev);
    if (currElement) {
      currElement.classList.add("active");
      if (prevElement) prevElement.classList.remove("active");
      setPrev(current);
    }
  }

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
    navigate(path);
  }, [allNotification, navigate, showNotificationBar, socket]);

  useEffect(() => {
    setDecreaseWidth(location.pathname.includes("message"));
    if (location.pathname.includes("message")) {
      setCurrent("message")
    }
    else if (location.pathname.includes("profile")) {
      setCurrent("v-profile");
    }
    else if (location.pathname.includes("reel")) {
      setCurrent("reels");
    }
    else if (location.pathname.includes("search")) {
      setCurrent("search");
    }
    else if (location.pathname.includes("explore")) {
      setCurrent("explore");
    }
    else {
      setCurrent("home");
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

  const sidebarClass = classNames('sidebar-container', {
    'desktop-sidebar': !isMobile,
    'mobile-sidebar': isMobile,
    'sidebar-dec': decreaseWidth && !isMobile,
    'dark-theme': true,
  });

  // Color scheme for icons
  const iconColors = {
    home: '#FF6B6B',
    search: '#4ECDC4',
    explore: '#45B7D1',
    reels: '#FFA5A5',
    message: '#A5FFD6',
    notification: '#FFD166',
    profile: '#A5A5FF',
    create: '#FF85A5',
    more: '#C4C4C4'
  };

  const mobileNavItems = [
    { icon: faHouse, label: "Home", path: "/", className: "home", color: iconColors.home },
    { icon: faVideo, label: "Reels", path: "/reel", className: "reels", color: iconColors.reels },
    { icon: faPlus, label: "Create", path: null, className: "create", color: iconColors.create, action: () => dispatch(setShowModel(false)) },
    { icon: faMessage, label: "Message", path: "/message", className: "message", color: iconColors.message, notification: messageNoti },
    { icon: faUser, label: "Profile", path: `/profile/${user?.name || 'guest'}`, className: "v-profile", color: iconColors.profile },
  ];

  const desktopNavItems = [
    { icon: faHouse, label: "Home", path: "/", className: "home", color: iconColors.home },
    { icon: faMagnifyingGlass, label: "Search", path: "/search", className: "search", color: iconColors.search },
    { icon: faCompass, label: "Explore", path: "/explore", className: "explore", color: iconColors.explore },
    { icon: faVideo, label: "Reels", path: "/reel", className: "reels", color: iconColors.reels },
    { icon: faMessage, label: "Message", path: "/message", className: "message p-0 v-mess", color: iconColors.message, notification: messageNoti },
    { icon: faBell, label: "Notification", path: null, className: "notification", color: iconColors.notification, action: goNotification, notification: notifications },
    { icon: faUser, label: "Profile", path: `/profile/${user?.name || 'guest'}`, className: "v-profile", color: iconColors.profile },
    { icon: faPlus, label: "Create", path: null, className: "create", color: iconColors.create, action: () => dispatch(setShowModel(false)) },
  ];

  return (
    <>
      <AnimatePresence>
        {!isMobile && (
          <motion.div
            className={sidebarClass}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            layout
          >
            <motion.div 
              className="sidebar-header"
              variants={fadeIn('down', 'tween', 0.1, 0.5)}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence mode="wait">
                {!decreaseWidth ? (
                  <motion.h2
                    className="logo-text"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    key="logo-text"
                  >
                    Chat Fight
                  </motion.h2>
                ) : (
                  <motion.img
                    src={logo}
                    alt="logo"
                    className="logo-img"
                    width={50}
                    height={50}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    key="logo-img"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            <motion.ul 
              className="sidebar-nav"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {desktopNavItems.map((item, index) => (
                <motion.li
                  key={item.className}
                  className={item.className}
                  variants={fadeIn('right', 'spring', index * 0.05, 0.5)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  layout
                >
                  <div className="notification-icon">
                    <SidebarItem
                      icon={item.icon}
                      label={item.label}
                      decreaseWidth={decreaseWidth && !isMobile}
                      onClick={() => {
                        setCurrent(item.className);
                        if (item.action) {
                          item.action();
                        } else if (item.path) {
                          handleNavigation(item.path, item.className === "message");
                        }
                      }}
                      isMobile={isMobile}
                      iconColor={item.color}
                      isActive={current === item.className}
                    >
                      {item.notification > 0 && (
                        <motion.span
                          className={`notification-badge ${item.className === "message" ? "message-badge" : ""}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                          style={{ 
                            backgroundColor: item.color,
                            boxShadow: `0 0 10px ${item.color}`
                          }}
                        >
                          {item.notification}
                        </motion.span>
                      )}
                    </SidebarItem>
                  </div>
                </motion.li>
              ))}

              <motion.li
                variants={fadeIn('right', 'spring', 0.4, 0.5)}
                className="more-dropdown"
              >
                <Dropdown>
                  <Dropdown.Toggle
                    variant="transparent"
                    id="dropdown-basic"
                    className="dropdown-toggle"
                    aria-label="More Options"
                    as={motion.div}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FontAwesomeIcon 
                      icon={faBars} 
                      style={{ 
                        color: iconColors.more,
                        filter: current === "more" ? `drop-shadow(0 0 5px ${iconColors.more})` : 'none'
                      }} 
                    />
                    {!decreaseWidth && (
                      <motion.span
                        initial={{ opacity: 1 }}
                        animate={{ opacity: decreaseWidth ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                        className="nav-label"
                      >
                        More
                      </motion.span>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu 
                    className="dropdown-menu dark-dropdown"
                    as={motion.div}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Dropdown.Item
                      className="logout-item"
                      onClick={() => {}}
                      as={motion.div}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      Log Out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && (
        <motion.div 
          className="mobile-sidebar"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <motion.ul 
            className="sidebar-nav"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {mobileNavItems.map((item, index) => (
              <motion.li
                key={item.className}
                className={item.className}
                variants={fadeIn('up', 'spring', index * 0.05, 0.5)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className="notification-icon">
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    decreaseWidth={false}
                    onClick={() => {
                      setCurrent(item.className);
                      if (item.action) {
                        item.action();
                      } else if (item.path) {
                        handleNavigation(item.path, item.className === "message");
                      }
                    }}
                    isMobile={isMobile}
                    iconColor={item.color}
                    isActive={current === item.className}
                  >
                    {item.notification > 0 && (
                      <motion.span
                        className={`notification-badge ${item.className === "message" ? "message-badge" : ""}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                        style={{ 
                          backgroundColor: item.color,
                          boxShadow: `0 0 10px ${item.color}`
                        }}
                      >
                        {item.notification}
                      </motion.span>
                    )}
                  </SidebarItem>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}

      <NotificationBar
        showBar={showNotificationBar}
        setShowBar={setShowNotificationBar}
        setDecresWidth={setDecreaseWidth}
        notifications={allNotification}
        allNotification={allNotification}
        setNotifications={setNotifications}
        showNotificationBar={showNotificationBar} setShowNotificationBar={setShowNotificationBar}
      />
    </>
  );
};

const SidebarItem = ({ icon, label, decreaseWidth, onClick, isMobile, children, iconColor, isActive }) => (
  <motion.div
    className={`sidebar-item ${isMobile ? 'mobile-item' : ''} ${isActive ? 'active-item' : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
    aria-label={label}
    whileHover={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      scale: 1.05
    }}
    whileTap={{ scale: 0.95 }}
    layout
  >
    <div className="icon-container">
      <FontAwesomeIcon 
        icon={icon} 
        className={`nav-icon ${isMobile ? 'mobile-icon' : ''}`}
        style={{
          color: iconColor,
          filter: isActive ? `drop-shadow(0 0 8px ${iconColor})` : 'none',
          transition: 'all 0.3s ease'
        }}
      />
      {children}
    </div>
    {(!decreaseWidth || isMobile) && (
      <motion.span
        className="nav-label"
        initial={{ opacity: 1 }}
        animate={{ opacity: decreaseWidth ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        style={{
          color: isActive ? iconColor : '#ffffff'
        }}
      >
        {label}
      </motion.span>
    )}
  </motion.div>
);

SidebarItem.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string,
  decreaseWidth: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node,
  isMobile: PropTypes.bool,
  iconColor: PropTypes.string,
  isActive: PropTypes.bool
};

SidebarItem.defaultProps = {
  label: '',
  decreaseWidth: false,
  onClick: () => {},
  children: null,
  isMobile: false,
  iconColor: '#ffffff',
  isActive: false
};

export default Sidebar;
export { SidebarItem };