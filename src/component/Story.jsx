import React, { useEffect } from 'react'
import "../css/story.css"
import { useDispatch } from 'react-redux'
import { setShowStory, setStory } from '../redux/slice/showStoryModel';
export default function Story({ media, avatar, name }) {
    let dispatch = useDispatch();
    useEffect(() => {
        console.log(media);
    }, [])
    return (
        <div className='text-center' onClick={() => {
            dispatch(setStory({
                name: name,
                media: media,
                avatar: avatar,
            }))
            dispatch(setShowStory(true))
        }}>
            <div className="story">
                <img src={avatar?.url} className='w-100 h-100 rounded-circle' alt="User" />
            </div>
            <p className='text-white story-text me-2 '>{name}</p>
        </div>
    )
}
