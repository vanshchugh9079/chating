import React, { useEffect, useState, useMemo } from 'react'
import '../css/messageList.css'
import { useDispatch, useSelector } from 'react-redux'
import { api } from '../contant'
import { useNavigate, useParams } from 'react-router-dom'
import { useSocket } from '../socket/SocketContext'
import { setShowMessageModel } from '../redux/slice/showMessageModel'
import { setShowEditModel } from "../redux/slice/editSlice"
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@mui/material'
import {
  FiMessageSquare,
  FiUsers,
  FiSearch,
  FiEdit2,
  FiPlus,
  FiChevronDown,
  FiClock,
  FiCheck,
  FiCheckCircle,
  FiX
} from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'
import { toast } from 'react-toastify'
import { formatDistanceToNow } from 'date-fns'

const MessageList = () => {
  const { name, token, _id, avatar } = useSelector(state => state.user.user)
  const [allChat, setAllChat] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('messages')
  const [showSearch, setShowSearch] = useState(false)
  const socket = useSocket()
  const navigate = useNavigate()
  const dispatch = useDispatch()
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

  const validateToken = () => {
    if (!token) {
      navigate('/login')
      return false
    }
    return true
  }

  // Memoized chat data processing
  const { aiChat, regularChats, filteredChats } = useMemo(() => {
    const aiChat = allChat.find(chat => chat.name === "chat with ai")
    const regularChats = allChat.filter(chat => chat.name !== "chat with ai")

    const filtered = regularChats.filter(chat => {
      const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTab = activeTab === 'messages' || chat.requests
      return matchesSearch && matchesTab
    })

    return { aiChat, regularChats, filteredChats: filtered }
  }, [allChat, searchQuery, activeTab])

  const getChat = async () => {
    try {
      if (!validateToken()) return

      setLoading(true)
      const { data } = await api.get("/chat", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!Array.isArray(data?.data)) {
        throw new Error("Invalid chat data received from server.")
      }

      const formattedChats = data.data.map(chat => ({
        ...chat,
        isOnline: !chat.groupChat && chat.people?.some(p => p.isOnline && p._id !== _id),
        lastMessageTime: chat.lastMessage ? new Date(chat.lastMessage.createdAt) : null
      }))

      setAllChat(formattedChats)
    } catch (error) {
      console.error("Error fetching chats:", error)

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.")
        dispatch(logoutUser())
        navigate('/login')
      } else {
        toast.error(error.response?.data?.message || "Failed to load chats")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (socket) {
      const handlePresence = (user, online) => {
        setAllChat(prev => prev.map(chat => ({
          ...chat,
          isOnline: chat.people?.some(p =>
            p._id === user._id ? online : p.isOnline && p._id !== _id
          )
        })))
      }

      socket.on("online", (user) => handlePresence(user, true))
      socket.on("offline", (user) => handlePresence(user, false))
      socket.on("chat-created", (data) => {
        setAllChat(prev => [...prev, {
          ...data,
          isOnline: data.people?.some(p => p.isOnline && p._id !== _id)
        }])
      })

      socket.on("auth_error", () => {
        toast.error("Authentication failed. Please login again.")
        dispatch(logoutUser())
        navigate('/login')
      })

      return () => {
        socket.off("online")
        socket.off("offline")
        socket.off("chat-created")
        socket.off("auth_error")
      }
    }
  }, [socket, _id, dispatch, navigate])

  useEffect(() => {
    if (validateToken()) {
      getChat()
    }
  }, [])

  const formatLastSeen = (date) => {
    if (!date) return "Active now"
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const chatVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" }
    },
    hover: {
      scale: 1.01,
      backgroundColor: "rgba(255, 255, 255, 0.05)"
    },
    tap: { scale: 0.98 }
  }

  if (!token) {
    return (
      <div className="ml-container">
        <div className="ml-skeleton-loader">
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              animation="wave"
              height={68}
              style={{
                marginBottom: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)'
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`ml-container ${!chatId && isMobile ? " vw-100 " : ""} `}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="ml-header">

        <div className="ml-user-info">
          <motion.div
            className="ml-avatar-container"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => dispatch(setShowEditModel(true))}
          >
            <img
              src={avatar?.url || '/default-avatar.png'}
              alt="Profile"
              className="ml-user-avatar"
              onError={(e) => {
                e.target.src = '/default-avatar.png'
              }}
            />
            {socket && <div className="ml-connection-status ml-connected" title="Connected"></div>}
          </motion.div>

          <div className="ml-user-details">
            <h3 className="ml-username">{name}</h3>
            <p className="ml-user-status">{socket ? 'Online' : 'Offline'}</p>
          </div>
        </div>

        <div className="ml-header-actions">
          <motion.button
            className="ml-icon-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search"
          >
            <FiSearch size={16} />
          </motion.button>
          <motion.button
            className="ml-icon-button"
            onClick={() => validateToken() && dispatch(setShowMessageModel(true))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="New chat"
          >
            <FiPlus size={16} />
          </motion.button>
          {isMobile && (
            <motion.button
              className="ml-mobile-close"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close"
            >
              <FiX size={30}  />
            </motion.button>
          )}
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      {/* Search Bar - Animated */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="ml-search-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiSearch className="ml-search-icon" size={14} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-search-input"
              autoFocus
            />
            {searchQuery && (
              <motion.button
                className="ml-clear-search"
                onClick={() => setSearchQuery('')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                &times;
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Section */}
      {aiChat && (
        <div className="ml-ai-section">
          <motion.div
            className="ml-ai-card"
            onClick={() => validateToken() && navigate(`/message/${aiChat._id}`)}
            variants={chatVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <div className="ml-ai-icon">
              <RiRobot2Line size={20} />
            </div>
            <div className="ml-ai-info">
              <h6 className="ml-ai-title">{aiChat.name}</h6>
              <p className="ml-ai-subtitle">Ask anything, available 24/7</p>
            </div>
            <div className="ml-ai-badge">
              <span>AI</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="ml-tabs-container">
        <button
          className={`ml-tab ${activeTab === 'messages' ? 'ml-tab-active' : ''}`}
          onClick={() => validateToken() && setActiveTab('messages')}
        >
          <FiMessageSquare className="ml-tab-icon" size={14} />
          <span>Messages</span>
          {regularChats.length > 0 && (
            <span className="ml-tab-counter">{regularChats.length}</span>
          )}
        </button>
        <button
          className={`ml-tab ${activeTab === 'requests' ? 'ml-tab-active' : ''}`}
          onClick={() => validateToken() && setActiveTab('requests')}
        >
          <FiUsers className="ml-tab-icon" size={14} />
          <span>Requests</span>
          {regularChats.filter(chat => chat.requests).length > 0 && (
            <span className="ml-tab-counter">
              {regularChats.filter(chat => chat.requests).length}
            </span>
          )}
        </button>
      </div>

      {/* Chat List */}
      <div className="ml-chat-list">
        {loading ? (
          <div className="ml-skeleton-loader">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                animation="wave"
                height={68}
                style={{
                  marginBottom: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              />
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <AnimatePresence>
            {filteredChats.map((chat) => (
              <motion.div
                key={chat._id}
                className={`ml-chat-item ${chat.isOnline ? 'ml-online' : ''} ${chat.unreadCount > 0 ? 'ml-unread' : ''}`}
                onClick={() => validateToken() && navigate(`/message/${chat._id}`)}
                variants={chatVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                exit={{ opacity: 0, x: -10 }}
                layout
              >
                <div className="ml-chat-avatar-container">
                  <img
                    src={chat.avatar?.url || '/default-chat.png'}
                    alt="Chat Avatar"
                    className="ml-chat-avatar"
                    onError={(e) => {
                      e.target.src = '/default-chat.png'
                    }}
                  />
                  {!chat.groupChat && chat.isOnline && (
                    <div className="ml-online-indicator" title="Online"></div>
                  )}
                </div>

                <div className="ml-chat-content">
                  <div className="ml-chat-header">
                    <h5 className="ml-chat-name">{chat.name}</h5>
                    {chat.lastMessageTime && (
                      <span className="ml-chat-time">
                        {formatDistanceToNow(chat.lastMessageTime, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                {chat.unreadCount > 0 && (
                  <div className="ml-unread-badge">
                    {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            className="ml-empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="ml-empty-icon">
              {activeTab === 'messages' ? <FiMessageSquare size={32} /> : <FiUsers size={32} />}
            </div>
            <h4 className="ml-empty-title">No {activeTab} found</h4>
            <p className="ml-empty-description">
              {activeTab === 'messages'
                ? 'Start a new conversation to see it here'
                : 'You have no pending requests'}
            </p>
            <motion.button
              className="ml-empty-button"
              onClick={() => dispatch(setShowMessageModel(true))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus className="ml-button-icon" size={14} />
              {activeTab === 'messages' ? 'Start new chat' : 'Find people'}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* New Chat Button - Floating */}
      <motion.button
        className="ml-new-chat-button"
        onClick={() => validateToken() && dispatch(setShowMessageModel(true))}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FiPlus className="ml-button-icon" size={18} />
      </motion.button>
    </motion.div>
  )
}

export default MessageList