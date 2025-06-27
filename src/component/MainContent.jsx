import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../css/mainContent.css';
import Post from './Post';
import Story from './Story';
import { useDispatch, useSelector } from 'react-redux';
import fetchPost from '../fetch/fethPost';
import { setShowModel } from '../redux/slice/showCreateModel';
import fetchStory from '../fetch/fetchStory';
import { useSocket } from "../socket/SocketContext";
import { setShowStory, setStory } from '../redux/slice/showStoryModel';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faMessage, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';

function MainContent() {
  const storiesRef = useRef(null);
  const mainContainerRef = useRef(null);
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.post.posts);
  const user = useSelector((state) => state.user.user);
  const yourStory = useSelector((state) => state.yourStory.story);
  const [teriStory, setTeriStory] = useState(yourStory);
  const socket = useSocket();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [allStory, setAllStory] = useState([]);
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState(0);
  const [messageNoti, setMessageNoti] = useState(0);
  const [allNotification, setAllNotification] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [visiblePosts, setVisiblePosts] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [ref, inView] = useInView();
  const controls = useAnimation();
  const postRefs = useRef({});
  let navigate = useNavigate();
  let postId = searchParams.get("id");

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 0.5
      }
    }
  };

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
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchPost(user.token, dispatch, navigate);
      const storyData = await fetchStory(user.token);
      
      if (storyData) {
        setAllStory(storyData);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  }, [dispatch, user.token, navigate]);

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
      setTimeout(() => {
        postRefs.current[postId].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 500);
    }
  }, [postId, posts]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      checkScrollPosition();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScrollPosition]);

  // Check scroll position on mount and when stories change
  useEffect(() => {
    checkScrollPosition();
    const timer = setTimeout(checkScrollPosition, 500);
    return () => clearTimeout(timer);
  }, [checkScrollPosition, allStory]);

  // Infinite scroll handler with throttling
  useEffect(() => {
    const handleScroll = () => {
      if (mainContainerRef.current && !isFetching) {
        const { scrollTop, scrollHeight, clientHeight } = mainContainerRef.current;
        
        // Load more when 70% scrolled
        if (scrollTop + clientHeight >= scrollHeight * 0.7 && visiblePosts < posts.length) {
          setIsFetching(true);
          setVisiblePosts(prev => {
            const newValue = prev + 6;
            return Math.min(newValue, posts.length);
          });
          
          // Simulate network delay
          setTimeout(() => {
            setIsFetching(false);
          }, 1000);
        }
      }
    };
    
    const container = mainContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [visiblePosts, posts.length, isFetching]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className='main-content-container' ref={mainContainerRef}>
      {/* Stories Section */}
      <div className="stories-section">
        {canScrollLeft && (
          <motion.button 
            className="scroll-button left"
            onClick={() => scrollStories('left')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll stories left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
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
            aria-label="Your story"
          >
            <motion.div 
              className="story-avatar"
              whileHover={{ rotate: 5 }}
              style={{
                background: yourStory && yourStory.length > 0 
                  ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
                  : 'linear-gradient(45deg, #667eea, #764ba2)'
              }}
            >
              <img 
                src={user?.avatar?.url || ''} 
                alt="Your profile" 
                className="avatar-image" 
                loading="lazy"
              />
              {(!yourStory || yourStory.length === 0) && (
                <motion.div 
                  className='add-story'
                  whileHover={{ scale: 1.2, rotate: 90 }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </motion.div>
              )}
            </motion.div>
            <p className="story-username">Your Story</p>
          </motion.div>
          
          {allStory.map((storyGroup, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll stories right"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Posts Section */}
      <motion.div 
        className="posts-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        ref={ref}
      >
        {isLoading ? (
          [...Array(6)].map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              className="post-skeleton"
              variants={itemVariants}
            >
              <div className="skeleton-header">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-user"></div>
              </div>
              <div className="skeleton-media"></div>
              <div className="skeleton-actions"></div>
              <div className="skeleton-caption"></div>
              <div className="skeleton-comments"></div>
            </motion.div>
          ))
        ) : (
          posts && posts.slice(0, visiblePosts).map((element, index) => (
            <motion.div
              key={element._id || index}
              ref={(el) => (postRefs.current[element._id] = el)}
              variants={itemVariants}
              whileHover={{ 
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                y: -5
              }}
              className="post-wrapper"
              layout
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
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
                caption={element.caption || ''}
                fixedHeight={true}
              />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Loading more indicator */}
      {visiblePosts < posts.length && (
        <div className="loading-more">
          <div className="spinner"></div>
          <span>Loading more posts...</span>
        </div>
      )}
    </div>
  );
}

export default MainContent;