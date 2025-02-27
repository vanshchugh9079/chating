// src/ProfilePage.js
import React, { useEffect, useState } from 'react';
import '../css/messageList.css'; // Import the CSS file for styling
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../contant';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../socket/SocketContext';
import { setShowMessageModel } from '../redux/slice/showMessageModel';

const MessageList = () => {
  let { name, token, _id } = useSelector(state => state.user.user);
  let [allChat, setAllChat] = useState([]);
  let socket = useSocket();
  let navigate = useNavigate();
  let dispatch = useDispatch()
  let getChat = async () => {
    try {
      let chats = await api.get("/chat", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAllChat(() => {
        let prevChat = chats.data.data.map((c) => {
          c.people.forEach((people) => {
            if (people.isOnline && people._id !== _id && !c.groupChat) {
              c = { ...c, isOnline: true };
            }
          });
          return c;
        });
        return prevChat;
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (socket) {
      let handleOnline = (user) => {
        setAllChat((prevChat) => {
          return prevChat.map((c) => {
            c.people.forEach((people) => {
              if (people._id === user._id) {
                c = { ...c, isOnline: true };
              }
            });
            return c;
          });
        });
      };

      let handleOffline = (user) => {
        setAllChat((prevChat) => {
          return prevChat.map((c) => {
            c.people.forEach((people) => {
              if (people._id === user._id) {
                c = { ...c, isOnline: false };
              }
            });
            return c;
          });
        });
      };

      socket.on("offline", handleOffline);
      socket.on("online", handleOnline);
      socket.on("chat-created", (data) => {
        setAllChat((prevChat) => [data, ...prevChat]);
      });

      return () => {
        socket.off("online", handleOnline);
        socket.off("chat-created");
        socket.off("offline", handleOffline);
      };
    }
  }, [socket, setAllChat]);

  useEffect(() => {
    getChat();
  }, []);

  return (
    <div className="profile-container p-2 border-0 m-0 position-relative">
      <div className="header m-0 p-0 border-box">
        <h2 className='ms-2  ' >{name} <span className="dropdown">&#9662;</span></h2>
        <span className="edit-icon">&#9998;</span>
      </div>
      <div className="note-section m-0 p-0">
        <div className="note-icon">
          <span>Note...</span>
          <div className="note-image"></div>
          <p className='text-secondary'>Your note</p>
        </div>
      </div>
      <div className="m-0 p-0 d-flex justify-content-between">
        <span className='me-auto'>Messages</span>
        <span className='ms-auto'>Requests</span>
      </div>
      <div className="chat-list-container p-2">
        {allChat.length > 0 ? allChat.map((chat, id) => (
          <div className='m-0 p-0 btn w-100 mt-2' key={id} onClick={() => navigate(`/message/${chat?._id}`)}>
            <div className="d-flex v-border position-relative">
              <img src={chat?.avatar?.url} alt="User Avatar" className="message-avatar" />
              <p className='text-white fw-bold ms-1 fs-6 mt-auto mb-auto me-auto'>{chat?.name}</p>
              <div className='position-absolute end-0 d-flex align-items-center h-100'>
                <div className={`text-success online ${!chat?.isOnline && "d-none"} fw-bold me-3`}></div>
              </div>
            </div>
          </div>
        )) : <p className='text-secondary'>No messages found.</p>}
      </div>
        <div className='  bottom-lg-0 d-flex justify-content-end position-absolute fixed-bottom   p-0 border-box  mb-lg-3 mb-5 me-5 justify-content-lg-center w-100 '>
          <button className="new-chat-button me-2 mb-3 m-lg-0    " onClick={() => {
            dispatch(setShowMessageModel(true))
          }}>
            + New Chat
          </button>
        </div>

      {/* New Chat Button */}
    </div>
  );
};

export default MessageList;
