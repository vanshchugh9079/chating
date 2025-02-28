import React, { useEffect, useState } from 'react';
import Sidebar, { SidebarItem } from '../component/Sidebar';
import '../css/home.css'; // Create this CSS file for global styling
import CreateModal from '../component/CreateModel';
import { Outlet } from 'react-router-dom';
import MessageModel from '../component/MessageModel';
import SearchBar from '../component/SearchBar';
import StoryShower from '../component/StoryShower';
import { useSelector } from 'react-redux';
import CommentModel from '../component/CommentModel';
import BottomSidebar from '../component/BottomSidebar';
import { faBell, faMessage } from '@fortawesome/free-solid-svg-icons';
function Home() {
  let story = useSelector((state) => state.story)
  let { showComment, comment } = useSelector((state) => state.comment)
  return (
    <div className="app bg-black">
      <Sidebar />
      <div className='w-100 bg-black ' style={{
        backgroundColor: "black"
      }}>
        
        <Outlet />
        <BottomSidebar />
      </div>
      <CreateModal />
      <MessageModel />
      {
        story.showStory &&
        <StoryShower name={story.name} media={story.media} avatar={story.avatar} you={story.you} />
      }
      {
        showComment &&
        <CommentModel comment={comment} />
      }
    </div>
  );
}

export default Home;