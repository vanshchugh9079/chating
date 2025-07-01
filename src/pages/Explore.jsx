import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setComment, setShowComment } from '../redux/slice/commentSlice';
import { motion } from 'framer-motion';
import "../css/explore.css"
export default function Explore() {
    const posts = useSelector((state) => state.post.posts);
    const reels = useSelector(state => state.reel.reels);
    const [displayContent, setDisplayContent] = useState([]);
    const { user } = useSelector(state => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        // Combine and take only first 12 items (3x4 grid)
        const combined = [...posts, ...reels]
            .slice(0, 12)
            .map(item => ({
                ...item,
                aspectRatio: item.media?.type === 'video' ? 9/16 : 1/1 // Reels get taller aspect
            }));
        setDisplayContent(combined);
    }, [posts, reels]);

    return (
        <div className="w-full p-4 bg-gray-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-4 grid-rows-3 gap-3 w-full max-w-6xl h-[85vh]"
            >
                {displayContent.map((element) => (
                    <motion.div
                        key={element._id}
                        whileHover={{ scale: 0.97 }}
                        className={`relative group rounded-xl overflow-hidden shadow-md bg-gray-200 ${
                            element.aspectRatio > 1 ? 'row-span-2' : ''
                        }`}
                        style={{
                            aspectRatio: element.aspectRatio
                        }}
                    >
                        {/* Media thumbnail with perfect fit */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {element.media?.type === 'video' ? (
                                <video
                                    src={element.media.url}
                                    className="w-full h-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={element.media?.url}
                                    alt="Content"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {/* Smart overlay with contextual info */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <motion.div 
                                            whileTap={{ scale: 0.9 }}
                                            className="flex items-center text-white"
                                        >
                                            <HeartIcon filled={element.youLiked} />
                                            <span className="text-xs ml-1 font-medium">{element.likes?.length || 0}</span>
                                        </motion.div>
                                        
                                        <motion.div 
                                            whileTap={{ scale: 0.9 }}
                                            className="flex items-center text-white cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dispatch(setComment(element.comments || []));
                                                dispatch(setShowComment(true));
                                            }}
                                        >
                                            <CommentIcon />
                                            <span className="text-xs ml-1 font-medium">{element.comments?.length || 0}</span>
                                        </motion.div>
                                    </div>
                                    
                                    {element.media?.type === 'video' && (
                                        <div className="w-6 h-6 rounded-full border border-white overflow-hidden">
                                            <img 
                                                src={element.createdBy?.avatar?.url} 
                                                alt={element.createdBy?.userName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Caption preview */}
                                {element.caption && (
                                    <p className="text-white text-xs mt-2 line-clamp-2">
                                        {element.caption}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Badge for video content */}
                        {element.media?.type === 'video' && (
                            <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-1">
                                <span className="text-white text-xs font-medium">REEL</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

// Custom Icons for better visual consistency
const HeartIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={filled ? "#ff0050" : "none"} viewBox="0 0 24 24" stroke={filled ? "#ff0050" : "white"}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={filled ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);