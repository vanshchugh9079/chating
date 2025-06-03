import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../contant';
import { useEffect, useState } from 'react';
import "../css/chatBox.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMultiply } from '@fortawesome/free-solid-svg-icons';

const ChatBox = () => {
    const { chatId } = useParams();
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState({});
    const [people, setPeople] = useState([]);
    let navigate=useNavigate()
    const { token } = useSelector(state => state.user.user);
    // Fetch chat details when the component mounts
    useEffect(() => {
        const getChat = async () => {
            try {
                const response = await api.get(`/chat/get/${chatId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(response);
                setAvatar(response.data.data.avatar);
                setName(response.data.data.name);
                setPeople(response.data.data.people);
            } catch (error) {
                console.error("Error fetching chat:", error);
            }
        };
        getChat();
    }, [chatId, token]);

    return (
        <div className="chat-box w-100 bg-black vh-100">
            {/* Chat Avatar and Name */}
            <div className="chat-header">
                <img
                    src={avatar?.url}
                    alt="chat-avatar"
                    className="chat-avatar"
                />
                <h3 className="chat-name">{name}</h3>
                <FontAwesomeIcon  icon={faMultiply} className='fs-2 ms-auto v-cross pointer' onClick={()=>{
                    navigate("/message/"+chatId)
                }}/>
            </div>

            {/* List of People in the Chat */}
            <div className="chat-people">
                <h4>People in this chat:</h4>
                <ul>
                    {people.map((person, index) => (
                        <li key={index} className="person-item pointer" onClick={()=>{
                            navigate("/profile/"+person.name)
                        }}>
                            <img
                                src={person?.avatar?.url}
                                alt={person?.name}
                                className="person-avatar"
                            />
                            <span className="person-name">{person?.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ChatBox;