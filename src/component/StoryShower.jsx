import React, { useEffect, useState, useRef } from 'react';
import "../css/storyShower.css";
import { useDispatch } from 'react-redux';
import { setShowStory, setStory } from '../redux/slice/showStoryModel';
import { setShowModel } from '../redux/slice/showCreateModel';

export default function StoryShower({ name, avatar, media, you }) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentMedia, setCurrentMedia] = useState(0);
    const dispatch = useDispatch();
    const timerRef = useRef(null);
    const totalDuration = 10000; // 10 seconds per story
    const isPaused = useRef(false); // To track pause state

    // Helper function to determine media type
    const isImage = (url) => {
        if (!url) return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const fileExtension = url.split('.').pop().toLowerCase();
        return imageExtensions.includes(fileExtension);
    };

    // Handle media transitions (auto change to next media item)
    const handleMediaEnded = () => {
        if (currentMedia + 1 < media.length) {
            setCurrentMedia((prevMedia) => prevMedia + 1);
        } else {
            clearInterval(timerRef.current);
            dispatch(setShowStory(false)); // Close story view
            dispatch(setStory({ name: '', media: [], avatar: {} }));
        }
    };

    // Auto-progress with pause & resume
    useEffect(() => {
        if (currentMedia >= media.length) {
            clearInterval(timerRef.current);
            dispatch(setShowStory(false));
            dispatch(setStory({ name: '', media: [], avatar: {} }));
            return;
        }

        const updateProgress = () => {
            if (isPaused.current) return; // Pause if user is holding

            setTimeLeft((prev) => {
                if (prev >= totalDuration) {
                    if (currentMedia + 1 < media.length) {
                        setCurrentMedia((prevMedia) => prevMedia + 1);
                        return 0; // Reset for next media
                    } else {
                        clearInterval(timerRef.current);
                        dispatch(setShowStory(false));
                        dispatch(setStory({ name: '', media: [], avatar: {} }));
                        return totalDuration;
                    }
                }
                return prev + 100; // Update every 100ms
            });
        };

        timerRef.current = setInterval(updateProgress, 100);
        return () => clearInterval(timerRef.current);
    }, [currentMedia, media, dispatch]);

    useEffect(() => {
        setTimeLeft(0); // Reset time on media change
    }, [currentMedia]);

    // Handle progress bar click
    const handleProgressClick = (index) => {
        clearInterval(timerRef.current);
        setCurrentMedia(index);
        setTimeLeft(0);
    };

    // Pause timer on mouse down
    const handleMouseDown = () => {
        isPaused.current = true;
    };

    // Resume timer on mouse up
    const handleMouseUp = () => {
        isPaused.current = false;
    };

    return (
        <div className="story-shower-backdrop">
            <div className="story-container h-100 position-relative">
                {/* Clickable Multi-Segment Progress Bar */}
                <div className="progress-bar-container position-absolute start-0 top-0 w-100 d-flex">
                    {media.map((_, index) => (
                        <div
                            key={index}
                            className="progress-segment"
                            style={{
                                flex: 1,
                                height: "5px",
                                margin: "0 2px",
                                backgroundColor: index < currentMedia ? "white" : "rgba(255, 255, 255, 0.5)",
                                cursor: "pointer",
                                position: "relative",
                                overflow: "hidden",
                            }}
                            onClick={() => handleProgressClick(index)}
                        >
                            {index === currentMedia && (
                                <div
                                    className="progress-active v-progress-active"
                                    style={{
                                        height: "100%",
                                        backgroundColor: "white",
                                        width: `${(timeLeft / totalDuration) * 100}%`,
                                        transition: "width 0.1s linear",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Story Header */}
                <div className="story-header">
                    <img src={avatar?.url} alt="avatar" className="rounded-circle story-img" />
                    <p>{name}</p>
                    <h5
                        className="ms-auto me-3 btn-cross fw-bold"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            clearInterval(timerRef.current);
                            dispatch(setShowStory(false));
                            dispatch(setStory({ name: '', media: [], avatar: {} }));
                        }}
                    >
                        X
                    </h5>
                </div>

                {/* Story Media with Pause Feature */}
                <div 
                    className="story-media w-100 position-relative"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown} // Mobile support
                    onTouchEnd={handleMouseUp}
                >
                    {isImage(media[currentMedia]?.media?.url) ? (
                        <img
                            src={media[currentMedia]?.media?.url}
                            alt="media"
                            className="w-100 position-relative"
                        />
                    ) : (
                        <video
                            src={media[currentMedia]?.media?.url}
                            controls
                            autoPlay
                            muted
                            onEnded={handleMediaEnded}
                            className="w-100"
                        />
                    )}

                    {/* Plus Button for adding a new story */}
                    {you && (
                        <div
                            className="position-absolute bottom-0 end-0 mt-2 rounded-circle story-plus"
                            style={{ zIndex: 10, cursor: "pointer" }}
                            onClick={() => {
                                dispatch(setStory({ name: '', media: [], avatar: {}, you: false }));
                                dispatch(setShowModel(true));
                            }}
                        >
                            <div
                                className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "50px", height: "50px" }}
                            >
                                <h2 className="text-white m-0 fw-bold">+</h2>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
