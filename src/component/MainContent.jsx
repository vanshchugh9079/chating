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
  let postId = searchParams.get("id");
  const postRefs = useRef({});
  let navigate = useNavigate();

  // Background animation state
  const backgroundRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [backgroundImageIndex, setBackgroundImageIndex] = useState(0);
  const backgroundImages = [
    'url(https://source.unsplash.com/random/1920x1080/?social,night)',
    'url(https://source.unsplash.com/random/1920x1080/?connection,people)',
    'url(https://source.unsplash.com/random/1920x1080/?community,digital)'
  ];

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false
    });
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll for background animation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const progress = Math.min(scrollY / (docHeight - windowHeight), 1);
      setScrollProgress(progress);
      
      // Change background image based on scroll position
      const newIndex = Math.min(
        Math.floor(progress * backgroundImages.length),
        backgroundImages.length - 1
      );
      if (newIndex !== backgroundImageIndex) {
        setBackgroundImageIndex(newIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [backgroundImageIndex]);

  // ... [keep all other existing hooks and functions] ...

  return (
    <div 
      className='main-content-container ms-0'
      ref={backgroundRef}
    >
      {/* Animated Background Layer */}
      <div className="background-animation">
        {backgroundImages.map((image, index) => (
          <motion.div
            key={index}
            className={`background-image ${index === backgroundImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: image }}
            animate={{
              opacity: index === backgroundImageIndex ? 1 : 0,
              scale: 1 + (scrollProgress * 0.05),
              y: -scrollProgress * 50
            }}
            transition={{ 
              opacity: { duration: 1.5, ease: "easeInOut" },
              scale: { duration: 2, ease: "linear" },
              y: { duration: 0.5, ease: "linear" }
            }}
          />
        ))}
        <div className="background-overlay" />
      </div>

      {/* Scroll Progress Indicator */}
      <motion.div 
        className="scroll-progress" 
        style={{ scaleX: scrollProgress }}
      />

      {/* Content Overlay */}
      <div className="content-overlay">
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
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                data-aos="fade-right"
              >
                &#8249;
              </motion.button>
            )}
            
            <div className="stories-container" ref={storiesRef}>
              <motion.div 
                className="your-story floating-element"
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
                data-aos="fade-up"
              >
                <div className="story-avatar gradient-border">
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
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
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
                data-aos="fade-left"
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
                data-aos="fade-up"
                data-aos-delay={index * 50}
                className="post-wrapper"
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
    </div>
  );
}

export default MainContent;