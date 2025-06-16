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
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import { useTheme } from '../context/ThemeContext';

// Background gradient colors based on theme
const backgroundGradients = {
  dark: ['#0f0f13', '#1a1a23', '#2a2a35'],
  light: ['#f5f7fa', '#e4e8f0', '#d1d9e8'],
  colorful: ['#ff9a9e', '#fad0c4', '#fbc2eb']
};

function MainContent() {
  const storiesRef = useRef(null);
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.post?.posts || []);
  const user = useSelector((state) => state.user?.user || {});
  const yourStory = useSelector((state) => state.yourStory?.story || []);
  const [teriStory, setTeriStory] = useState(yourStory);
  const socket = useSocket();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [allStory, setAllStory] = useState([]);
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState(0);
  const [messageNoti, setMessageNoti] = useState(0);
  const [allNotification, setAllNotification] = useState([]);
  const showCall = useSelector((state) => state.call?.showCall || false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [hoveredStory, setHoveredStory] = useState(null);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const { theme = 'dark' } = useTheme(); // Default to dark theme if not provided
  let postId = searchParams.get("id");
  const postRefs = useRef({});
  let navigate = useNavigate();
  
  const particlesInit = useCallback(async (engine) => {
    try {
      await loadFull(engine);
    } catch (error) {
      console.error("Failed to initialize particles:", error);
    }
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // Optional callback, no need for error handling here
  }, []);

  // Safe navigation function
  const handleNavigation = useCallback((path, state) => {
    try {
      navigate(path, { state });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [navigate]);

  // Safe scroll to post function
  const scrollToPost = useCallback((id) => {
    try {
      if (postRefs.current[id]) {
        postRefs.current[id].scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Scroll error:", error);
    }
  }, []);

  // Background animation cycling with error handling
  useEffect(() => {
    let interval;
    try {
      interval = setInterval(() => {
        setBackgroundIndex((prev) => {
          const gradients = backgroundGradients[theme] || backgroundGradients.dark;
          return (prev + 1) % gradients.length;
        });
      }, 10000);
    } catch (error) {
      console.error("Background animation error:", error);
    }
    return () => clearInterval(interval);
  }, [theme]);

  // Initialize AOS with error handling
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

  // Handle window resize with debounce and error handling
  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      try {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsMobile(window.innerWidth < 992);
        }, 200);
      } catch (error) {
        console.error("Resize handler error:", error);
      }
    };
    
    try {
      window.addEventListener('resize', handleResize);
    } catch (error) {
      console.error("Event listener error:", error);
    }
    
    return () => {
      try {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    };
  }, []);

  // Handle postId parameter
  useEffect(() => {
    if (postId) {
      try {
        scrollToPost(postId);
      } catch (error) {
        console.error("Failed to scroll to post:", error);
      }
    }
  }, [postId, scrollToPost]);

  // Safe story scrolling function
  const scrollStories = useCallback((direction) => {
    try {
      if (!storiesRef.current) return;
      
      const scrollAmount = direction === 'left' ? -300 : 300;
      storiesRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Update scroll buttons visibility after a delay
      setTimeout(() => {
        if (storiesRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
          setCanScrollLeft(scrollLeft > 0);
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
        }
      }, 300);
    } catch (error) {
      console.error("Story scrolling error:", error);
    }
  }, []);

  // Check scroll position on stories container
  useEffect(() => {
    const checkScrollPosition = () => {
      try {
        if (storiesRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
          setCanScrollLeft(scrollLeft > 0);
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
        }
      } catch (error) {
        console.error("Scroll position check error:", error);
      }
    };

    try {
      const currentRef = storiesRef.current;
      if (currentRef) {
        currentRef.addEventListener('scroll', checkScrollPosition);
        checkScrollPosition(); // Initial check
      }
      
      return () => {
        if (currentRef) {
          currentRef.removeEventListener('scroll', checkScrollPosition);
        }
      };
    } catch (error) {
      console.error("Scroll event listener error:", error);
    }
  }, []);

  // Safe notification navigation
  const goNotification = useCallback(() => {
    try {
      dispatch(showNoti(true));
      handleNavigation("/notification", true);
    } catch (error) {
      console.error("Notification navigation error:", error);
    }
  }, [dispatch, handleNavigation]);

  // Get current gradient colors safely
  const getCurrentGradient = useCallback(() => {
    try {
      const gradients = backgroundGradients[theme] || backgroundGradients.dark;
      return `linear-gradient(135deg, ${gradients[backgroundIndex]}, ${gradients[(backgroundIndex + 1) % gradients.length]})`;
    } catch (error) {
      console.error("Gradient calculation error:", error);
      return `linear-gradient(135deg, #0f0f13, #1a1a23)`;
    }
  }, [theme, backgroundIndex]);

  return (
    <div className={`main-content-container ${theme}-theme`}>
      {/* Animated Background Elements */}
      <div 
        className="background-gradient" 
        style={{ background: getCurrentGradient() }}
      ></div>
      
      {theme === 'colorful' && (
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            fullScreen: { enable: false },
            particles: {
              number: { value: 30, density: { enable: true, value_area: 800 } },
              color: { value: ["#ff9a9e", "#fad0c4", "#fbc2eb", "#a6c1ee", "#f6d365"] },
              shape: { type: "circle" },
              opacity: { value: 0.3, random: true, anim: { enable: true, speed: 1 } },
              size: { value: 10, random: true, anim: { enable: true, speed: 2 } },
              line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.2 },
              move: { enable: true, speed: 1, direction: "none" }
            },
            interactivity: {
              detect_on: "canvas",
              events: {
                onhover: { enable: true, mode: "bubble" },
                onclick: { enable: true, mode: "push" },
                resize: true
              }
            },
            retina_detect: true
          }}
        />
      )}

      <AnimatePresence>
        {showCall && (
          <motion.div 
            className='call-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Call />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Notification Bubble */}
      {notifications > 0 && (
        <motion.div 
          className="floating-notification"
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goNotification}
        >
          <span>{notifications}</span>
          <div className="pulse-effect"></div>
        </motion.div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <motion.div 
          className='mobile-header'
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring' }}
        >
          <div className='header-content'>
            <motion.h1 
              className='app-title'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ChatFight
            </motion.h1>
            <div className='header-icons'>
              <motion.div 
                className='message-icon'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
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
                    >
                      {messageNoti}
                    </motion.span>
                  )}
                </SidebarItem>
              </motion.div>
              <motion.div 
                className='notification-icon'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
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
                    >
                      {notifications}
                    </motion.span>
                  )}
                </SidebarItem>
              </motion.div>
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
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </motion.button>
          )}
          
          <div className="stories-container" ref={storiesRef}>
            <motion.div 
              className="your-story"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setHoveredStory('your-story')}
              onHoverEnd={() => setHoveredStory(null)}
              onClick={() => {
                try {
                  if (teriStory.length === 0) {
                    dispatch(setShowModel(true));
                  } else {
                    dispatch(setStory({
                      name: teriStory[0]?.user?.name || "You",
                      media: teriStory,
                      avatar: teriStory[0]?.user?.avatar || user.avatar?.url,
                      you: true
                    }));
                    dispatch(setShowStory(true));
                  }
                } catch (error) {
                  console.error("Story click handler error:", error);
                }
              }}
            >
              <div className="story-avatar">
                <motion.img 
                  src={user.avatar?.url || ''} 
                  alt="user" 
                  className="avatar-image" 
                  onError={(e) => {
                    e.target.src = 'default-avatar.png'; // Fallback image
                  }}
                />
                {teriStory.length === 0 && (
                  <motion.div className='add-story'>
                    <span>+</span>
                  </motion.div>
                )}
              </div>
              <motion.p className="story-username">
                you
              </motion.p>
            </motion.div>
            
            {Array.isArray(allStory) && allStory.map((storyGroup, index) => {
              const userName = storyGroup[0]?.user?.name || "Unknown";
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Story
                    media={storyGroup}
                    name={userName}
                    avatar={storyGroup[0]?.user?.avatar}
                    isHovered={hoveredStory === userName}
                  />
                </motion.div>
              );
            })}
          </div>
          
          {canScrollRight && (
            <motion.button 
              className="scroll-button right"
              onClick={() => scrollStories('right')}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </motion.button>
          )}
        </div>

        {/* Posts Section */}
        <div className="posts-container">
          {Array.isArray(posts) && posts.map((element, index) => (
            <motion.div
              key={element?._id || index}
              ref={(el) => element?._id && (postRefs.current[element._id] = el)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="post-wrapper"
            >
              <Post
                youLiked={element?.youLiked || false}
                likes={element?.likes?.length || 0}
                _id={element?._id}
                src={element?.media?.url}
                avatar={element?.createdBy?.avatar?.url}
                userName={element?.createdBy?._id === user?._id ? "you" : element?.createdBy?.userName}
                createdAt={element?.createdAt}
                comment={element?.comment}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <motion.div 
          className="floating-action-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            try {
              dispatch(setShowModel(true));
            } catch (error) {
              console.error("FAB click error:", error);
            }
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </motion.div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomSidebar />}
    </div>
  );
}

export default MainContent;