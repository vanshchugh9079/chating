import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import "../css/messageShower.css";
import { api } from '../contant';
import { useSelector } from 'react-redux';
import { useSocket } from '../socket/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMultiply, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const MessageShower = () => {
    const { chatId } = useParams();
    const [name, setName] = useState("");
    const [allMessages, setAllMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [avatar, setAvatar] = useState({});
    const [online, setOnline] = useState(false);
    const { token, _id } = useSelector(state => state.user.user);
    const [people, setPeople] = useState([]);
    const [groupChat, setGroupChat] = useState(false);
    const socket = useSocket();
    const messageBoxRef = useRef(null);
    const onMobile = useSelector((state) => state.showNoti?.message);
    const [loader,setLoader]=useState(false)
    let navigate = useNavigate();

    // Fetch chat messages when the component mounts
    useEffect(() => {
        setLoader(false)
        const getChat = async () => {
            try {
                const response = await api.get(`/chat/get/${chatId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(response);

                setAvatar(response.data.data.avatar);
                setName(response.data.data.name);
                setAllMessages(response.data.data.message);
                setPeople(response.data.data.people);
                setGroupChat(response.data.data.groupChat);
                const peopler = response.data.data.people;
                if (people.length <= 2 && !response.data.data.groupChat) {
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
        getChat();
    }, [chatId, token]);

    // Listen for incoming messages
    useEffect(() => {
        if (socket) {
            const messageReceivedHandler = (data) => {
                // console.log(data.createdBy==_id);

                console.log(data.message.ai);
                if(data.message.ai){
                    setLoader(false)
                }
                setAllMessages(prevMessages => [...prevMessages, data.message]);
            };

            let handleOnline = (user) => {
                people.forEach((p) => {
                    if (p._id === user._id) {
                        setOnline(true);
                    }
                });
            };

            let handleOffline = (user) => {
                people.forEach((p) => {
                    if (p._id === user._id) {
                        setOnline(false);
                    }
                });
            };

            socket.on("online", handleOnline);
            socket.on("offline", handleOffline);
            socket.on("message-recieved", messageReceivedHandler);
            socket.on("message-recieved-success", messageReceivedHandler);

            return () => {
                socket.off("online", handleOnline);
                socket.off("offline", handleOffline);
                socket.off("message-recieved", messageReceivedHandler);
                socket.off("message-recieved-success", messageReceivedHandler);
            };
        }
    }, [socket, people]);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
    }, [allMessages]);

    // Handle emoji selection
    const handleEmojiClick = (emojiData) => {
        setMessage(prev => prev + emojiData.emoji);
    };

    // Format date
    const getDate = (date) => {
        let d = new Date(date);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    };

    // Send message function
    const sendMessage = () => {
        if (!message.trim()) return;
        if (name === "chat with ai") {
            console.log(name);
            setLoader(true)
            socket.emit("ai-chat", {
                message: message.trim(), id: _id, chatId
            })
            setMessage("");
            setShowEmojiPicker(false);
        }
        else {
            socket.emit("message", { chatId, content: message.trim() });
            setMessage("");
            setShowEmojiPicker(false);
        }
    };

    // Function to detect code messages

    return (
        <div className="profile-page m-0 p-0  ">
            {/* Header */}
            <header className="d-flex p-3 gap-2 position-relative fixed-top m-0">
                <img src={avatar.url} alt="profile" className="profile" />
                <h4 className="fw-bolder pointer" onClick={() => {
                    if (name == "chat with ai") return;
                    if (groupChat) {
                        console.log(groupChat);
                        navigate("/message/chat/" + chatId);
                    } else {
                        navigate("/profile/" + name);
                    }
                }}>{name}</h4>
                <div className='position-absolute end-0 d-flex align-items-center me-3 mt-1'>
                    {/* <p className=''>{online && "online"}</p>
                     */}
                    {
                        onMobile &&

                        <FontAwesomeIcon icon={faMultiply} className='fs-1 cross fw-bold pointer' onClick={() => {
                            navigate("/message")
                        }} />
                    }
                </div>
            </header>

            {/* Messages Section */}
            <div className="message-box w-100 overflow-y-auto" ref={messageBoxRef}>
                {allMessages.length === 0 ? (
                    <div className="w-100 h-100 d-flex justify-content-center align-items-center flex-column">
                        <img className="profile-center me-2" src={avatar.url} alt="profile" />
                        <h3>{name}</h3>
                        <button className="btn btn-secondary fw-bold text-white opacity-1" onClick={() => {
                            if (name == "chat with ai") return;
                            if (groupChat) {
                                navigate("/message/chat/" + chatId);
                            } else {
                                navigate("/profile/" + name);
                            }
                        }}>
                            {groupChat ? "View Chat" : "View Profile"}
                        </button>
                    </div>
                ) : (
                    allMessages.map((element, id) => {
                        const messageDate = getDate(element.createdAt);
                        const showDate = id === 0 || getDate(allMessages[id - 1].createdAt) !== messageDate;

                        return (
                            <React.Fragment key={id}>
                                {showDate && <div className="d-flex justify-content-center"><p className='text-secondary'>{messageDate}</p></div>}
                                <div className={`w-100 d-flex mb-3 ${element.createdBy._id == _id && !element.ai ? "justify-content-end " : " justify-content-start p-2 "}`}>
                                    {
                                        element.createdBy._id != _id && groupChat &&
                                        <div className='img-container'>
                                            <img src={element.createdBy.avatar.url} alt="profile" className="message-profile h-100 w-100 rounded-circle" />
                                        </div>
                                    }
                                    <div className={`message-wrapper  ${element.createdBy._id == _id && !element.ai ? "sender" : groupChat ? "receiver" : " bg-secondary  "}`}>
                                        {groupChat && element.createdBy._id != _id && (
                                            <p className='text-primary sender-name'>{element.createdBy.name}</p>
                                        )}
                                        <p className="v-message">
                                            {
                                                element.ai &&
                                                <pre className='is-code fs-6'>
                                                    {element.content}
                                                </pre>
                                            }
                                            {
                                                !element.ai &&
                                                <p className='fs-6'>
                                                    { element.content }
                                                </p>
                                            }
                                        </p>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                {
                    loader &&
                    <div className='loader'>
                        <div className="spinner-border text-secondary" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                }
            </div>

            {/* Footer (Message Input) */}
            <footer className="d-flex justify-content-center align-items-center fixed-bottom mb-1">
                <div className="input-container position-relative">
                    <span className="emoji-icon " onClick={() => setShowEmojiPicker(prev => !prev)}>
                        {!showEmojiPicker ? "😊" : "❌"}
                    </span>
                    {showEmojiPicker && <div className="emoji-picker"><EmojiPicker onEmojiClick={handleEmojiClick} /></div>}
                    <input
                        type="text"
                        className="message-input"
                        placeholder="Message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button className="btn btn-primary" onClick={sendMessage} aria-label="Send message">
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MessageShower;
