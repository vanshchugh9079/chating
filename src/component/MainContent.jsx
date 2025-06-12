import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../css/mainContent.css';
import Post from './Post';
import Story from './Story';
import { useDispatch, useSelector } from 'react-redux';
import fetchPost from '../fetch/fethPost';
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const showCall = useSelector((state) => state.call.showCall);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  let postId = searchParams.get("id");
  const postRefs = useRef({});
  let navigate = useNavigate();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigation = useCallback((path, adjustWidth = false) => {
    navigate(path);
  }, [navigate]);

  // Socket event handlers
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
      socket.on("comment-post", handleNotification);
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
        socket.off("comment-post", handleNotification);
      };
    }
  }, [socket]);

  const goNotification = useCallback(() => {
    dispatch(showNoti(true));
  }, [dispatch]);

  // Scroll to specific post if ID in URL
  useEffect(() => {
    if (postId && postRefs.current[postId]) {
      setTimeout(() => {
        postRefs.current[postId].scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 300);
    }
  }, [postId, posts]);

  // Fetch notifications
  useEffect(() => {
    dispatch(showMessage(false));
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
  }, [dispatch, user.token]);

  // Fetch posts on mount
  useEffect(() => {
    fetchPost(user.token, dispatch, navigate);
  }, [user.token, dispatch, navigate]);

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

  // Handle socket events for stories
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

  // Fetch user's own story
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
  }, [yourStory, user._id, user.token]);

  // Scroll stories section
  const scrollStories = useCallback((direction) => {
    const scrollAmount = 300;
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
    <div className='main-content-container w-100'>
      <AnimatePresence>
        {showCall && (
          <motion.div 
            className='call-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Call />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      {isMobile && (
        <motion.div 
          className='mobile-header'
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className='header-content'>
            <h1 className='app-title'>Chat Fight</h1>
            <div className='header-icons'>
              <div className='message-icon'>
                <SidebarItem
                  icon={faMessage}
                  label=""
                  forMobile={true}
                  decreaseWidth={true}
                  onClick={() => {
                    dispatch(showMessage(true));
                    handleNavigation("/message", true);
                  }}
                >
                  {messageNoti > 0 && (
                    <span className="notification-badge">{messageNoti}</span>
                  )}
                </SidebarItem>
              </div>
              <div className='notification-icon'>
                <SidebarItem
                  icon={faBell}
                  label=""
                  decreaseWidth={true}
                  forMobile={true}
                  onClick={goNotification}
                >
                  {notifications > 0 && (
                    <span className="notification-badge">{notifications}</span>
                  )}
                </SidebarItem>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="content-wrapper">
        {/* Stories Section */}
        <div className="stories-section">
          {canScrollLeft && (
            <motion.button 
              className="scroll-button left"
              onClick={() => scrollStories('left')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              &#8249;
            </motion.button>
          )}
          
          <div className="stories-container" ref={storiesRef}>
            <motion.div 
              className="your-story"
              whileHover={{ scale: 1.05 }}
              onClick={() => {
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
              }}
            >
              <div className="story-avatar">
                <img 
                  src={user.avatar.url} 
                  alt="user" 
                  className="avatar-image" 
                />
                <div className='add-story'>
                  <span>+</span>
                </div>
              </div>
              <p className="story-username">you</p>
            </motion.div>
            
            {allStory.map((storyGroup, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Story
                  media={storyGroup}
                  name={storyGroup[0]?.user?.name}
                  avatar={storyGroup[0]?.user?.avatar}
                />
              </motion.div>
            ))}
          </div>
          
          {canScrollRight && (
            <motion.button 
              className="scroll-button right"
              onClick={() => scrollStories('right')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              &#8250;
            </motion.button>
          )}
        </div>

        {/* Posts Section */}
        <div className="posts-container">
          {posts.map((element, index) => (
            <motion.div
              key={element._id}
              ref={(el) => (postRefs.current[element._id] = el)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Post
                youLiked={element.youLiked}
                likes={element.likes.length}
                _id={element._id}
                src={element.media.url}
                avatar={element.createdBy.avatar.url}
                userName={element.createdBy._id === user._id ? "you" : element.createdBy.userName}
                createdAt={element.createdAt}
                comment={element.comment}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomSidebar />}
    </div>
  );
}

export default MainContent;