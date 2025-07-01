import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { useSelector } from 'react-redux';
import { useSocket } from '../socket/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFile, faMicrophone, faTimes,
  faPaperPlane, faPhone, faVideo,
  faSmile, faEllipsisV, faSearch,
  faFilePdf, faFileImage, faFileVideo, faFileAudio,
  faCheck, faCheckDouble, faFileWord, faFileExcel,
  faFileArchive, faFileCode, faFileDownload, faXmark
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import { api } from '../contant';
import '../css/messageShower.css';

const MessageShower = () => {
  const { chatId } = useParams();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { token, _id } = useSelector(state => state.user.user);
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const wavesurferRef = useRef(null);
  const waveformRef = useRef(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [online, setOnline] = useState(false);
  const [groupChat, setGroupChat] = useState(false);
  const [people, setPeople] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4a8cff',
        progressColor: '#1e5cb3',
        cursorColor: '#ffffff',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 30,
        barGap: 2,
        responsive: true
      });
      
      wavesurferRef.current.on('finish', () => {
        wavesurferRef.current.stop();
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, []);

  const fetchChat = async () => {
    try {
      const response = await api.get(`/chat/get/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = response.data;
      setChat(data.data);
      setMessages(data.data.message);
      setPeople(data.data.people);
      setGroupChat(data.data.groupChat);
      
      const peopler = data.data.people;
      if (peopler.length <= 2 && !data.data.groupChat) {
        peopler.forEach((e) => {
          if (e.isOnline && e._id !== _id) {
            setOnline(true);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  useEffect(() => {
    fetchChat();
  }, [chatId, token]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (data) => {
        if (data.message.ai) setLoading(false);
        setMessages(prev => [...prev, data.message]);
      };

      const handleTyping = (data) => {
        if (data.chatId === chatId && data.userId !== _id) {
          setIsTyping(true);
          const timer = setTimeout(() => setIsTyping(false), 2000);
          return () => clearTimeout(timer);
        }
      };

      const handleOnline = (user) => {
        people.forEach((p) => {
          if (p._id === user._id) {
            setOnline(true);
          }
        });
      };

      const handleOffline = (user) => {
        people.forEach((p) => {
          if (p._id === user._id) {
            setOnline(false);
          }
        });
      };

      socket.on("online", handleOnline);
      socket.on("offline", handleOffline);
      socket.on("message-recieved", handleMessage);
      socket.on("message-recieved-success", handleMessage);
      socket.on("typing", handleTyping);

      return () => {
        socket.off("online", handleOnline);
        socket.off("offline", handleOffline);
        socket.off("message-recieved", handleMessage);
        socket.off("message-recieved-success", handleMessage);
        socket.off("typing", handleTyping);
      };
    }
  }, [socket, people, chatId, _id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current.focus();
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getFileTypeFromUrl = (url) => {
    if (!url) return null;
    
    const extension = url.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
    const pdfExtensions = ['pdf'];
    const docExtensions = ['doc', 'docx'];
    const excelExtensions = ['xls', 'xlsx'];
    const archiveExtensions = ['zip', 'rar', '7z'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (pdfExtensions.includes(extension)) return 'pdf';
    if (docExtensions.includes(extension)) return 'doc';
    if (excelExtensions.includes(extension)) return 'excel';
    if (archiveExtensions.includes(extension)) return 'archive';
    
    return 'file';
  };

  const getFileIcon = (url) => {
    const type = getFileTypeFromUrl(url);
    
    switch(type) {
      case 'image': return faFileImage;
      case 'video': return faFileVideo;
      case 'audio': return faFileAudio;
      case 'pdf': return faFilePdf;
      case 'doc': return faFileWord;
      case 'excel': return faFileExcel;
      case 'archive': return faFileArchive;
      default: return faFile;
    }
  };

  const getFileTypeName = (url) => {
    const type = getFileTypeFromUrl(url);
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const sendMessage = async () => {
    if (!file && !message) return;
    setLoading(true);
    
    let content = message.trim();
    setShowEmojiPicker(false);
    setMessage("");

    let attachment = null;

    if (file) {
      let formData = new FormData();
      formData.append("file", file);
      try {
        const res = await api.post("/upload/file", formData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
          }
        });
        attachment = res.data.data;
        setFile(null);
        setFilePreview(null);
        setAudioURL(null);
        setAudioChunks([]);
      } catch (error) {
        console.error("File upload failed:", error);
        setLoading(false);
        return;
      }
    }

    socket.emit("message", { chatId, content, attachment });
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      const chunks = [];
      setAudioChunks(chunks);
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
        setAudioChunks([...chunks]);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        if (wavesurferRef.current) {
          wavesurferRef.current.load(audioUrl);
        }
        setFile(new File([audioBlob], "recording.wav", { type: "audio/wav" }));
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setRecording(true);
      
      // Stop recording after 30 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setRecording(false);
        }
      }, 30000);
      
    } catch (error) {
      console.error("Recording failed:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      socket.emit("typing", { chatId, userId: _id });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview for images and videos
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview({
            url: event.target.result,
            type: selectedFile.type
          });
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
      
      setShowOptions(false);
    }
  };

  const openFilePicker = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type;
      fileInputRef.current.click();
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    setAudioURL(null);
    setAudioChunks([]);
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
  };

  return (
    <motion.div 
      className={`message-shower ${isMobile ? 'mobile-view' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <header className="chat-header">
        <div className="header-left">
          {isMobile && (
            <motion.button 
              className="back-btn"
              onClick={() => navigate('/message')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </motion.button>
          )}
          <motion.div 
            className="chat-info"
            onClick={() => {
              if (chat?.groupChat) {
                navigate(`/message/chat/${chatId}`);
              } else {
                navigate(`/profile/${chat?.name}`);
              }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.img 
              src={chat?.avatar?.url || '/default-chat.png'} 
              alt="Chat" 
              className="chat-avatar"
              onError={(e) => {
                e.target.src = '/default-chat.png';
              }}
              whileHover={{ rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <div className="chat-details">
              <h3>{chat?.name}</h3>
              <div className="status">
                {isTyping ? (
                  <div className="typing-indicator">
                    <span>Typing</span>
                    <div className="dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                ) : (
                  <p>{online ? (
                    <span className="online-dot">Online</span>
                  ) : 'Offline'}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
        {!isMobile && (
          <div className="header-right">
            <motion.button 
              className="call-btn"
              onClick={() => {
                socket.emit("call", {
                  reciverId: people.filter((element) => element._id !== _id),
                  id: _id
                });
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faPhone} />
            </motion.button>
            <motion.button 
              className="video-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faVideo} />
            </motion.button>
            <motion.button 
              className="search-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faSearch} />
            </motion.button>
            <motion.button 
              className="menu-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </motion.button>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <motion.div 
            className="empty-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="empty-avatar"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut"
              }}
            >
              <img 
                src={chat?.avatar?.url || '/default-chat.png'} 
                alt="Chat"
                onError={(e) => {
                  e.target.src = '/default-chat.png';
                }}
              />
            </motion.div>
            <h3>Start a conversation with {chat?.name}</h3>
            <p>No messages yet. Say hello to begin chatting!</p>
            <div className="empty-actions">
              <motion.button 
                className="wave-btn"
                onClick={() => setMessage('👋')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                👋 Send a wave
              </motion.button>
            </div>
          </motion.div>
        ) : (
          messages.map((msg, i) => {
            const showDate = i === 0 || 
              formatMessageDate(messages[i-1].createdAt) !== formatMessageDate(msg.createdAt);
            
            return (
              <React.Fragment key={msg._id}>
                {showDate && (
                  <motion.div 
                    className="date-divider"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span>{formatMessageDate(msg.createdAt)}</span>
                  </motion.div>
                )}
                
                <motion.div
                  className={`message ${msg.createdBy._id === _id ? 'sent' : 'received'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {chat?.groupChat && msg.createdBy._id !== _id && (
                    <p className="sender-name">{msg.createdBy.name}</p>
                  )}
                  
                  {msg.attachment?.url && (
                    <div className="attachment">
                      {getFileTypeFromUrl(msg.attachment.url) === 'image' && (
                        <motion.img 
                          src={msg.attachment.url} 
                          alt="Attachment" 
                          className="image-attachment" 
                          onError={(e) => {
                            e.target.src = '/file-error.png';
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.03 }}
                        />
                      )}
                      {getFileTypeFromUrl(msg.attachment.url) === 'video' && (
                        <motion.video 
                          controls 
                          src={msg.attachment.url} 
                          className="video-attachment"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.03 }}
                        ></motion.video>
                      )}
                      {getFileTypeFromUrl(msg.attachment.url) === 'audio' && (
                        <motion.div 
                          className="audio-player"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <audio 
                            controls 
                            src={msg.attachment.url}
                            className="audio-element"
                          />
                        </motion.div>
                      )}
                      {(getFileTypeFromUrl(msg.attachment.url) === 'pdf' || 
                       getFileTypeFromUrl(msg.attachment.url) === 'doc' || 
                       getFileTypeFromUrl(msg.attachment.url) === 'excel' || 
                       getFileTypeFromUrl(msg.attachment.url) === 'archive' || 
                       getFileTypeFromUrl(msg.attachment.url) === 'file') && (
                        <motion.div 
                          className="file-attachment"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <div className="file-icon">
                            <FontAwesomeIcon icon={getFileIcon(msg.attachment.url)} />
                          </div>
                          <div className="file-info">
                            <p className="file-name">
                              {msg.attachment.originalname || msg.attachment.url.split('/').pop()}
                            </p>
                            <p className="file-type-size">
                              {getFileTypeName(msg.attachment.url)} • 
                              {msg.attachment.size ? ` ${(msg.attachment.size / 1024).toFixed(1)} KB` : ''}
                            </p>
                          </div>
                          <motion.a 
                            href={msg.attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="download-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FontAwesomeIcon icon={faFileDownload} />
                          </motion.a>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {msg.content && (
                    <motion.p 
                      className={`message-content ${msg.ai ? 'ai-message' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {msg.ai ? (
                        <pre className='is-code fs-6 fw-bold'>
                          {msg.content}
                        </pre>
                      ) : msg.content}
                    </motion.p>
                  )}
                  
                  <div className="message-footer">
                    <span className="time">{formatTime(msg.createdAt)}</span>
                    {msg.createdBy._id === _id && (
                      <span className="status-icon">
                        {msg.read ? (
                          <FontAwesomeIcon icon={faCheckDouble} style={{ color: '#4a8cff' }} />
                        ) : (
                          <FontAwesomeIcon icon={faCheck} />
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })
        )}
        {loading && (
          <motion.div 
            className="typing-indicator outgoing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span>Sending</span>
            <div className="dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              className="emoji-picker-container"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.2 }}
            >
              <EmojiPicker 
                onEmojiClick={handleEmojiClick} 
                width="100%"
                height={350}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                searchDisabled
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {(file || filePreview || audioURL) && (
          <motion.div 
            className="file-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="file-preview-content">
              {filePreview?.type.startsWith('image/') && (
                <motion.img 
                  src={filePreview.url} 
                  alt="Preview" 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {filePreview?.type.startsWith('video/') && (
                <motion.video 
                  src={filePreview.url} 
                  controls
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                ></motion.video>
              )}
              {audioURL && (
                <motion.div 
                  className="audio-preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="waveform-preview" ref={waveformRef}></div>
                  <audio src={audioURL} controls className="hidden-audio" />
                </motion.div>
              )}
              {file && !filePreview && !audioURL && (
                <motion.div 
                  className="file-preview-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <FontAwesomeIcon 
                    icon={getFileIcon(file.name)} 
                    className="file-preview-icon" 
                  />
                  <p className="file-preview-name">{file.name}</p>
                  <p className="file-preview-size">{(file.size / 1024).toFixed(1)} KB</p>
                </motion.div>
              )}
            </div>
            <motion.button 
              className="remove-file"
              onClick={clearFile}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </motion.button>
          </motion.div>
        )}
        
        <div className="input-container">
          <motion.button 
            className={`emoji-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowOptions(false);
            }}
            aria-label="Emoji picker"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FontAwesomeIcon icon={faSmile} />
          </motion.button>
          
          <div className="message-input-wrapper">
            <motion.textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setShowEmojiPicker(false);
                setShowOptions(false);
              }}
              rows="1"
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            />
          </div>
          
          <div className="action-buttons">
            {message || file ? (
              <motion.button 
                className="send-btn"
                onClick={sendMessage}
                disabled={loading}
                aria-label="Send message"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </motion.button>
            ) : (
              <>
                <div className="attachment-options">
                  <motion.button 
                    className="options-btn"
                    onClick={() => setShowOptions(!showOptions)}
                    aria-label="Attachment options"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FontAwesomeIcon icon={faFile} />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showOptions && (
                      <motion.div 
                        className="options-menu"
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.15 }}
                      >
                        <motion.button 
                          className="option"
                          onClick={() => openFilePicker('image/*')}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FontAwesomeIcon icon={faFileImage} />
                          <span>Photo</span>
                        </motion.button>
                        <motion.button 
                          className="option"
                          onClick={() => openFilePicker('video/*')}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FontAwesomeIcon icon={faFileVideo} />
                          <span>Video</span>
                        </motion.button>
                        <motion.button 
                          className="option"
                          onClick={() => openFilePicker('audio/*')}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FontAwesomeIcon icon={faFileAudio} />
                          <span>Audio</span>
                        </motion.button>
                        <motion.button 
                          className="option"
                          onClick={() => openFilePicker('.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar')}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FontAwesomeIcon icon={faFile} />
                          <span>Document</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <motion.button 
                  className={`record-btn ${recording ? 'recording' : ''}`}
                  onClick={recording ? stopRecording : startRecording}
                  aria-label={recording ? 'Stop recording' : 'Start recording'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FontAwesomeIcon icon={faMicrophone} />
                  {recording && <span className="recording-indicator"></span>}
                </motion.button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageShower;