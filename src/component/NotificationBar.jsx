import React from 'react';
import "../css/notificationBar.css";
import { useSocket } from '../socket/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setComment, setShowComment } from '../redux/slice/commentSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMultiply } from '@fortawesome/free-solid-svg-icons';
import { showNoti } from '../redux/slice/showMobileNotification';

export default function NotificationBar({ showBar, notifications, setShowBar ,setDecresWidth ,allNotification,setNotifications }) {
  let user = useSelector(state => state.user.user);
  let onMobile=useSelector((state)=>state.showNoti.show)
  let socket = useSocket();
  let dispatch=useDispatch()
  let navigate=useNavigate();
  const handleRequest = (notification, accept) => {
    socket.emit("accept-request", {
      userId: notification.user._id,
      id: user._id,
      accept
    });
  };

  const handleFollow = (notification) => {
    socket.emit("follow-user", { userId: notification.user._id });
  };

  return (
    <div className={`${onMobile ?"bar-mobile d-block":`${showBar ? "bar-open" : "bar-close"} d-none`}  bg-black vh-100 position-fixed bar w-0  d-lg-block position-relative`}>
      <h4 className='text-white mt-4 fw-bold'>Notification</h4>
      <div className='position-absolute end-0 me-3 d-lg-none  top-0 mt-4' onClick={()=>{
        dispatch(showNoti(false))
      }}>
        <FontAwesomeIcon icon={faMultiply} className='text-white fs-1 cross pointer'/>
      </div>
      <div className='ps-2 pe-2 d-flex flex-column-reverse'>
        {notifications && notifications.map(notification => (
          <div 
            key={notification.id} 
            className="p-2 text-decoration-none notification-box d-block" 
            onClick={()=>{
              if(notification.on === "post" ){
                dispatch(setComment({
                  media:notification.post.media.url,
                  type:"post",
                  comment:notification.post.comment,
                  _id:notification.post._id
                }))
                dispatch(setShowComment(true));
                socket.emit("read-notification", allNotification);
                setNotifications(0);
              }
              else if(notification.on === "reel"){
                console.log(notification.reel.media);
                
                dispatch(setComment({
                  media:notification.reel.media.url,
                  type:"reel",
                  comment:notification.reel.comment,
                  _id:notification.reel._id
                }))
                dispatch(setShowComment(true));
                socket.emit("read-notification", allNotification);
                setNotifications(0);
              }
              else if(notification.on === "profile"){
                socket.emit("read-notification", allNotification);
                setNotifications(0);
                setShowBar(false)
                navigate("/profile/"+notification.profile.name)
              }

            }}
          >
            <div className='mb-2 d-flex gap-3'>
              {notification?.user?.avatar?.url && (
                <img 
                  src={notification.user.avatar.url} 
                  className='rounded-circle p-0 m-0' 
                  height={50} 
                  width={50} 
                  alt={`user ${notification.user.username}`} 
                />
              )}
              <div>
                <p className={`${!notification.seen ? "text-primary" : "text-white"} mt-2 d-inline`}>
                  {notification.content}
                </p>
              </div>
            </div>
            <div className='d-flex justify-content-center gap-1 '>
              {notification.type === "request" && (
                <>
                  <button 
                    className='btn btn-primary' 
                    onClick={(e) => {
                      e.preventDefault();  // Prevents Link navigation
                      e.stopPropagation();
                      handleRequest(notification, true); // Accept request
                    }}
                  >
                    Accept
                  </button>
                  <button 
                    className='btn btn-danger' 
                    onClick={(e) => {
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleRequest(notification, false); // Reject request
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
              {notification.type === "follow" && (
                <button 
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFollow(notification); // Follow user
                  }}
                >
                  Follow
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
