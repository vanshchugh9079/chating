// src/ProfilePage.js
import React, { useEffect, useState } from 'react';
import '../css/messageList.css'; // Import the CSS file for styling
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../contant';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../socket/SocketContext';
import { setShowMessageModel } from '../redux/slice/showMessageModel';
import { setShowEditModel } from '../redux/slice/editSlice';

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

      console.log(chats.data.data.length);

      setAllChat(() => {
        let prevChat = chats.data.data.map((c) => {
          c.people.forEach((people) => {
            if (people.isOnline && people._id !== _id && !c.groupChat) {
              c = { ...c, isOnline: true };
            }
          });
          console.log(c);

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
        setAllChat((prevChat) => {
          prevChat.push(data);
          return prevChat;
        });
      });

      return () => {
        socket.off("online", handleOnline);
        socket.off("chat-created");
        socket.off("offline", handleOffline);
      };
    }
  }, [socket, allChat]);

  useEffect(() => {
    console.log(name);

    getChat();
  }, []);

  return (
    <div className="profile-container p-2 border-0 m-0 position-relative">
      <div className="header m-0 p-0 border-box">
        <h2 className='ms-2  ' >{name}</h2>
        <span className="edit-icon" onClick={() => {
          dispatch(setShowEditModel(true))
        }}>&#9998;</span>
      </div>

      <div className=''>
        <div className='m-0 p-0 btn w-100  p-2' onClick={() => navigate(`/message/${allChat[0]._id}`)}>
          <div className="d-flex v-border position-relative">
            <img src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBQg72aurdEpJDu8909EdLHRsS6-_BL9CXrQ&s"} alt="User Avatar" className="message-avatar" />
            <p className='text-white fw-bold ms-1 fs-6 mt-auto mb-auto me-auto'>{allChat[0]?.name}</p>
            <div className='position-absolute end-0 d-flex align-items-center h-100'>
            </div>
          </div>
        </div>
      </div>
      <div className="m-0 p-0 d-flex justify-content-between">
        <span className='me-auto'>Messages</span>
        <span className='ms-auto'>Requests</span>
      </div>
      <div className="chat-list-container d-flex flex-column m-lg-0   ">
        {allChat.length > 0 ? allChat.map((chat, id) => (
          <>
            <div className={`m-0  btn w-100 p-2 p-lg-0 ${(chat.name === "chat with ai" || id === 0) && "d-none"}`} key={id} onClick={() => navigate(`/message/${chat?._id}`)}>
              <div className="d-flex v-border position-relative">
                <img src={chat?.avatar?.url} alt="User Avatar" className="message-avatar" />
                <p className='text-white fw-bold ms-1 fs-6 mt-auto mb-auto me-auto'>{chat?.name}</p>
                {/* <div className='position-absolute end-0 d-flex align-items-center h-100'>
                <div className={`text-success online ${!chat?.isOnline && "d-none"} fw-bold me-3`}></div>
              </div> */}
              </div>
            </div>
          </>
        )) : <p className='text-secondary'>No messages found.</p>}
      </div>
      <div className='   d-flex justify-content-end    bottom-0 mb-5 bottom-lg-0 position-fixed      p-0 border-box  w-100 '>
        <button className="new-chat-button ms-2 ms-lg-5  me-auto " onClick={() => {
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
