import React, { useEffect, useState, useRef } from 'react';
import "../css/call.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faPhoneSlash } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import peer from '../service/peer.js';
import { useSocket } from '../socket/SocketContext.jsx';
import { setShowCall } from '../redux/slice/callSlice.js';
export default function Call() {
    const { who, call } = useSelector((state) => state.call);
    const [receiver, setReciever] = useState(null)
    const [myStream, setMyStream] = useState(null);
    const [offer, setOffer] = useState(null)
    const videoRef = useRef(null);
    let { user } = useSelector(state => state.user)
    const dispatch = useDispatch()
    let socket = useSocket()
    useEffect(() => {
        if (!socket) return;
        let handleCallAccept = (obj) => {
            socket.emit("send-offer",{
                offer:offer,
                callId:obj._id
            })
        }
        let handleGetOffer=(obj)=>{
            console.log(obj);
            
            setOffer(obj.offer)
        }
        socket.on("get-offer",handleGetOffer)
        socket.on("call-accepted", handleCallAccept)

        return () => {
            socket.off("get-offer", handleGetOffer)
            socket.off("call-accepted", handleCallAccept)
        }
    }, [socket,offer])
    useEffect(() => {
        let stream;
        if (who === "sender") {
            navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                .then(async (mediaStream) => {
                    setMyStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                    const offer = await peer.getOffer()
                    console.log(offer);
                    setOffer(offer)
                })
                .catch((err) => console.error("Error accessing media devices:", err));
        }
        else{
            console.log(offer);
            
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [who,setOffer]);

    return (
        <div className='d-flex w-100 h-100 justify-content-center'>
            <div className='profile d-flex flex-column justify-content-between align-items-center me-auto ms-auto h-100 w-50 me-5'>
                <div className='m-0 p-0'>
                    <img
                        className='rounded-circle'
                        src="https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352156-stock-illustration-default-placeholder-profile-icon.jpg"
                        alt="Profile"
                    />
                    <h2 className='text-white'>Vansh</h2>
                </div>
                {myStream && <video ref={videoRef} autoPlay playsInline height={"300px "} width={"300px"} />}
                <div className='d-flex text-white mb-auto mt-auto justify-content-evenly w-100'>
                    <button onClick={() => {
                        console.log(call);

                        socket.emit("call-accept", {
                            callId: call._id,
                            accepted: true
                        })

                    }} className='btn text-white bg-success rounded-circle fs-2' >
                        <FontAwesomeIcon icon={faPhone} />
                    </button>
                    <button onClick={() => {
                        socket.emit("call-reject", {
                            user: user
                        })
                    }} className='btn text-white bg-danger rounded-circle fs-2'>
                        <FontAwesomeIcon icon={faPhoneSlash} />
                    </button>
                </div>
            </div>
        </div>
    );
}
