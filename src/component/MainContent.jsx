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
import { SidebarItem } from './Sidebar';
import { faBell, faMessage, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { showMessage, showNoti } from '../redux/slice/showMobileNotification';
import Call from './Call';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

// Placeholder images
const placeholderAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
const placeholderPost = 'https://via.placeholder.com/500x500/333/666?text=Loading...';

function MainContent() {
  const storiesRef = useRef(null);
  const mainContentRef = useRef(null);
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
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastScrollPos, setLastScrollPos] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const showCall = useSelector((state) => state.call.showCall);
  
  // Animated background gradients
  const backgrounds = [
    'linear-gradient(135deg, #000000 0%, #434343 100%)',
    'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
    'linear-gradient(135deg, #000000 0%, #16213e 100%)',
    'linear-gradient(135deg, #000000 0%, #1f1f1f 100%)'
  ];

  let postId = searchParams.get("id");
  const postRefs = useRef({});
  let navigate = useNavigate();

  // Use Framer Motion scroll hooks for advanced animations
  const { scrollYProgress } = useScroll({
    container: mainContentRef
  });
  
  const backgroundOpacity = useTransform(
    scrollYProgress,
    [0, 0.1],
    [1, 0.8]
  );

  // Track scroll direction with improved performance
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = mainContentRef.current?.scrollTop || 0;
      setScrollingUp(currentScrollPos < lastScrollPos);
      setLastScrollPos(currentScrollPos);
    };

    const ref = mainContentRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', handleScroll);
      }
    };
  }, [lastScrollPos]);

  // Smooth background transition with easing
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
    }, 15000); // Increased duration for smoother transition
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = useCallback((path, adjustWidth = false) => {
    if (showNotificationBar) {
      socket.emit("read-notification", allNotification);
      setNotifications(0);
    }
    setShowNotificationBar(false);
    navigate(path);
  }, [allNotification, navigate, showNotificationBar, socket]);

  // Scroll to post if URL contains postId
  useEffect(() => {
    if (postId && postRefs.current[postId]) {
      setTimeout(() => {
        postRefs.current[postId].scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        });
      }, 300); // Small delay to ensure DOM is ready
    }
  }, [postId, posts]);

  // Improved notification handling
  useEffect(() => {
    dispatch(showMessage(false))
    const fetchNotifications = async () => {
      try {
        let sum = 0;
        const [mesResponse, ...notificationResponses] = await Promise.all([
          api.get("/notification/get/message", {
            headers: { 'Authorization': `Bearer ${user.token}` },
          }),
          ...["post", "reel", "follow", "request", "information"].map(type => 
            api.get(`/notification/get/${type}`, {
              headers: { 'Authorization': `Bearer ${user.token}` },
            })
          )
        ]);

        setMessageNoti(mesResponse.data.data.length);

        const arr = notificationResponses.flatMap(response => {
          return response.data.data.map(element => {
            if (!element.seen) sum += 1;
            return element;
          });
        });

        setAllNotification(arr);
        setNotifications(sum);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [dispatch, user.token]);

  // Fetch posts with error handling
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchPost(user.token, dispatch, navigate);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.token, dispatch, navigate]);

  // Enhanced story fetching with error boundary
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetchStory(user.token);
        const storyData = response.data.data;

        const storyMap = storyData.reduce((acc, story) => {
          const userName = story.user?.name;
          if (userName) {
            if (!acc[userName]) {
              acc[userName] = [];
            }
            acc[userName].push(story);
          }
          return acc;
        }, {});

        setAllStory(Object.values(storyMap));
      } catch (error) {
        console.error("Error fetching stories:", error);
        setAllStory([]); // Reset to empty array on error
      }
    };

    fetchStories();
  }, [user.token]);

  // Socket event handlers with cleanup
  useEffect(() => {
    if (!socket) return;

    const addedStory = (data) => {
      if (data) {
        setAllStory(prev => {
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
      setTeriStory(prev => [...prev, data]);
    };

    const handleMessageReceived = (data) => setMessageNoti(prev => prev + 1);
    const handleNotification = (data) => {
      setNotifications(prev => prev + 1);
      setAllNotification(prev => [...prev, data.notification]);
    };
    const handleYourNotification = (data) => {
      setNotifications(prev => prev - 1);
      setAllNotification(prev => prev.filter(e => e._id !== data.notification._id));
    };
    const handleRead = (data) => data && setAllNotification(data);

    socket.on("new-story", addedStory);
    socket.on("story-added", onAddedYouStory);
    socket.on('message-recieved', handleMessageReceived);
    socket.on("follow", handleNotification);
    socket.on("unfollow", handleNotification);
    socket.on("follow-request", handleNotification);
    socket.on("accept-request", handleNotification);
    socket.on("liked-post", handleNotification);
    socket.on("comment-post", handleNotification);
    socket.on("accept-request-success", handleYourNotification);
    socket.on("decline-request-success", handleYourNotification);
    socket.on("read-notification", handleRead);

    return () => {
      socket.off("new-story", addedStory);
      socket.off("story-added", onAddedYouStory);
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

  // Fetch user's story with retry logic
  useEffect(() => {
    const getYourStory = async () => {
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await api.get("/story/get/" + user._id, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          setTeriStory(response.data.data);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error("Failed to fetch your story:", error);
          }
        }
      }
    };
    getYourStory();
  }, [yourStory, user._id, user.token]);

  // Story scrolling with improved UX
  const scrollStories = useCallback((direction) => {
    if (!storiesRef.current) return;
    
    const container = storiesRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Optimized scroll button visibility check
  const updateScrollButtons = useCallback(() => {
    if (!storiesRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
    const tolerance = 5; // Pixel tolerance
    
    setCanScrollLeft(scrollLeft > tolerance);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance);
  }, []);

  // Throttled scroll event for better performance
  useEffect(() => {
    const ref = storiesRef.current;
    if (!ref) return;

    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScrollButtons, 100);
    };

    ref.addEventListener('scroll', handleScroll);
    updateScrollButtons();
    
    return () => {
      if (ref) {
        clearTimeout(timeoutId);
        ref.removeEventListener('scroll', handleScroll);
      }
    };
  }, [updateScrollButtons]);

  // Infinite scroll with intersection observer
  useEffect(() => {
    const options = {
      root: mainContentRef.current,
      rootMargin: '200px',
      threshold: 0.1
    };

    const handleIntersect = (entries) => {
      if (entries[0].isIntersecting && !isLoading) {
        fetchPost(user.token, dispatch, navigate);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, options);
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    mainContentRef.current?.appendChild(sentinel);
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
      }
    };
  }, [isLoading, user.token, dispatch, navigate]);

  // Filter posts with memoization
  const filteredPosts = useMemo(() => {
    return posts.filter(post => 
      post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.createdBy.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  // Enhanced Post Component with Lazy Loading and Placeholders
  const AnimatedPost = React.memo(({ element, index }) => {
    const postRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.1, root: mainContentRef.current }
      );

      if (postRef.current) {
        observer.observe(postRef.current);
      }

      return () => {
        if (postRef.current) {
          observer.unobserve(postRef.current);
        }
      };
    }, []);

    return (
      <motion.div
        ref={postRef}
        key={element._id}
        initial={{ opacity: 0, y: scrollingUp ? -50 : 50 }}
        animate={isVisible ? { 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            stiffness: 120,
            damping: 12,
            delay: index * 0.03
          }
        } : {}}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.008 }}
        whileTap={{ scale: 0.98 }}
        layout
        className="post-container"
      >
        <Post
          youLiked={element.youLiked}
          likes={element.likes.length}
          _id={element._id}
          src={element.media.url}
          avatar={element.createdBy.avatar?.url || placeholderAvatar}
          userName={element.createdBy._id === user._id ? "you" : element.createdBy.userName}
          createdAt={element.createdAt}
          comment={element.comment}
          caption={element.caption}
          imageLoaded={imageLoaded}
          onImageLoad={() => setImageLoaded(true)}
        />
      </motion.div>
    );
  });

  return (
    <motion.div 
      className='main-content-wrapper'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        background: backgrounds[backgroundIndex],
        transition: 'background 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
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
      
      {/* Mobile Header */}
      <motion.div 
        className='mobile-header'
        animate={{ 
          y: scrollingUp || showSearch ? 0 : -60,
          opacity: scrollingUp || showSearch ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className='logo-container'>
          <h1 className='insta-text'>Chat Fight</h1>
        </div>
        
        <div className='mobile-actions'>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSearch(!showSearch)}
          >
            <FontAwesomeIcon icon={faSearch} className='search-icon' />
          </motion.div>
          
          <div className='message-icon'>
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
                <motion.span 
                  className="notification-badge-message"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={`message-${messageNoti}`}
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
                  key={`noti-${notifications}`}
                >
                  {notifications}
                </motion.span>
              )}
            </SidebarItem>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='search-bar-container'
            transition={{ duration: 0.3 }}
          >
            <div className='search-input-group'>
              <input
                type='text'
                className='search-input'
                placeholder='Search posts...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <motion.button 
                className='search-button'
                onClick={() => setShowSearch(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faSearch} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="main-content-scrollable" 
        ref={mainContentRef}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ opacity: backgroundOpacity }}
      >
        {/* Stories Section */}
        <div className="stories-section">
          {canScrollLeft && (
            <motion.button 
              className="scroll-button left"
              onClick={() => scrollStories('left')}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              &#8249;
            </motion.button>
          )}
          
          <div className="stories-scroller" ref={storiesRef}>
            {/* Your Story */}
            <motion.div 
              className="story-item"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <div 
                className="your-story" 
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
                <LazyLoadImage
                  src={user.avatar?.url || placeholderAvatar}
                  alt="Your profile"
                  effect="blur"
                  width="100%"
                  height="100%"
                  wrapperClassName="story-image-wrapper"
                />
                <motion.div 
                  className='add-story-button'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </motion.div>
              </div>
              <p className="story-username">you</p>
            </motion.div>
            
            {/* Friends' Stories */}
            <AnimatePresence>
              {allStory.map((storyGroup, index) => (
                <motion.div
                  key={index}
                  className="story-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <Story
                    media={storyGroup}
                    name={storyGroup[0]?.user?.name}
                    avatar={storyGroup[0]?.user?.avatar?.url || placeholderAvatar}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {canScrollRight && (
            <motion.button 
              className="scroll-button right"
              onClick={() => scrollStories('right')}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              &#8250;
            </motion.button>
          )}
        </div>

        {/* Posts Section */}
        <div className="posts-container">
          {isLoading ? (
            <AnimatePresence>
              {Array(3).fill().map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  className="post-skeleton"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Skeleton 
                    height={400} 
                    borderRadius={12} 
                    enableAnimation={true}
                    baseColor="#333"
                    highlightColor="#444"
                  />
                  <div className="skeleton-footer">
                    <Skeleton circle width={40} height={40} />
                    <div className="skeleton-text">
                      <Skeleton width={`80%`} height={20} />
                      <Skeleton width={`60%`} height={15} className="mt-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <AnimatePresence>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((element, index) => (
                  <AnimatedPost key={element._id} element={element} index={index} />
                ))
              ) : (
                <motion.div
                  className="no-posts-found"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <LazyLoadImage
                    src="https://cdn.pixabay.com/photo/2017/02/12/21/29/false-2061132_1280.png"
                    alt="No posts found"
                    effect="blur"
                    width={200}
                    height={200}
                  />
                  <h3>No posts found</h3>
                  <p>Try a different search term</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
        
        {/* Floating Action Button */}
        <motion.div
          className="floating-action-button"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9, rotate: 0 }}
          onClick={() => dispatch(setShowModel(true))}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 500,
            damping: 15,
            delay: 0.5
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default React.memo(MainContent);