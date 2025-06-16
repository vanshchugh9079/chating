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
import AOS from 'aos';
import 'aos/dist/aos.css';

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
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  let postId = searchParams.get("id");
  const postRefs = useRef({});
  let navigate = useNavigate();

  // Background images for animated background
  const backgrounds = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ffc3a0 0%, #ffafbd 100%)'
  ];

  // Initialize AOS with more dynamic settings
  useEffect(() => {
    try {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out-quart',
        once: false,
        mirror: true,
        anchorPlacement: 'top-bottom'
      });
    } catch (error) {
      console.error("AOS initialization error:", error);
    }
  }, []);

  // Animate background change
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
    }, 15000); // Change every 15 seconds
    
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check scroll position of stories
  const checkScrollPosition = useCallback(() => {
    if (storiesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  }, []);

  // Scroll stories left or right
  const scrollStories = (direction) => {
    if (storiesRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      storiesRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Fetch posts and stories
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchPost(dispatch);
        const storyData = await fetchStory(dispatch);
        if (storyData) {
          setAllStory(storyData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Handle socket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      setAllNotification(prev => [...prev, data]);
      setNotifications(prev => prev + 1);
    };

    const handleMessageNotification = (data) => {
      setMessageNoti(prev => prev + 1);
    };

    socket.on("notification", handleNotification);
    socket.on("messageNotification", handleMessageNotification);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("messageNotification", handleMessageNotification);
    };
  }, [socket]);

  // Check for post ID in URL and scroll to it
  useEffect(() => {
    if (postId && postRefs.current[postId]) {
      postRefs.current[postId].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [postId, posts]);

  // Update your story when it changes
  useEffect(() => {
    setTeriStory(yourStory);
  }, [yourStory]);

  // Check scroll position on mount and when stories change
  useEffect(() => {
    checkScrollPosition();
    const timer = setTimeout(checkScrollPosition, 500); // Delay to account for rendering
    return () => clearTimeout(timer);
  }, [checkScrollPosition, allStory]);

  // Navigation functions
  const handleNavigation = (path, shouldDispatch = false) => {
    navigate(path);
    if (shouldDispatch) {
      dispatch(showNoti(false));
      dispatch(showMessage(false));
    }
  };

  const goNotification = () => {
    dispatch(showNoti(true));
    handleNavigation("/notification", true);
    setNotifications(0);
  };

  return (
    <div className='main-content-container'>
      {/* Animated Background Layer */}
      <motion.div 
        className="animated-background"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 0.15,
          background: backgrounds[backgroundIndex]
        }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />
      
      {/* Floating Particles */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0
            }}
            animate={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              opacity: Math.random() * 0.3 + 0.1,
              transition: {
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear"
              }
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              background: backgrounds[Math.floor(Math.random() * backgrounds.length)]
            }}
          />
        ))}
      </div>

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
          data-aos="fade-down"
        >
          <div className='header-content'>
            <motion.h1 
              className='app-title'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Chat Fight
            </motion.h1>
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
                    <motion.span 
                      className="notification-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {messageNoti}
                    </motion.span>
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
                    <motion.span 
                      className="notification-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {notifications}
                    </motion.span>
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
              whileHover={{ scale: 1.1, backgroundColor: '#3a3a4a' }}
              whileTap={{ scale: 0.9 }}
              data-aos="fade-right"
            >
              &#8249;
            </motion.button>
          )}
          
          <div 
            className="stories-container" 
            ref={storiesRef}
            onScroll={checkScrollPosition}
          >
            <motion.div 
              className="your-story"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!teriStory || teriStory.length === 0) {
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
              data-aos="fade-up"
            >
              <motion.div 
                className="story-avatar"
                whileHover={{ rotate: 5 }}
              >
                <img 
                  src={user?.avatar?.url || ''} 
                  alt="user" 
                  className="avatar-image" 
                />
                <motion.div 
                  className='add-story'
                  whileHover={{ scale: 1.2, rotate: 90 }}
                >
                  <span>+</span>
                </motion.div>
              </motion.div>
              <motion.p 
                className="story-username"
                whileHover={{ color: '#ffffff' }}
              >
                you
              </motion.p>
            </motion.div>
            
            {allStory.map((storyGroup, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                data-aos="fade-up"
                data-aos-delay={index * 50}
                whileHover={{ scale: 1.03 }}
              >
                <Story
                  media={storyGroup}
                  name={storyGroup[0]?.user?.name || 'Unknown'}
                  avatar={storyGroup[0]?.user?.avatar || ''}
                />
              </motion.div>
            ))}
          </div>
          
          {canScrollRight && (
            <motion.button 
              className="scroll-button right"
              onClick={() => scrollStories('right')}
              whileHover={{ scale: 1.1, backgroundColor: '#3a3a4a' }}
              whileTap={{ scale: 0.9 }}
              data-aos="fade-left"
            >
              &#8250;
            </motion.button>
          )}
        </div>

        {/* Posts Section */}
        <div className="posts-container">
          {posts && posts.map((element, index) => (
            <motion.div
              key={element._id || index}
              ref={(el) => (postRefs.current[element._id] = el)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              data-aos="fade-up"
              data-aos-delay={index * 50}
              whileHover={{ 
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                y: -5
              }}
            >
              <Post
                youLiked={element.youLiked || false}
                likes={element.likes?.length || 0}
                _id={element._id}
                src={element.media?.url || ''}
                avatar={element.createdBy?.avatar?.url || ''}
                userName={element.createdBy?._id === user?._id ? "you" : element.createdBy?.userName || 'Unknown'}
                createdAt={element.createdAt}
                comment={element.comment || []}
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