import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { faBell, faMessage } from '@fortawesome/free-solid-svg-icons';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Components
import Post from './Post';
import Story from './Story';
import BottomSidebar from './BottomSidebar';
import SidebarItem from './Sidebar';
import Call from './Call';

// Redux actions
import { setShowModel } from '../redux/slice/showCreateModel';
import { setShowStory, setStory } from '../redux/slice/showStoryModel';
import { showMessage, showNoti } from '../redux/slice/showMobileNotification';

// Services
import fetchPost from '../fetch/fethPost.js';
import fetchStory from '../fetch/fetchStory';
import { useSocket } from "../socket/SocketContext";
import { api } from '../contant';

// Config
import particlesConfig from '../config/particlesConfig.js';

function MainContent() {
  // Refs
  const storiesRef = useRef(null);
  const postRefs = useRef({});
  
  // State
  const [teriStory, setTeriStory] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [allStory, setAllStory] = useState([]);
  const [notifications, setNotifications] = useState(0);
  const [messageNoti, setMessageNoti] = useState(0);
  const [allNotification, setAllNotification] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  // Redux
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.post.posts);
  const user = useSelector((state) => state.user.user);
  const yourStory = useSelector((state) => state.yourStory.story);
  const showCall = useSelector((state) => state.call.showCall);

  // Router
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get("id");
  const socket = useSocket();

  // Initialize particles
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  // Initialize animations
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out-quart',
      once: false,
      mirror: true,
      anchorPlacement: 'top-bottom'
    });
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Responsive handler
  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 992);
        setShowParticles(window.innerWidth > 768);
      }, 200);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;

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
  }, [socket]);

  // Fetch data
  useEffect(() => {
    fetchPost(user.token, dispatch, navigate);
    
    const fetchData = async () => {
      try {
        // Fetch notifications
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

        // Fetch stories
        const storyResponse = await fetchStory(user.token);
        const storyData = storyResponse.data.data;
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

        setAllStory(Object.values(storyMap));

        // Fetch user's story
        const yourStoryResponse = await api.get("/story/get/" + user._id, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        setTeriStory(yourStoryResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user, dispatch, navigate]);

  // Scroll to post if ID in URL
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

  // Story scroll handlers
  const scrollStories = useCallback((direction) => {
    if (!storiesRef.current) return;
    
    const scrollAmount = 300;
    const newScrollLeft = storiesRef.current.scrollLeft + 
      (direction === 'left' ? -scrollAmount : scrollAmount);
    
    storiesRef.current.scrollTo({
      left: Math.max(0, Math.min(newScrollLeft, storiesRef.current.scrollWidth - storiesRef.current.clientWidth)),
      behavior: 'smooth'
    });
  }, []);

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
      updateScrollButtons();
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', updateScrollButtons);
      }
    };
  }, [updateScrollButtons]);

  // Handlers
  const goNotification = useCallback(() => {
    dispatch(showNoti(true));
  }, [dispatch]);

  const handleCreateStory = useCallback(() => {
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
  }, [teriStory, dispatch]);

  return (
    <div className={`main-content-container ${isScrolled ? 'scrolled' : ''}`}>
      {/* Animated Background */}
      {showParticles && (
        <div className="animated-background">
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={particlesConfig}
          />
        </div>
      )}
      
      {/* Floating gradient blobs */}
      <div className="floating-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Call Overlay */}
      <AnimatePresence>
        {showCall && (
          <motion.div 
            className='call-overlay'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Call />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      {isMobile && (
        <motion.div 
          className={`mobile-header ${isScrolled ? 'header-scrolled' : ''}`}
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          data-aos="fade-down"
          data-aos-delay="100"
        >
          <div className='header-content'>
            <motion.h1 
              className='app-title'
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              ChatFight
            </motion.h1>
            <div className='header-icons'>
              <motion.div 
                className='message-icon'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <SidebarItem
                  icon={faMessage}
                  label=""
                  forMobile={true}
                  decreaseWidth={true}
                  onClick={() => {
                    dispatch(showMessage(true));
                    navigate("/message");
                  }}
                >
                  {messageNoti > 0 && (
                    <motion.span 
                      className="notification-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      {messageNoti}
                    </motion.span>
                  )}
                </SidebarItem>
              </motion.div>
              <motion.div 
                className='notification-icon'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
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

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Stories Section */}
        <motion.section 
          className="stories-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {canScrollLeft && (
            <motion.button 
              className="scroll-button left"
              onClick={() => scrollStories('left')}
              whileHover={{ scale: 1.1, backgroundColor: '#3a3a4a' }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
          
          <div className="stories-container" ref={storiesRef}>
            <motion.div 
              className="your-story"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateStory}
              data-aos="zoom-in"
              data-aos-delay="200"
            >
              <div className="story-avatar-wrapper">
                <div className="story-avatar">
                  <img 
                    src={user?.avatar?.url} 
                    alt="user" 
                    className="avatar-image" 
                    loading="lazy"
                  />
                  <div className='add-story'>
                    <motion.span
                      whileHover={{ rotate: 90 }}
                      transition={{ type: 'spring' }}
                    >
                      +
                    </motion.span>
                  </div>
                </div>
              </div>
              <motion.p 
                className="story-username"
                whileHover={{ color: '#ffffff' }}
              >
                your story
              </motion.p>
            </motion.div>
            
            {allStory.map((storyGroup, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (index * 0.05), type: 'spring' }}
                data-aos="zoom-in"
                data-aos-delay={300 + (index * 50)}
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
              whileHover={{ scale: 1.1, backgroundColor: '#3a3a4a' }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          )}
        </motion.section>

        {/* Posts Section */}
        <div className="posts-container">
          {posts.map((element, index) => (
            <motion.div
              key={element._id}
              ref={(el) => (postRefs.current[element._id] = el)}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1,
                type: 'spring',
                stiffness: 100,
                damping: 10
              }}
              viewport={{ once: true, margin: "0px 0px -100px 0px" }}
              whileHover={{ 
                scale: 1.01,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
              data-aos="fade-up"
              data-aos-delay={index * 50}
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
      {isMobile && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <BottomSidebar />
        </motion.div>
      )}
    </div>
  );
}

export default MainContent;