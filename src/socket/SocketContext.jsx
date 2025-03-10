import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';

const SOCKET_SERVER_URL = "http://localhost:3000"; // Replace with your Socket.IO server URL
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { loggedIn, user } = useSelector(state => state.user); // Directly use `isLoggedIn`
  useEffect(() => {
    if (socket && user) {
      socket.emit("register", user._id)
    }
  }, [socket,setSocket]);
  useEffect(() => {
    let newSocket;
    if (loggedIn) {
      // Establish the socket connection
      newSocket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
      });
      setSocket(newSocket);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [loggedIn]); // Use `isLoggedIn` as dependency
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
export const useSocket = () => useContext(SocketContext);
