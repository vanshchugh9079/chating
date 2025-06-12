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
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        navigate("/")
        dispatch(setShowCall(true))
        dispatch(setCall(data))
      }
      let handleCallEnded = (data) => {
        dispatch(setShowCall(false))
      }
      let handleMakeCall = (call) => {
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

  const sidebarClass = classNames('sidebar-container', {
    'desktop-sidebar': !isMobile,
    'mobile-sidebar': isMobile,
    'sidebar-dec': decreaseWidth && !isMobile,
  });

  const mobileNavItems = [
    { icon: faHouse, label: "Home", path: "/", className: "home" },
    { icon: faVideo, label: "Reels", path: "/reel", className: "reels" },
    { icon: faPlus, label: "Create", path: null, className: "create", action: () => dispatch(setShowModel(false)) },
    { icon: faMessage, label: "Message", path: "/message", className: "message", notification: messageNoti },
    { icon: faUser, label: "Profile", path: `/profile/${user?.name || 'guest'}`, className: "v-profile" },
  ];

  const desktopNavItems = [
    { icon: faHouse, label: "Home", path: "/", className: "home" },
    { icon: faMagnifyingGlass, label: "Search", path: "/search", className: "search" },
    { icon: faCompass, label: "Explore", path: "/explore", className: "explore" },
    { icon: faVideo, label: "Reels", path: "/reel", className: "reels" },
    { icon: faMessage, label: "Message", path: "/message", className: "message", notification: messageNoti },
    { icon: faBell, label: "Notification", path: null, className: "notification", action: goNotification, notification: notifications },
    { icon: faUser, label: "Profile", path: `/profile/${user?.name || 'guest'}`, className: "v-profile" },
    { icon: faPlus, label: "Create", path: null, className: "create", action: () => dispatch(setShowModel(false)) },
  ];

  return (
    <>
      <Row className="m-0 p-0">
        <div className={sidebarClass}>
          {!isMobile && (
            <div className="sidebar-header">
              {!decreaseWidth ? (
                <h2 className="logo-text">Chat Fight</h2>
              ) : (
                <img src={logo} alt="logo" className="logo-img" width={50} height={50} />
              )}
            </div>
          )}

          <ul className="sidebar-nav">
            {(isMobile ? mobileNavItems : desktopNavItems).map((item) => (
              <div key={item.className} className={item.className}>
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
                  >
                    {item.notification > 0 && (
                      <span className={`notification-badge ${item.className === "message" ? "message-badge" : ""}`}>
                        {item.notification}
                      </span>
                    )}
                  </SidebarItem>
                </div>
              </div>
            ))}

            {!isMobile && (
              <Dropdown className="more-dropdown">
                <Dropdown.Toggle
                  variant="transparent"
                  id="dropdown-basic"
                  className="dropdown-toggle"
                  aria-label="More Options"
                >
                  <FontAwesomeIcon icon={faBars} />
                  {!decreaseWidth && <span>More</span>}
                </Dropdown.Toggle>

                <Dropdown.Menu className="dropdown-menu">
                  <Dropdown.Item
                    className="logout-item"
                    onClick={() =>
                      popup("warning", "Are you sure to log out?", "", true, 10000000, true, dispatch, navigate)
                    }
                  >
                    Log Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </ul>
        </div>
      </Row>
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

const SidebarItem = ({ icon, label, decreaseWidth, onClick, isMobile, children }) => (
  <li
    className={`sidebar-item ${isMobile ? 'mobile-item' : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
    aria-label={label}
  >
    <div className="icon-container">
      <FontAwesomeIcon icon={icon} className={`nav-icon ${isMobile ? 'mobile-icon' : ''}`} />
      {children}
    </div>
    {(!decreaseWidth || isMobile) && <span className="nav-label">{label}</span>}
  </li>
);

SidebarItem.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string,
  decreaseWidth: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node,
  isMobile: PropTypes.bool,
};

SidebarItem.defaultProps = {
  label: '',
  decreaseWidth: false,
  onClick: () => {},
  children: null,
  isMobile: false,
};

export default Sidebar;
export { SidebarItem };