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
  const [isOpen, setIsOpen] = useState(false);

  const socket = useSocket();

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

  const sidebarClass = classNames('bg-black  d-none d-lg-block sidebar', {
    'w-25': !decreaseWidth,
    'sidebar-dec': decreaseWidth,
  });

  return (
    <>
      <Row className="m-0 p-0 ">
        <div className={sidebarClass}>
          {!decreaseWidth ? (
            <h2>Chat Fight</h2>
          ) : (
            <img src={logo} alt="logo" className="m-0 p-0 d-inline bg-black logo-img" width={50} height={50} />
          )}

          <ul className="d-flex flex-column gap-3 p-0 m-0 ">
            <div className='home '>
              <SidebarItem
                icon={faHouse}
                label="Home"
                decreaseWidth={decreaseWidth}
                onClick={() => {
                  setCurrent("home");
                  handleNavigation("/")
                }}
              />
            </div>
            <div className='search'>
              <SidebarItem
                icon={faMagnifyingGlass}
                label="Search"
                decreaseWidth={decreaseWidth}
                onClick={() => {
                  setCurrent("search")
                  handleNavigation("/search")
                }}
              />
            </div>
            <div className='explore' onClick={() => {
              setCurrent("explore")
              handleNavigation("/explore")
            }}>
              <SidebarItem
                icon={faCompass}
                label="Explore"
                decreaseWidth={decreaseWidth}
              />
            </div>
            <div className='reels'>
              <SidebarItem
                icon={faVideo}
                label="Reels"
                decreaseWidth={decreaseWidth}
                onClick={() => {
                  setCurrent("reels")
                  handleNavigation("/reel")
                }}
              />
            </div>
            <div className='message'>
              <div className="notification-icon m-0 p-0">
                <SidebarItem
                  icon={faMessage}
                  label="message"
                  decreaseWidth={decreaseWidth}
                  onClick={() => {
                    setCurrent("message")
                    handleNavigation("/message", true);
                    setShowNotificationBar(false);
                  }}
                >
                  {messageNoti > 0 && (
                    <span className="notification-badge-message m-0 p-0">{messageNoti}</span>
                  )}
                </SidebarItem>
              </div>
            </div>
            <div className='notification'>
              <div className="notification-icon m-0 p-0">
                <SidebarItem
                  icon={faBell}
                  label="Notification"
                  decreaseWidth={decreaseWidth}
                  onClick={() => {
                    setCurrent("notification")
                    goNotification();
                  }}
                >
                  {notifications > 0 && (
                    <span className="notification-badge m-0 p-0">{notifications}</span>
                  )}
                </SidebarItem>
              </div>
            </div>
            <div className='v-profile'>
              <SidebarItem
                icon={faUser}
                label="Profile"
                decreaseWidth={decreaseWidth}
                onClick={() => {
                  setCurrent("v-profile")
                  handleNavigation(`/profile/${user?.name || 'guest'}`)
                }}
              />
            </div>
            <div className='create'>
              <SidebarItem
                icon={faPlus}
                label="Create"
                decreaseWidth={decreaseWidth}
                onClick={() => {
                  setCurrent("create")
                  dispatch(setShowModel(false))
                }}
              />
            </div>
            <Dropdown className="v-dd mt-1 ">
              <Dropdown.Toggle
                variant="black"
                id="dropdown-basic"
                className="text-white d-flex align-items-center gap-2 p-0 "
                onMouseEnter={(e) => e.preventDefault()}
                aria-label="More Options"
              >
                <FontAwesomeIcon icon={faBars} className="text-white" />
                {!decreaseWidth && <span>More</span>}
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow  w-25  v-drop-item     ">
                <Dropdown.Item
                  className="text-danger  fw-bold   "
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
      <NotificationBar showBar={showNotificationBar} setShowBar={setShowNotificationBar} setDecresWidth={setDecreaseWidth} notifications={allNotification} allNotification={allNotification} setNotifications={setNotifications} />
    </>
  );
};

const SidebarItem = ({ icon, label, decreaseWidth, onClick, forMobile, children }) => (
  <li
    className="fs-6 d-flex align-items-center position-relative"
    onClick={onClick}
    role="button"

    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
  >
    <div className="notification-icon">
      <FontAwesomeIcon icon={icon} className={`me-2 ${forMobile && "fs-2 ms-auto me-auto mb-auto mt-auto"}`} />
      {children}
    </div>
    {!decreaseWidth && <span>{label}</span>}
  </li>
);

SidebarItem.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string,
  decreaseWidth: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

SidebarItem.defaultProps = {
  label: '',
  decreaseWidth: false,
  onClick: () => { },
  children: null,
};

export default Sidebar;
export { SidebarItem }