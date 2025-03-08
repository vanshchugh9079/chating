import React, { useState, useEffect, useRef } from "react";
import "../css/post.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faHeart, faMessage, faSave } from "@fortawesome/free-solid-svg-icons";
import { useSocket } from "../socket/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setComment, setShowComment } from "../redux/slice/commentSlice";
import { setUserData } from "../redux/slice/user.slice";
import { api } from "../contant";

export default function Post({ likes, key, avatar, src, userName, createdAt, _id, youLiked, comment, page }) {
  const [useAutoMargin, setUseAutoMargin] = useState(false);
  const user = useSelector((state) => state.user.user)
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likes);
  const [saved,setSaved]=useState(false)
  const imageRef = useRef(null);
  let dispatch = useDispatch();
  let socket = useSocket()
  useEffect(() => {
    if (imageRef.current) {
      const imgWidth = imageRef.current.clientWidth;
      setUseAutoMargin(imgWidth >= 500); // Adjust threshold as needed
    }
    let savedPost =user.savedPost.filter((post)=>{
      console.log(post);
      if(post._id){
        return post._id == _id;
      }
      else{
        return post==_id;
      }
    })
    if(savedPost.length>0){
      setSaved(true)
    }else{
      setSaved(false)
    }
    
  }, []);
  useEffect(() => {
    setLiked(youLiked);
  }, [youLiked]);
  useEffect(() => {
    if (!socket) return;
    let getLike = ({ post }) => {
      if (post._id === _id) {
        console.log(post);
        setCount(post.likes.length)
      }
    }
    let likeSuccess = (post) => {
      console.log(post)
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

  const handleDate = () => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} m `;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h `;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} d `;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} mon `;
    return `${Math.floor(diffInSeconds / 31536000)} y`;
  };
  const handleLike = () => {
    socket.emit("liked-post", {
      post: _id,
      id: user._id,
      liked: !liked
    })
    setLiked(!liked)
  };
  return (
    <div className="mb-5" id={_id}>
      <div className="post-top ms-lg-5 ms-1  d-flex flex-column">
        <div className="d-flex">
          <div className="post-image rounded-circle">
            <img src={avatar} alt="avatar" className="w-100 h-100 rounded-circle" />
          </div>
          <div className="post-user text-white ms-3">
            <span>{userName} -</span>
            <span className="text-secondary">{handleDate()}</span>
            <p className="opacity-75" style={{ fontSize: "13px" }}>music</p>
          </div>
        </div>
        <div className="post-media ms-auto me-auto mb-5 ">
          <img ref={imageRef} src={src} alt="Post" className="img-fluid pointer" onClick={() => {
            dispatch(setComment({
              media: src,
              type: "post",
              comment: comment,
              _id: _id,
              on: "media"
            }))
            dispatch(setShowComment(true));
          }} />

          {
            page != "explore" &&
            <>
              <div className="mt-1 d-flex w-100 ">
                <FontAwesomeIcon icon={faHeart} className={`fs-3 ${liked ? "text-danger" : "post-icon"} icon `} title="like" onClick={() => {
                  handleLike()
                }} />
                <FontAwesomeIcon icon={faMessage} className="fs-3 post-icon icon ms-2" title="comment" onClick={() => {
                  dispatch(setComment({
                    media: src,
                    type: "post",
                    comment: comment,
                    _id: _id,
                    on: "comment"
                  }))
                  dispatch(setShowComment(true));
                }} />
                <FontAwesomeIcon icon={faBookmark} className={`fs-3 post-icon ${saved ?"text-white":""} icon ms-auto `}  onClick={async()=>{
                  console.log("save post")
                  let res;
                  if(!saved){
                    setSaved(true)
                     res=await api.get("/post/save/1/"+_id,{
                      headers:{
                        Authorization:`Bearer ${user.token}`,
                      }
                    })
                  }
                  else{
                    setSaved(false)
                    res=await api.get("/post/save/0/"+_id,{
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
                }}/>
              </div>
              <p className="text-white fs-6">{count} likes</p>
            </>
          }
        </div>
      </div>
    </div>
  );
}
