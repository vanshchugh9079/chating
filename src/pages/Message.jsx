import React, { useEffect } from 'react'
import MessageList from '../component/MessageList'
import { Outlet } from 'react-router-dom'
import { useSocket } from '../socket/SocketContext'
import { useSelector } from 'react-redux';
export default function Message() {
  const onMobile = useSelector((state) => state.showNoti.message);
  useEffect(() => {
    console.log(onMobile);

  }, [])
  return (
    <div className='d-flex w-100 me-auto'>
      <MessageList />
      {
        !onMobile &&
        <Outlet />
      }
    </div>
  )
}
