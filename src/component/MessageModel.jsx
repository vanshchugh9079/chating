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

const MessageModal = () => {
    const dispatch = useDispatch();
    const showMessageModel = useSelector((state) => state.showMessageModel.showModel);
    const { _id, token } = useSelector((state) => state.user.user); // Get current user ID and token

    const [searchUser, setSearchUser] = useState("");
    const [allUser, setAllUser] = useState([]);
    const [isGroupChat, setIsGroupChat] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUser, setSelectedUser] = useState([]);
    let navigate = useNavigate()
    let socket = useSocket()

    useEffect(() => {
        setAllUser([]);
    }, []);
    const handleCreate = async () => {
        try {
            let people = selectedUser.map(user => user._id);
            const response = await api.post(
                '/chat/create',
                { people, name: groupName ,groupChat:isGroupChat },
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

    return (
        <div>
            {showMessageModel && (
                <div className="modal-overlay ">
                    <div className="modal-content d-flex flex-column h-100 position-relative">
                        <div className='d-flex w-100'>
                            <h5 className='ms-auto'>New message</h5>
                            <button
                                className='btn text-white fw-bold ms-auto'
                                onClick={() => {
                                    setAllUser([]);
                                    setSearchUser("");
                                    setIsGroupChat(false);
                                    setSelectedUser([]);
                                    setGroupName("");
                                    dispatch(setShowMessageModel(false));
                                }}
                            >
                                X
                            </button>
                        </div>

                        <div className='w-100 d-flex'>
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label="Group Chat"
                                checked={isGroupChat}
                                onChange={() => setIsGroupChat(!isGroupChat)}
                            />
                        </div>

                        {isGroupChat && (
                            <div className='to-section w-100'>
                                <input
                                    type="text"
                                    placeholder="Write group name..."
                                    className='me-auto'
                                    value={groupName}
                                    onChange={(event) => setGroupName(event.target.value.trimStart())}
                                />
                            </div>
                        )}

                        <div className="modal-body w-100">
                            <div className="to-section mb-3">
                                <label>{isGroupChat ? "Add" : "To"}:</label>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchUser}
                                    onChange={(event) => setSearchUser(event.target.value.trimStart())}
                                />
                            </div>
                            <div className={`${isGroupChat ? "content-body-group" : "content-body"}`}>
                                {isGroupChat &&
                                    selectedUser.map((u) => (
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
                                    ))
                                }
                                {allUser
                                    .filter((user) => user._id !== _id && !selectedUser.some((u) => u._id === user._id)) // ✅ Exclude current user & selected users
                                    .map((user) => (
                                        <UserProfile
                                            key={user._id}
                                            name={user.name}
                                            _id={user._id}
                                            image={user.avatar?.url}
                                            isGroupChat={isGroupChat}
                                            setSelectedUser={setSelectedUser}
                                            selectedUser={selectedUser}
                                            user={user}
                                        />
                                    ))
                                }
                            </div>
                            {
                                isGroupChat && groupName.length > 0 && selectedUser.length > 0 &&
                                <div className='position-absolute end-0 botoom-0 mt-1'>
                                    <button className='btn  btn-primary ' onClick={() => {
                                        handleCreate();
                                    }}>Create</button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageModal;
