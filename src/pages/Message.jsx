import React, { useEffect, useState } from 'react'
import MessageList from '../component/MessageList'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import "../css/message.css"

export default function Message() {
  const onMobile = useSelector((state) => state.showNoti.message)
  const location = useLocation()
  const { chatId } = useParams()

  const [isMobile, setIsMobile] = useState(window.innerWidth < 972)

  // ✅ Auto update isMobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 972)
    }

    window.addEventListener('resize', handleResize)

    // Initial check and cleanup
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isChatOpen = location.pathname !== '/message'

  return (
    <div className={`message-container d-flex`}>
      {isMobile ? (
        <>
          {chatId ? (
            <div className='d-none'></div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                className={`message-list-container v-dev1 ${isChatOpen && onMobile ? 'd-none' : ''}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <MessageList />
              </motion.div>
            </AnimatePresence>
          )}
        </>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            className={`message-list-container v-dev1 ${isChatOpen && onMobile ? 'd-none' : ''}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <MessageList />
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence mode="wait">
        {(!onMobile || isChatOpen) && (
          <motion.div
            className={`message-outlet-container v-dev2 ${onMobile && "w-100"}`}
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
