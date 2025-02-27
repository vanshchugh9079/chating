import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MainContent from "./component/MainContent";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Reels from "./pages/Reels";
import Message from "./pages/Message";
import MessageDetailer from "./component/MessageDetailer";
import MessageShower from "./component/MessageShower";
import SearchBar from "./component/SearchBar";
import ChatBox from "./component/ChatBox";

export default function App() {
  const user = useSelector((state) => state.user || {});
  const onMobile = useSelector((state) => state.showNoti?.message);

  return (
    <BrowserRouter>
      <Routes>
        {user?.loggedIn ? (
          <Route path="/" element={<Home />}>
            <Route index element={<MainContent />} />
            <Route path="search" element={<SearchBar />} />
            <Route path="profile/:name" element={<Profile />} />
            <Route path="reel" element={<Reels />} />

            {/* Conditional Message Routes */}
            {onMobile ? (
              <>
                <Route path="message" element={<Message />} />
                <Route path="message/:chatId" element={<MessageShower />} />
                <Route path="message/chat/:chatId" element={<ChatBox />} />
              </>
            ) : (
              <Route path="message" element={<Message />}>
                <Route index element={<MessageDetailer />} />
                <Route path=":chatId" element={<MessageShower />} />
                <Route path="chat/:chatId" element={<ChatBox />} />
              </Route>
            )}
          </Route>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
          </>
        )}

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to={user.loggedIn ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
