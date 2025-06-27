import { faMessage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import "../css/messageDetailer.css"
import { useDispatch } from 'react-redux'
import { setShowMessageModel } from '../redux/slice/showMessageModel'

export default function MessageDetailer() {
    let dispatch=useDispatch()
    return (
        <div className='d-lg-flex flex-column d-none  justify-content-center align-items-center vh-100  w-100  cont'>
            <div className='parent-circle'>
                <div className='child-circle'>
                    <FontAwesomeIcon icon={faMessage} className='text-white' />
                </div>
            </div>
            <h4 className='text-white fw-bold'>
                Your messages
            </h4>
            <p className='text-white fw-light'>Send a message to start a chat.
            </p>
            <button className='bg-primary text-white btn fw-bold ' onClick={()=>{
                dispatch(setShowMessageModel(true))
            }}>send message</button>
        </div>
    )
}
