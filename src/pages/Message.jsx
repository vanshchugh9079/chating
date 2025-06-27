import React, { useEffect } from 'react'
import MessageList from '../component/MessageList'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { useSocket } from '../socket/SocketContext'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import "../css/message.css"

export default function Message() {
  const onMobile = useSelector((state) => state.showNoti.message)
  const location = useLocation()
  const isChatOpen = location.pathname !== '/message'
  let {chatId}=useParams()       
  useEffect(() => {
    console.log('Mobile view:', onMobile)
  }, [onMobile])


  return (
    <div className="message-container d-flex ">
      <AnimatePresence mode="wait">
        <motion.div 
          className={`message-list-container v-dev1  ${isChatOpen && onMobile ? 'hidden' : ''}`}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <MessageList />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait" className="w-100">
        {(!onMobile || isChatOpen) && (
          <motion.div
            className="message-outlet-container v-dev2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Outlet />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}