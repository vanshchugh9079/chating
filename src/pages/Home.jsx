import React, { useEffect, useState } from 'react';
import Sidebar, { SidebarItem } from '../component/Sidebar';
import '../css/home.css'; // Create this CSS file for global styling
import CreateModal from '../component/CreateModel';
import { Outlet } from 'react-router-dom';
import MessageModel from '../component/MessageModel';
import SearchBar from '../component/SearchBar';
import StoryShower from '../component/StoryShower';
import { useDispatch, useSelector } from 'react-redux';
import CommentModel from '../component/CommentModel';
import BottomSidebar from '../component/BottomSidebar';
import EditProfile from './Edit';
function Home() {
  let story = useSelector((state) => state.story)
  let { showComment, comment } = useSelector((state) => state.comment)
  let { showEditModel } = useSelector(state => state.edit)
  return (
    <div className="app bg-black ">
      <div className='d-flex vw-100'>
        <Sidebar />
        <div className='w-100' style={{
          backgroundColor: "black",
          maxWidth:"100%",
          maxHeight:"100vh",
          overflowY:"auto"
        }}>
          <Outlet />
        </div>
      </div>

      <CreateModal />
      <MessageModel />
      {
        showEditModel &&
        <EditProfile />
      }
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