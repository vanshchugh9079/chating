import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { setShowMessageModel } from '../redux/slice/showMessageModel';
import { api } from '../contant';
import { useSocket } from '../socket/SocketContext';
import { Form } from 'react-bootstrap';

const UserProfile = ({ name = 'Anonymous', image, _id, user, isGroupChat, setSelectedUser, selectedUser }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { token } = useSelector((state) => state.user.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const socket = useSocket();

    const createChat = async (people) => {
        try {
            const response = await api.post(
                '/chat/create',
                { people },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status !== 209 && socket) {
                socket.emit("create-chat", response.data.data);
            }
            return response.data.data._id;
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Unable to create chat. Please try again later.');
        }
    };

    const handleClick = async () => {
        if (!isGroupChat && _id) {
            let id = await createChat([_id]);
            dispatch(setShowMessageModel(false));
            navigate(`/message/${id}`);
        }
    };

    const isSelected = useMemo(() => selectedUser.some((u) => u._id === _id), [selectedUser, _id]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#3a3a3a',
                padding: '10px',
                borderRadius: '5px',
                cursor: _id ? 'pointer' : 'not-allowed',
                border: isHovered ? '1px solid white' : 'none',
            }}
            className="btn mb-1"
            onClick={!isGroupChat && _id ? handleClick : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            aria-label="User profile"
        >
            <img
                src={image || 'https://via.placeholder.com/40?text=User'}
                alt="Profile"
                style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
            />
            <span style={{ flex: 1, color: 'white', fontSize: '14px' }}>{name}</span>
            {isGroupChat && (
                <Form.Check 
                    checked={isSelected}
                    onChange={() => {
                        setSelectedUser((prevSelected) => {
                            if (isSelected) {
                                return prevSelected.filter((u) => u._id !== _id);
                            } else {
                                return [...prevSelected, user];
                            }
                        });
                    }}
                />
            )}
        </div>
    );
};

UserProfile.propTypes = {
    name: PropTypes.string,
    image: PropTypes.string,
    _id: PropTypes.string.isRequired,
    isGroupChat: PropTypes.bool.isRequired,
    setSelectedUser: PropTypes.func.isRequired,
    selectedUser: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
};

export default UserProfile;
