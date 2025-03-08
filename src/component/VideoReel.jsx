import React, { useEffect, useRef, useState } from "react";
import "../css/videoReel.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faComment, faHeart, faPlay, faShare, faVolumeHigh, faVolumeMute } from "@fortawesome/free-solid-svg-icons";
import { setComment, setShowComment } from "../redux/slice/commentSlice";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../socket/SocketContext";
import { setUserData } from "../redux/slice/user.slice";
import { api } from "../contant";

const VideoReel = React.forwardRef(({ setMute, mute, userName, avatar, src, playable, youFollow, you,like, _id, comment,youLiked }, ref) => {
  const[likes,setLikes]=useState(like.length)
  const [liked, setLiked] = useState(youLiked);
  const [showPlayIcon, setShowPlayIcon] = useState(!playable);
  const user = useSelector((state) => state.user.user)
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true); // Loader state
  const [saved,setSaved]=useState(false);
  useEffect(()=>{
    let savedReel=user.savedReel.filter((reel)=>{
      return reel==_id;
    })
    if(savedReel.length>0){
      setSaved(true)
    }
  },[])
  let socket = useSocket()
  let dispatch = useDispatch()
  const videoRef = useRef(null);
  const handleLike = () => {
    socket.emit("liked-post", {
      post: _id,
      id: user._id,
      liked: !liked,
      type: "reel"
    })
    if(liked){
      setLikes(likes-1)
    }
    else{
      setLikes(likes+1)
    }
    setLiked(!liked)
  };
  useEffect(() => {
    if (videoRef.current) {
      if (playable) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = mute
        videoRef.current.play();
        setShowPlayIcon(false);
      } else {
        videoRef.current.muted = mute;
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setShowPlayIcon(true);
      }
    }
  }, [playable]);

  // Update range slider as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage || 0);
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", () => setLoading(false)); // Hide loader when metadata is loaded

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", () => setLoading(false));
    };
  }, []);

  // Seek video when range slider is changed
  const handleSeek = (e) => {
    if (videoRef.current) {
      const newTime = (e.target.value / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(e.target.value);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setShowPlayIcon(false);
      } else {
        videoRef.current.pause();
        setShowPlayIcon(true);
      }
    }
  };

  return (
    <div
      ref={ref}
      className="video-reel bg-dark mt-2 ms-auto me-auto w-25 position-relative d-flex justify-content-center align-items-center"
      onClick={togglePlay}
    >
      {/* Loader */}
      {loading && (
        <div className="video-loader position-absolute top-50 start-50 translate-middle">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="h-100 w-100 reel-cont p-3 p-lg-0">
        <video
          ref={videoRef}
          className="video-player"
          src={src}
          loop
          aria-label="Video player"
          onLoadedMetadata={() => setLoading(false)} // Hide loader when ready
        />
      </div>
      <div className="  position-absolute end-0 top-0 mt-2 me-2 text-white mute-btn p-2" onClick={(e) => {
        e.stopPropagation();
        setMute(!mute);
        if (videoRef.current) {
          videoRef.current.muted = !mute;
        }
      }}>
        {
          mute &&
          <FontAwesomeIcon icon={faVolumeMute}></FontAwesomeIcon>
        }
        {
          !mute &&
          <FontAwesomeIcon icon={faVolumeHigh}></FontAwesomeIcon>
        }
      </div>
      <div className="position-absolute d-flex bottom-0 start-0 mb-4 ms-3">
        <img src={avatar.url} alt="" className="rounded-circle mt-1" style={{ height: "30px", width: "30px" }} />
        <div className="d-flex align-items-center">
          <p className="text-white ms-2 fw-bold">{userName}.</p>
        </div>
        <div>
          {
            !youFollow && !you &&
            <button className="ms-2 text-white bg-transparent btn mb-3 v-btn">
              {!you && !youFollow && "Follow"}
            </button>
          }
        </div>
      </div>

      <div className="video-overlay position-absolute bottom-0 fs-2 end-0 d-flex flex-column mb-3">
        <FontAwesomeIcon
          icon={faHeart}
          className={`me-1 mb-0 ${liked ? "text-danger" : "link-overlay"}`}
          onClick={(e) => {
            e.stopPropagation();
            handleLike()
          }}
          style={{ cursor: "pointer" }}
        />
        <div className="d-inline m-0 p-0   bottom-0 end-0 d-flex justify-content-center align-items-center  ">
          <p className="text-white m-0 p-0 me-1 d--inline fs-6">{likes}</p>
        </div>
        <FontAwesomeIcon
          icon={faComment}
          className="me-1 link-overlay"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(setComment({
              media: src,
              type: "reel",
              comment: comment,
              _id: _id,
              on:"comment"
            }))
            dispatch(setShowComment(true));
          }}
          style={{ cursor: "pointer" }}
        />
        <div className="d-inline m-0 p-0   bottom-0 end-0 d-flex justify-content-center align-items-center  ">
          <p className="text-white mb-1 m-0 p-0 me-1 d--inline fs-6">{comment?.length}</p>
        </div>
        <FontAwesomeIcon
          icon={faBookmark}
          className={`me-1 mb-2 link-overlay ${saved ?"text-white":""}`}
          onClick={async(e) => {
            e.stopPropagation()
            let res;
            if(!saved){
              setSaved(true)
               res=await api.get("/reel/save/1/"+_id,{
                headers:{
                  Authorization:`Bearer ${user.token}`,
                }
              })
            }
            else{
              setSaved(false)
              res=await api.get("/reel/save/0/"+_id,{
                headers:{
                  Authorization:`Bearer ${user.token}`,
                }
              })
            }
            console.log(res);
            
            dispatch(setUserData({
              user:res.data.data,
              loggedIn: true
            }))
          }}
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* Range input for video progress */}
      <div className="w-100 position-absolute bottom-0 m-0 p-0">
        <input
          type="range"
          className="w-100 v-range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {showPlayIcon && (
        <div
          className="video-play showUp"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          <FontAwesomeIcon icon={faPlay} className="play-icon text-white position-absolute fs-1" />
        </div>
      )}
    </div>
  );
});

export default VideoReel;
