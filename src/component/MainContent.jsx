import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell, faMessage, faPlus, faChevronLeft,
  faChevronRight, faSearch, faHome, faCompass, faUser,
  faHeart, faComment, faBookmark, faShare
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Post from './Post';
import Story from './Story';
import fetchPost from '../fetch/fethPost';
import fetchStory from '../fetch/fetchStory';
import { setShowModel } from '../redux/slice/showCreateModel';
import { setShowStory, setStory } from '../redux/slice/showStoryModel';
import { useSocket } from "../socket/SocketContext";
import '../css/mainContent.css';
import { api } from '../contant';
import { showNoti } from '../redux/slice/showMobileNotification';

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
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [allStory, setAllStory] = useState([]);
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState(0);
  const [messageNoti, setMessageNoti] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
  const [visiblePosts, setVisiblePosts] = useState(isMobile ? 2 : 4);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [ref, inView] = useInView();
  const postRefs = useRef({});
  const navigate = useNavigate();
  const postId = searchParams.get("id");
  const [scrollY, setScrollY] = useState(0);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [hasScrollableStories, setHasScrollableStories] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const desktopItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const floatingButtonVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.1,
      boxShadow: "0 8px 20px rgba(255, 255, 255, 0.2)"
    },
    tap: { scale: 0.95 }
  };

  const storyButtonVariants = {
    hover: {
      scale: 1.1,
      backgroundColor: 'rgba(255,255,255,0.2)'
    },
    tap: { scale: 0.9 }
  };

  // Story gradients
  const storyGradients = [
    'linear-gradient(45deg, #FF3AC7 0%, #A637F5 100%)',
    'linear-gradient(45deg, #00C9FF 0%, #92FE9D 100%)',
    'linear-gradient(45deg, #FEE140 0%, #FA709A 100%)',
    'linear-gradient(45deg, #FAD961 0%, #F76B1C 100%)'
  ];

  // Check if stories are scrollable
  const checkStoriesScrollable = useCallback(() => {
    if (storiesRef.current) {
      const { scrollWidth, clientWidth } = storiesRef.current;
      setHasScrollableStories(scrollWidth > clientWidth);
    }
  }, []);

  // Check scroll position of stories
  const checkScrollPosition = useCallback(() => {
    if (storiesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);

      const storyWidth = 100;
      const newIndex = Math.round(scrollLeft / storyWidth);
      setActiveStoryIndex(newIndex);
    }
  }, []);

  // Scroll stories with boundary checks
  const scrollStories = (direction) => {
    if (storiesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
      let newScrollLeft;

      if (direction === 'left') {
        newScrollLeft = Math.max(0, scrollLeft - 300);
      } else {
        newScrollLeft = Math.min(scrollWidth - clientWidth, scrollLeft + 300);
      }

      storiesRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      mirror: true,
      offset: 120,
      delay: 100,
      anchorPlacement: 'top-bottom'
    });

    const handleResize = () => AOS.refresh();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchPost(user.token, dispatch, navigate),
        fetchStory(user.token).then(storyData => {
          if (storyData) setAllStory(storyData);
        })
      ]);
      let res = await api.get("/story/get/" + user._id, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      setTeriStory(res.data.data)
      setIsLoading(false);
      setTimeout(checkStoriesScrollable, 300);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  }, [dispatch, user.token, navigate, checkStoriesScrollable, yourStory]);

  // Handle socket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
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

  // Check for post ID in URL
  useEffect(() => {
    if (postId && postRefs.current[postId]) {
      setTimeout(() => {
        postRefs.current[postId].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [postId, posts]);

  // Responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width < 1024);
      setVisiblePosts(width < 768 ? 2 : width < 1024 ? 3 : 4);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setShowFloatingBtn(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (mainContainerRef.current && !isFetching) {
        const { scrollTop, scrollHeight, clientHeight } = mainContainerRef.current;

        if (scrollTop + clientHeight >= scrollHeight * 0.8 && visiblePosts < posts.length) {
          setIsFetching(true);
          setVisiblePosts(prev => {
            const newValue = prev + (isMobile ? 1 : 2);
            return Math.min(newValue, posts.length);
          });

          setTimeout(() => {
            setIsFetching(false);
          }, 800);
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
  }, [visiblePosts, posts.length, isFetching, isMobile]);

  // Check stories scrollable state on resize
  useEffect(() => {
    const handleResize = () => {
      checkStoriesScrollable();
      checkScrollPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkStoriesScrollable, checkScrollPosition]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImageLoad = (id) => {
    setLoadedImages(prev => ({ ...prev, [id]: true }));
  };

  const BottomLoader = () => (
    <motion.div
      className="bottom-loader"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="loader-circle">
        <div className="loader-spinner"></div>
      </div>
    </motion.div>
  );

  return (
    <div
      className="main-content-container dark-mode"
      ref={mainContainerRef}
      data-aos="fade-in"
    >
      {/* Floating Create Post Button */}
      {isMobile && (
        <motion.button
          className="floating-create-btn"
          variants={floatingButtonVariants}
          initial="hidden"
          animate={showFloatingBtn ? "visible" : "hidden"}
          whileHover="hover"
          whileTap="tap"
          onClick={() => dispatch(setShowModel(true))}
          data-aos="zoom-in"
          data-aos-delay="300"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="tooltip">Create Post</span>
        </motion.button>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header" data-aos="fade-down">
          <h1 className="app-logo">
            <span className="logo-highlight">Chat</span>Fight
          </h1>

          <div className="mobile-header-actions">
            <button
              className="header-action-btn message-btn"
              onClick={() => navigate('/message')}
              data-aos="fade-left"
              data-aos-delay="100"
            >
              <FontAwesomeIcon icon={faMessage} />
              {messageNoti > 0 && (
                <span className="notification-badge">{messageNoti}</span>
              )}
            </button>

            <button
              className="header-action-btn notification-btn"
              data-aos="fade-left"
              onClick={() => dispatch(showNoti(true))}
              data-aos-delay="200"
            >
              <FontAwesomeIcon icon={faBell} />
              {notifications > 0 && (
                <span className="notification-badge">{notifications}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stories Section */}
      <div
        className="stories-section pb-0 mb-0"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        {hasScrollableStories && canScrollLeft && (
          <motion.button
            className="scroll-button left"
            onClick={() => scrollStories('left')}
            variants={storyButtonVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            data-aos="fade-right"
            data-aos-delay="300"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </motion.button>
        )}

        <div
          className="stories-container"
          ref={storiesRef}
          onScroll={checkScrollPosition}
          data-aos="fade-up"
          data-aos-delay="400"
        >
          <motion.div
            className={`your-story `}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              if (!teriStory || teriStory.length === 0) {
                dispatch(setStory({ name: '', media: [], avatar: {}, you: false }));
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-aos="zoom-in"
            data-aos-delay="500"
          >
            <div className={`story-avatar  ${(teriStory && (teriStory.length > 0)) && "gradient-border p-0 "} rounded-circle`} >
              <img
                src={user?.avatar?.url || ''}
                alt="Your profile"
                className="avatar-image"
                loading="lazy"
              />
              {(!yourStory || yourStory.length === 0) && (
                <div className='add-story'>
                  <FontAwesomeIcon icon={faPlus} />
                </div>
              )}
            </div>
            <p className="story-username">Your Story</p>
          </motion.div>

          {allStory.map((storyGroup, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-aos="zoom-in"
              data-aos-delay={600 + (index * 100)}
            >
              <Story
                media={storyGroup}
                name={storyGroup[0]?.user?.name || 'Unknown'}
                avatar={storyGroup[0]?.user?.avatar || ''}
                gradient={storyGradients[index % storyGradients.length]}
                active={index === activeStoryIndex}
              />
            </motion.div>
          ))}
        </div>

        {hasScrollableStories && canScrollRight && (
          <motion.button
            className="scroll-button right"
            onClick={() => scrollStories('right')}
            variants={storyButtonVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            data-aos="fade-left"
            data-aos-delay="300"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </motion.button>
        )}

        {/* Story Scroll Indicator */}
        {hasScrollableStories && (
          <div className="story-scroll-indicator" data-aos="fade-up" data-aos-delay="700">
            {allStory.map((_, index) => (
              <div
                key={index}
                className={`indicator-dot ${index === activeStoryIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Posts Section */}
      {!isMobile ? (
        <motion.div
          className="desktop-posts-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          ref={ref}
          data-aos="fade-up"
        >
          {isLoading ? (
            [...Array(4)].map((_, index) => (
              <PostSkeleton
                key={`skeleton-${index}`}
                variants={desktopItemVariants}
                custom={index}
              />
            ))
          ) : (
            <AnimatePresence>
              {posts && posts.slice(0, visiblePosts).map((element, index) => (
                <motion.div
                  key={element._id || index}
                  ref={(el) => (postRefs.current[element._id] = el)}
                  variants={desktopItemVariants}
                  custom={index % 4}
                  initial="hidden"
                  animate="visible"
                  className="desktop-post-wrapper"
                  layout
                  data-aos="fade-up"
                  data-aos-delay={index % 4 * 100}
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
                    onImageLoad={() => handleImageLoad(element._id)}
                    imageLoaded={loadedImages[element._id]}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="posts-container pt-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          ref={ref}
          data-aos="fade-up"
        >
          {isLoading ? (
            [...Array(isMobile ? 2 : 3)].map((_, index) => (
              <PostSkeleton
                key={`skeleton-${index}`}
                variants={itemVariants}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              />
            ))
          ) : (
            <AnimatePresence>
              {posts && posts.slice(0, visiblePosts).map((element, index) => (
                <motion.div
                  key={element._id || index}
                  ref={(el) => (postRefs.current[element._id] = el)}
                  variants={itemVariants}
                  className="post-wrapper"
                  layout
                  data-aos="fade-up"
                  data-aos-delay={index % 2 * 100}
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
                    isMobile={isMobile}
                    onImageLoad={() => handleImageLoad(element._id)}
                    imageLoaded={loadedImages[element._id]}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {/* Bottom Loader */}
      <AnimatePresence>
        {isFetching && visiblePosts < posts.length && (
          <BottomLoader />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="empty-state" data-aos="fade-up">
          <div className="empty-icon">🌟</div>
          <h3>Your Feed is Empty</h3>
          <p>Start connecting with others and see their posts here</p>
          <motion.button
            className="primary-btn"
            onClick={() => dispatch(setShowModel(true))}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Your First Post
          </motion.button>
        </div>
      )}

      {/* Scroll to Top Button */}
      {scrollY > 500 && (
        <motion.button
          className="scroll-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <FontAwesomeIcon icon={faChevronLeft} rotation={90} />
        </motion.button>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="mobile-bottom-nav" data-aos="fade-up">
          <button
            className={`nav-tab ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <FontAwesomeIcon icon={faHome} />
          </button>
          <button
            className={`nav-tab ${location.pathname === '/explore' ? 'active' : ''}`}
            onClick={() => navigate('/explore')}
          >
            <FontAwesomeIcon icon={faCompass} />
          </button>
          <button
            className="nav-tab create-post-btn"
            onClick={() => dispatch(setShowModel(true))}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            className={`nav-tab ${location.pathname === '/activity' ? 'active' : ''}`}
            onClick={() => navigate('/activity')}
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button
            className={`nav-tab ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
          >
            <FontAwesomeIcon icon={faUser} />
          </button>
        </div>
      )}
    </div>
  );
}

const PostSkeleton = ({ variants, custom = 0, ...props }) => (
  <motion.div
    className="post-skeleton dark-mode"
    variants={variants}
    custom={custom}
    initial="hidden"
    animate="visible"
    {...props}
  >
    <div className="skeleton-header">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-user">
        <div></div>
        <div></div>
      </div>
    </div>
    <div className="skeleton-media"></div>
    <div className="skeleton-actions">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-action"></div>
      ))}
    </div>
    <div className="skeleton-caption">
      <div></div>
      <div></div>
    </div>
    <div className="shimmer"></div>
  </motion.div>
);

export default MainContent;