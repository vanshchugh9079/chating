import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../css/mainContent.css';
import Post from './Post';
import Story from './Story';
import { useDispatch, useSelector } from 'react-redux';
import fetchPost from '../fetch/fethPost';
import RightSidebar from './RightSlidebar';
import { setShowModel } from '../redux/slice/showCreateModel';
import fetchStory from '../fetch/fetchStory';
import { useSocket } from "../socket/SocketContext";
import { api } from '../contant';
import { setShowStory, setStory } from '../redux/slice/showStoryModel';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomSidebar from './BottomSidebar';
import { SidebarItem } from './Sidebar';
import { faBell, faMessage } from '@fortawesome/free-solid-svg-icons';
import { showMessage, showNoti } from '../redux/slice/showMobileNotification';
import Call from './Call';

function MainContent() {
  const storiesRef = useRef(null);
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.post.posts);
  const user = useSelector((state) => state.user.user);
  const yourStory = useSelector((state) => state.yourStory.story);
  const [teriStory, setTeriStory] = useState(yourStory);
  const socket = useSocket();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [allStory, setAllStory] = useState([]);
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState(0);
  const [messageNoti, setMessageNoti] = useState(0);
  const [allNotification, setAllNotification] = useState([]);
  const [showNotificationBar, setShowNotificationBar] = useState(false);
  const showCall = useSelector((state) => state.call.showCall)
  let postId = searchParams.get("id");
  const postRefs = useRef({});
  let navigate = useNavigate();
  const handleNavigation = useCallback((path, adjustWidth = false) => {
    if (showNotificationBar) {
      socket.emit("read-notification", allNotification);
      setNotifications(0);
    }
    setShowNotificationBar(false);
    navigate(path);
  }, [allNotification, navigate, showNotificationBar, socket]);

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
      };
    }
  }, [socket]);
  const goNotification = useCallback(() => {
    if (showNotificationBar) {
      socket.emit("read-notification", allNotification);
      setNotifications(0);
    }
    dispatch(showNoti(true))
  }, [allNotification, location.pathname, showNotificationBar, socket]);
  useEffect(() => {
    if (postId && postRefs.current[postId]) {
      postRefs.current[postId].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [postId, posts]);
  useEffect(() => {
    dispatch(showMessage(false))
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

  // Fetch posts on mount
  useEffect(() => {
    fetchPost(user.token, dispatch, navigate);
  }, [user.token, dispatch]);

  // Fetch stories
  useEffect(() => {
    (async () => {
      try {
        const response = await fetchStory(user.token);
        const storyData = response.data.data;

        // Group stories by user name
        const storyMap = {};

        storyData.forEach((story) => {
          const userName = story.user?.name;
          if (userName) {
            if (!storyMap[userName]) {
              storyMap[userName] = [];
            }
            storyMap[userName].push(story);
          }
        });

        // Convert grouped stories into an array
        setAllStory(Object.values(storyMap));

      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    })();
  }, [user.token]);

  // Handle socket events
  useEffect(() => {
    if (socket) {
      const addedStory = (data) => {
        if (data) {
          setAllStory((prev) => {
            const updatedStories = [...prev];
            const userName = data.user?.name;
            if (userName) {
              const existingGroup = updatedStories.find(group => group[0]?.user?.name === userName);
              if (existingGroup) {
                existingGroup.push(data);
              } else {
                updatedStories.push([data]);
              }
            }
            return updatedStories;
          });
        }
      };

      const onAddedYouStory = (data) => {
        setTeriStory((prev) => [...prev, data]);
      };

      socket.on("new-story", addedStory);
      socket.on("story-added", onAddedYouStory);

      return () => {
        socket.off("new-story", addedStory);
        socket.off("story-added", onAddedYouStory);
      };
    }
  }, [socket]);

  useEffect(() => {
    let getYourStory = async () => {
      try {
        let response = await api.get("/story/get/" + user._id, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        setTeriStory(response.data.data);
      } catch (error) {
        console.error("Error fetching your story:", error);
      }
    };
    getYourStory();
  }, [yourStory]);

  // Scroll stories section
  const scrollStories = useCallback((direction) => {
    const scrollAmount = 48;
    if (storiesRef.current) {
      storiesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  // Update scroll buttons visibility
  const updateScrollButtons = useCallback(() => {
    if (storiesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  }, []);

  useEffect(() => {
    const ref = storiesRef.current;
    if (ref) {
      ref.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons(); // Initial check
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', updateScrollButtons);
      }
    };
  }, [updateScrollButtons]);

  return (
    <div className='w-100 position-relative  vh-100 '>
      {
        showCall  &&
        <div className='position-fixed z-plus bg-black w-100 h-100 '>
          <Call />
        </div>
      }
      <div className=' d-flex  align-items-center   mb-0 bg-secondory    d-lg-none text-white'>
        <div className='d-flex justify-content-center align-items-center bg-secondory '>
          <h1 className='insta-text fw-bold mt-2 ms-1'>Chat Fight</h1>
        </div>
        <div className='d-flex ms-auto  gap-1'>
          <div className='message'>
            <div className="notification-icon    d-flex justify-content-center pointer circle  ">
              <SidebarItem
                icon={faMessage}
                label=""
                forMobile={true}
                decreaseWidth={true}
                onClick={() => {
                  dispatch(showMessage(true))
                  handleNavigation("/message", true);
                }}
              >
                {messageNoti > 0 && (
                  <span className="notification-badge-message m-0 p-0">{messageNoti}</span>
                )}
              </SidebarItem>
            </div>
          </div>
          <div className='notification'>
            <div className="notification-icon m-0 p-0 d-flex justify-content-center circle m-0 p-0">
              <SidebarItem
                icon={faBell}
                label=""
                decreaseWidth={true}
                forMobile={true}
                onClick={() => {
                  goNotification();
                }}
              >
                {notifications > 0 && (
                  <span className="notification-badge m-0 p-0">{notifications}</span>
                )}
              </SidebarItem>
            </div>
          </div>
        </div>
      </div>
      <div className="main-content w-100 mt-0 mb-0 ">
        {/* Stories Section */}
        <div className="stories-container justify-content-center ms-0 ms-lg-auto me-lg-auto d-flex">
          {canScrollLeft && (
            <button className="mt-2 scroll-button left" onClick={() => scrollStories('left')}>
              &#8249;
            </button>
          )}
          <div className="stories" ref={storiesRef}>
            <div className="text-center">
              <div className="story rounded-circle position-relative " onClick={() => {
                if (teriStory.length === 0) {
                  dispatch(setShowModel(true));
                } else {
                  dispatch(setStory({
                    name: teriStory[0].user.name,
                    media: teriStory,
                    avatar: teriStory[0].user.avatar,
                    you: true
                  }));
                  dispatch(setShowStory(true));
                }
              }}>
                <img src={user.avatar.url} alt="user" className="w-100 h-100 rounded-circle" />
                <div className='mt-2 p-2 text-white rounded-circle  v-plus end-0 rounded-circle'>
                  <h6 className="fs-3 text-white mt-1">+</h6>
                </div>
              </div>
              <p className="text-white story-text me-2">you</p>
            </div>
            {allStory.map((storyGroup, index) => (
              <Story
                key={index}
                media={storyGroup}
                name={storyGroup[0]?.user?.name}
                avatar={storyGroup[0]?.user?.avatar}
              />
            ))}
          </div>
          {canScrollRight && (
            <button className="scroll-button right mt-2" onClick={() => scrollStories('right')}>
              &#8250;
            </button>
          )}
        </div>

        {/* Posts Section */}
        <div className="posts">
          {posts.map((element) => (
            <Post
              ref={(el) => (postRefs.current[element._id] = el)}
              id={element._id}
              youLiked={element.youLiked}
              likes={element.likes.length}
              _id={element._id}
              key={element._id}
              src={element.media.url}
              avatar={element.createdBy.avatar.url}
              userName={element.createdBy._id === user._id ? "you" : element.createdBy.userName}
              createdAt={element.createdAt}
              comment={element.comment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MainContent;
