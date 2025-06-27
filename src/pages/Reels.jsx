import React, { useEffect, useRef, useState } from "react";
import "../css/reel.css";
import { useDispatch, useSelector } from "react-redux";
import getReel from "../fetch/getReel";
import VideoReel from "../component/VideoReel";
import { useSocket } from "../socket/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@mui/material";
import { FaArrowUp } from "react-icons/fa";

export default function Reels() {
  const { reels, loading } = useSelector((state) => state.reel);
  const data = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [playable, setPlayable] = useState(0);
  const [mute, setMute] = useState(false);
  const socket = useSocket();
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    getReel(data.user.token, dispatch);
  }, [data.user.token, dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      setShowScrollHint(false);
      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = setTimeout(() => setIsScrolling(false), 200);
    };

    containerRef.current?.addEventListener("scroll", handleScroll);
    return () => {
      containerRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.8,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const index = videoRefs.current.findIndex((video) => video === entry.target);
        if (entry.isIntersecting) {
          setPlayable(index);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [reels]);

  const reelVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: { opacity: 0, y: -20 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  return (
    <div className="reel-app-container">
      <motion.div 
        ref={containerRef}
        className="reel-container"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {loading && (
          <div className="skeleton-loader">
            {[...Array(3)].map((_, i) => (
              <Skeleton 
                key={i} 
                variant="rectangular" 
                animation="wave"
                className="reel-skeleton"
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {reels.map((element, id) => (
            <motion.div
              key={element._id}
              variants={reelVariants}
              layout
            >
              <VideoReel
                _id={element._id}
                ref={(el) => (videoRefs.current[id] = el)}
                src={element.media.url}
                avatar={element.createdBy.avatar}
                userName={element.createdBy.userName}
                playable={id === playable}
                youFollow={element.createdBy.youFollow}
                you={element.createdBy.you}
                mute={mute}
                like={element.likes}
                setMute={setMute}
                comment={element.comment}
                youLiked={element.youLiked}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showScrollHint && (
          <motion.div 
            className="scroll-hint"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 1 }}
          >
            <FaArrowUp className="bounce" />
            <span>Swipe up for more</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}