import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import "../css/messageShower.css";
import { api } from '../contant';
import { useSelector } from 'react-redux';
import { useSocket } from '../socket/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faMicrophone, faMultiply, faPaperPlane, faPause, faPhone, faSquare, faStickyNote, faVideo } from '@fortawesome/free-solid-svg-icons';
import { AudioRecorder } from 'react-audio-voice-recorder';


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
    const [loader, setLoader] = useState(false)
    const [file, setFile] = useState(null)
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);
    const [audioStream, setAudioStream] = useState(null);
    const [liveAudio, setLiveAudio] = useState(null);
    let navigate = useNavigate();

    const startRecording = async () => {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight + 1000;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunks.current = [];
            setLiveAudio(stream); // Set live audio stream URL

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {

            };

            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (error) {
            console.error("Microphone access denied:", error);
        }
    };
    let onRecordingComplete = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/mp4" });
        const audioFile = new File([audioBlob], "recorded_audio.wav", { type: "audio/wav" });
        const recordedURL = URL.createObjectURL(audioBlob);
        setAudioURL(recordedURL);
        setFile(audioFile);
        stopRecording()
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setRecording(false);

        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            setAudioStream(null);
        }
        setLiveAudio(null); // Remove live stream
    };

    // Fetch chat messages when the component mounts
    let getExtName = (url) => {
        if (!url) return false;
        let extName = url.split('.').pop();
        return extName.toLowerCase();
    }
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
                if (data.message.ai) {
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
    const sendMessage = async () => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
        if (!file && !message) return;
        setLoader(true);
        if (!message.trim() && !file) return;

        let content = message.trim();
        setShowEmojiPicker(false);
        setMessage("");
        let attachment = null;
        if (file) {
            let formData = new FormData();
            formData.append("file", file);
            try {
                const res = await api.post("/upload/file", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log(res.data);

                attachment = res.data.data;
                setFile(null);
            } catch (error) {
                console.error("File upload failed:", error);
                setLoader(false);
                return;
            }
        }
        console.log(attachment);
        socket.emit("message", { chatId, content, attachment });
        setLoader(false);
    };


    // Function to detect code messages

    return (
        <div className="v-profile-page m-0 p-0  ">
            {/* Header */}
            <header className="d-flex p-3 gap-2 position-relative fixed-top m-0">
                <img src={avatar.url} alt="profile" className="profile" />
                <h4 className="fw-bold pointer" onClick={() => {
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

                    <div className='v-call me-1 pointer'>
                        <FontAwesomeIcon icon={faPhone} className='fs-4 ' onClick={()=>{
                            socket.emit("call",{
                                reciverId:people.filter((element)=>{
                                    return element._id!=_id
                                })
                                ,
                                id:_id
                            })
                        }} />
                    </div>
                    <div className='v-call pointer'>
                        <FontAwesomeIcon icon={faVideo} className='fs-4' />
                    </div>
                    {
                        onMobile &&

                        <FontAwesomeIcon icon={faMultiply} className='fs-1 cross fw-bold ms-1 pointer' onClick={() => {
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
                                <div className={`w-100 d-flex mb-3 ${element.createdBy._id == _id && !element.ai ? "justify-content-end  " : " justify-content-start p-2 "}`}>
                                    {
                                        element.createdBy._id != _id && groupChat &&
                                        <div className='img-container bg-secondary'>
                                            <img src={element.createdBy.avatar.url} alt="profile" className="message-profile h-100 w-100 rounded-circle" />
                                        </div>
                                    }

                                    <div className={`message-wrapper  ${element.createdBy._id == _id && !element.ai ? "sender bg-secondary" : groupChat ? "receiver" : " bg-secondary  "}`}>
                                        {groupChat && element.createdBy._id != _id && (
                                            <p className='text-primary sender-name'>{element.createdBy.name}</p>
                                        )}
                                        <p className="v-message">
                                            {
                                                element.ai &&
                                                <>
                                                    <pre className='is-code fs-6 fw-bold'>
                                                        {element.content}
                                                    </pre>
                                                </>
                                            }
                                            {
                                                !element.ai &&
                                                <>
                                                    {
                                                        element.attachment &&
                                                        <>
                                                            {
                                                                (getExtName(element.attachment.url) == "png" || getExtName(element.attachment.url) == "jpg" || getExtName(element.attachment.url) == "jpeg" || getExtName(element.attachment.url) == "gif") &&
                                                                <img src={element.attachment.url} alt="attachment" className="message-attachment " />
                                                            }
                                                            {
                                                                (getExtName(element.attachment.url) == "mp4" || getExtName(element.attachment.url) == "mpg" || getExtName(element.attachment.url) == "avi" || getExtName(element.attachment.url) == "flv" || getExtName(element.attachment.url) == "webm") &&
                                                                <video src={element.attachment.url} alt="attachment" className="message-attachment " controls />
                                                            }
                                                            {
                                                                (getExtName(element.attachment.url) == "mp3" || getExtName(element.attachment.url) == "wav" || getExtName(element.attachment.url) == "wv" || getExtName(element.attachment.url) == "m4a" || getExtName(element.attachment.url) == "cda") &&
                                                                <audio src={element.attachment.url} alt="attachment" className="bg-none " controls />
                                                            }
                                                        </>
                                                    }
                                                    <p className='fs-6 fw-bold'>
                                                        {element.content}
                                                    </p>
                                                </>
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
            <footer className="d-flex justify-content-center  align-items-center  m-0 p-0 ">
                <div className="input-container position-absolute ">
                    <span className="emoji-icon " onClick={() => setShowEmojiPicker(prev => !prev)}>
                        {!showEmojiPicker ? "😊" : "❌"}
                    </span>
                    {
                        file && file.type.startsWith("image/") &&
                        <div className='position-relative'>
                            <img src={URL.createObjectURL(file)} alt="file" className="emoji-icon " height={50} width={"50"} />
                            <FontAwesomeIcon icon={faMultiply} onClick={() => {
                                setFile(null);
                            }} className='position-absolute pointer end-0 text-danger me-2' />
                        </div>
                    }
                    {
                        file && file.type.startsWith("video/") &&
                        <div className='position-relative'>
                            <video src={URL.createObjectURL(file)} alt="file" className="emoji-icon " height={50} width={"50"} />
                            <FontAwesomeIcon icon={faMultiply} onClick={() => {
                                setFile(null);
                            }} className='position-absolute pointer end-0 text-danger me-2' />
                        </div>
                    }
                    {
                        file && file.type.startsWith("audio/") &&
                        <div className='position-relative'>
                            <div className='w-100 h-100 position-relative p-2 bg-secondary '>
                                <FontAwesomeIcon icon={faMicrophone} className='fs-3' />
                            </div>
                            <FontAwesomeIcon icon={faMultiply} onClick={() => {
                                setFile(null);
                            }} className='position-absolute pointer end-0 text-danger top-0  ' />
                        </div>
                    }
                    {showEmojiPicker && <div className="emoji-picker"><EmojiPicker onEmojiClick={handleEmojiClick} /></div>}
                    <input
                        type="text"
                        className="message-input"
                        placeholder="Message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <input type='file' className='d-none input-file' disabled={loader} accept='*' onChange={(e) => {
                        const selectedFile = e.target.files[0];
                        setFile(selectedFile)
                    }} />
                    <button className="btn btn-primary me-3" onClick={sendMessage} aria-label="Send message">
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                    <button className="btn btn-primary me-3" onClick={
                        () => {
                            const fileInput = document.querySelector('.input-file');
                            fileInput.click()
                        }
                    } aria-label="Send message">
                        <FontAwesomeIcon icon={faFile} />
                    </button>
                    <button className="btn m-0 p-0 " aria-label="Send message" onClick={() => {
                        if (recording) {
                            stopRecording()
                        }
                        else {
                            startRecording()
                        }
                        setRecording(!recording)
                    }}>
                        <AudioRecorder
                            onRecordingComplete={onRecordingComplete}

                            audioTrackConstraints={{
                                noiseSuppression: true,
                                echoCancellation: true,
                            }}
                            showVisualizer
                            downloadFileExtension="webm"
                        />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MessageShower;
