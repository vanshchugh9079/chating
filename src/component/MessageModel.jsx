import React, { useEffect, useState, useCallback } from 'react';
import '../css/messageModel.css';
import { useDispatch, useSelector } from 'react-redux';
import { setShowMessageModel } from '../redux/slice/showMessageModel';
import { Button, Form } from 'react-bootstrap';
import UserProfile from './UserProfile';
import getUsers from '../fetch/getUsers';
import { api } from '../contant';
import { useSocket } from '../socket/SocketContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MessageModal = () => {
    const dispatch = useDispatch();
    const showMessageModel = useSelector((state) => state.showMessageModel.showModel);
    const { _id, token } = useSelector((state) => state.user.user);

    const [searchUser, setSearchUser] = useState("");
    const [allUser, setAllUser] = useState([]);
    const [isGroupChat, setIsGroupChat] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUser, setSelectedUser] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    let navigate = useNavigate()
    let socket = useSocket()

    useEffect(() => {
        setAllUser([]);
    }, []);

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            let people = selectedUser.map(user => user._id);
            const response = await api.post(
                '/chat/create',
                { people, name: groupName, groupChat: isGroupChat },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            let chatId = response.data.data._id;
            if (response.status !== 209 && socket) {
                socket.emit("create-chat", response.data.data);
            }
            if (chatId) {
                setAllUser([]);
                setSearchUser("");
                setIsGroupChat(false);
                setSelectedUser([]);
                setGroupName("");
                dispatch(setShowMessageModel(false));
                socket.emit("join-chat", chatId);
                navigate(`/message/${chatId}`);
            }
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Unable to create chat. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            fetchUsers(searchUser.trim());
        }, 300);

        return () => clearTimeout(debounceFetch);
    }, [searchUser]);

    const fetchUsers = useCallback(async (query) => {
        if (!query) {
            setAllUser([]);
            return;
        }
        try {
            const users = await getUsers(token, query);
            setAllUser(users.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, [token]);

    const springTransition = {
        type: "spring",
        damping: 20,
        stiffness: 300
    };

    return (
        <AnimatePresence>
            {showMessageModel && (
                <motion.div 
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div 
                        className="modal-content"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={springTransition}
                    >
                        <div className='modal-header'>
                            <motion.h5 
                                className='modal-title'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                New message
                            </motion.h5>
                            <motion.button
                                className='close-btn'
                                onClick={() => {
                                    setAllUser([]);
                                    setSearchUser("");
                                    setIsGroupChat(false);
                                    setSelectedUser([]);
                                    setGroupName("");
                                    dispatch(setShowMessageModel(false));
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                ✕
                            </motion.button>
                        </div>

                        <motion.div 
                            className='group-toggle'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                        >
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label="Group Chat"
                                checked={isGroupChat}
                                onChange={() => setIsGroupChat(!isGroupChat)}
                            />
                        </motion.div>

                        {isGroupChat && (
                            <motion.div 
                                className='group-name-input'
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={springTransition}
                            >
                                <input
                                    type="text"
                                    placeholder="Write group name..."
                                    value={groupName}
                                    onChange={(event) => setGroupName(event.target.value.trimStart())}
                                />
                            </motion.div>
                        )}

                        <div className="modal-body">
                            <motion.div 
                                className="search-section"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <label>{isGroupChat ? "Add" : "To"}:</label>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchUser}
                                    onChange={(event) => setSearchUser(event.target.value.trimStart())}
                                />
                            </motion.div>

                            <div className={`user-list ${isGroupChat ? "group-mode" : ""}`}>
                                {isGroupChat && (
                                    <motion.div 
                                        className="selected-users"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        {selectedUser.map((u) => (
                                            <UserProfile
                                                key={u._id}
                                                name={u.name}
                                                _id={u._id}
                                                image={u.avatar?.url}
                                                isGroupChat={isGroupChat}
                                                setSelectedUser={setSelectedUser}
                                                selectedUser={selectedUser}
                                                user={u}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                                
                                <motion.div 
                                    className="search-results"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {allUser
                                        .filter((user) => user._id !== _id && !selectedUser.some((u) => u._id === user._id))
                                        .map((user, index) => (
                                            <motion.div
                                                key={user._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 * index }}
                                            >
                                                <UserProfile
                                                    name={user.name}
                                                    _id={user._id}
                                                    image={user.avatar?.url}
                                                    isGroupChat={isGroupChat}
                                                    setSelectedUser={setSelectedUser}
                                                    selectedUser={selectedUser}
                                                    user={user}
                                                />
                                            </motion.div>
                                        ))
                                    }
                                </motion.div>
                            </div>
                            
                            {isGroupChat && groupName.length > 0 && selectedUser.length > 0 && (
                                <motion.div 
                                    className='create-btn-container'
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <motion.button 
                                        className='create-btn'
                                        onClick={handleCreate}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        ) : (
                                            "Create Group"
                                        )}
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MessageModal;