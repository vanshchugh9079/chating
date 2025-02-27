import React, { useEffect, useRef, useState } from "react";
import "../css/reel.css"
import { useDispatch, useSelector } from "react-redux";
import getReel from "../fetch/getReel";
import VideoReel from "../component/VideoReel";
import { useSocket } from "../socket/SocketContext";

export default function Reels() {
  const { reels } = useSelector((state) => state.reel);
  const data = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [playable, setPlayable] = useState(0);
  let [mute,setMute]=useState(false)
  let socket=useSocket()
  const videoRefs = useRef([]);

  useEffect(() => {
    getReel(data.user.token, dispatch);
  }, [data.user.token, dispatch]);

  useEffect(() => {
    const observerOptions = {
      root: null, // Observe relative to viewport
      threshold: 0.8, // Trigger when 80% of the video is visible
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
  useEffect(() => {
    if(!socket) return;
    let getLike = ({ post }) => {
      if (post._id === _id) {
        console.log(post);
        setCount(post.likes.length)
      }
    }
    let likeSuccess = (post) => {
      if (post._id == _id) {
        setCount(post.likes.length);
      }
    }
    socket.on("liked-post", getLike)
    socket.on("liked-post-success", likeSuccess)
    return () => {
      socket.off("post-liked", getLike)
      socket.off("liked-post-success", likeSuccess)
    }
  }, [socket])

  return (
    <div className="d-flex justify-content-center bg-black w-100 m-0 p-0 reel-content " >
      <div className="w-100 bg-black  m-0 pb-3" style={{ minHeight: "100vh" }}>
        {reels.map((element, id) => (
          <VideoReel
            key={id}
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
        ))}
      </div>
    </div>
  );
}
