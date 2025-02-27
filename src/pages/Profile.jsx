import React, { useEffect, useState } from 'react';
import '../css/profile.css';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTableCells, faUser, faVideo } from '@fortawesome/free-solid-svg-icons';
import getProfile from '../fetch/getProfile';
import { useParams } from 'react-router-dom';
import { useSocket } from '../socket/SocketContext.jsx'
const DEFAULT_AVATAR = '/default-avatar.png';
const DEFAULT_POST = '/default-post.png';
const Profile = () => {
  const { profile } = useSelector((state) => state.profile);
  const { token, name, _id } = useSelector((state) => state.user.user);
  const [youFollow, setYouFollow] = useState(false);
  const [requested, setRequested] = useState(false)
  const [showAccept, setShowAccept] = useState(false);
  const [user, setUser] = useState({
    _id: "",
    avatar: { url: '' },
    name: '',
    follower: [],
    following: [],
    type: ""
  });
  let socket = useSocket();
  const [post, setPost] = useState([]);
  const dispatch = useDispatch();
  const param = useParams();
  useEffect(() => {
    getProfile(param.name, token, dispatch).catch((err) =>
      console.error('Failed to fetch profile:', err)
    );
  }, [param.name, token, dispatch, youFollow]);
  useEffect(() => {
    if (socket) {
      socket.on("follow-success", (user) => {
        setYouFollow(true);
        setUser((prev) => {
          prev.follower.push(user)
          return prev;
        })
        console.log("you foolow succesfully");
      })
      socket.on("unfollow-success", (data) => {
        setYouFollow(false)
        setUser((prev) => {
          prev.follower = prev.follower.filter(follower => follower._id !== user._id)
          return prev;
        })
      })
      socket.on("requested", () => {
        setRequested(true)
      })
      socket.on("accept-request", () => {
        
        setShowAccept(false)
        setYouFollow(true)
      })
      socket.on("decline-request", (user) => {
        setRequested(false);
        console.log(user + "decline request recievee");
      })
      socket.on("decline-request-success", (user) => {
        setShowAccept(false)
        console.log("you decline request successfully");
      })
      socket.on("follow-request", (user) => {
        getProfile(param.name, token, dispatch).catch((err) =>
          console.error('Failed to fetch profile:', err)
        );
        setShowAccept(true)
      })
      socket.on("accept-request-success", (user) => {
        setShowAccept(false)
        getProfile(param.name, token, dispatch)
        console.log("you accept request successfully");
      })
    }
  }, [socket])
  useEffect(() => {
    if (profile.user) {
      setUser({
        _id: profile?.user._id,
        avatar: { url: profile.user.avatar.url || DEFAULT_AVATAR },
        name: profile.user.name || profile.name,
        follower: profile.user.follower || profile.followers || [],
        following: profile.user.following || profile.following || [],
        type: profile.user.type
      });
      setRequested(profile.requested)
      console.log(profile);
      setYouFollow(profile.youFollow)
      setShowAccept(profile.requestContain)
      setPost(profile.posts || []);
    }
  }, [profile]);

  return (
    <div className="profile-page  p-0 ps-2 pt-2 ">
      <header className="profile-header">
        <img
          className="profile-picture"
          src={user.avatar.url}
          alt="Profile"
        />
        <div className="profile-info m-0">
          <div className="d-flex ms-lg-5 m-0">
            <h1 className="username d-inline m-0 p-0">{user.name}</h1>
            <button className={`edit-button ms-3 ${name !== param.name && "d-none"}  m-0`}>Edit profile</button>
            <button className={`edit-button ms-3 ${!youFollow && "d-none"}  m-0`}>message</button>
            <button className={`edit-button ms-3 ${!youFollow && "d-none"}  m-0`} onClick={() => {
              socket.emit("unfollow", {
                id: _id,
                userId: user._id,
              })
            }}>unfollow</button>
            {
              !youFollow && user.type === "public" && name !== param.name &&
              <button className={`edit-button ms-3  m-0`} onClick={() => {
                socket.emit("follow", {
                  id: _id,
                  userId: user._id,
                })
              }}>follow</button>
            }
            {
              !youFollow && user.type === "private" && name !== param.name &&
              <button className={` ${requested ? "disabled-btn" : ""} edit-button  send-btn  ms-3 m-0`} disabled={requested} title={requested ? "Request already sent" : ""}
                onClick={() => {
                  if (!requested) {
                    socket.emit("send-request", {
                      id: _id,
                      userId: user._id,
                    })
                  }
                }}>{requested ? "requested" : "send request"}</button>
            }
            {
              showAccept &&
              <button className={`edit-button ms-3 m-0`} onClick={() => {
                socket.emit("accept-request", {
                  id: _id,
                  userId: user._id,
                  accept: true,
                })
                setShowAccept(false)
                setRequested(false)
              }}>Accept</button>
            }
            {
              showAccept &&
              <button className={`edit-button ms-3 m-0`} onClick={() => {
                socket.emit("accept-request", {
                  id: _id,
                  userId: user._id,
                  accept: false
                })
                setRequested(false)
                setShowAccept(false)
              }}>Decline</button>
            }
          </div>
          <div className="stats d-flex gap-5 ms-lg-5 m-0" >
            <span>
              <span className="fw-bold">{post.length}</span> posts
            </span>
            <span>
              <span className="fw-bold">{user.follower.length}</span> followers
            </span>
            <span>
              <span className="fw-bold">{user.following.length}</span> following
            </span>
          </div>
          <div className="bio ms-lg-5">
            <p className='fw-bold'>{user.name}</p>
            <p>Self obsessed 😊</p>
          </div>
        </div>
      </header>
      <section className="highlights gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="highlight p-0 bg-black">
            <img
              src={user.avatar.url}
              className="rounded-circle p-0 m-0"
              height={100}
              width={100}
              alt={`Highlight ${index + 1}`}
            />
            <p>highlight</p>
          </div>
        ))}
      </section>
      <nav className="profile-nav">
        <ul className="d-flex w-100 justify-content-between p-0">
          <li className="text-decoration-none list-style-none my-list ms-2">
            <FontAwesomeIcon icon={faTableCells} className="me-2 " />
            POSTS
          </li>
          <li className="text-decoration-none list-style-none my-list">
            <FontAwesomeIcon icon={faVideo} className="me-2" />
            REELS
          </li>
          <li className="text-decoration-none list-style-none my-list me-2">
            <FontAwesomeIcon icon={faSave} className="me-2" />
            SAVED
          </li>
        </ul>
      </nav>
      <section className="posts-grid m-0 p-0">
        {post.map((p, index) => (
          <div className="m-0 post p-0 profile-box" key={index}>
            <img
              src={p.media.url}
              alt={`Post ${index + 1}`}
              style={{ objectFit: "cover" }}
              className=" w-100 h-100 m-0 p-0 "
              onError={(e) => (e.target.src = DEFAULT_POST)}
            />
          </div>
        ))}
      </section>
    </div>
  );
};

export default Profile;
