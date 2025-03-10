import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Post from '../component/Post';
import { setComment } from '../redux/slice/commentSlice';
import { setShowComment } from '../redux/slice/commentSlice';

export default function Explore() {
    const posts = useSelector((state) => state.post.posts);
    const reels = useSelector(state => state.reel.reels)
    const [allReels, setAllReels] = useState([])
    const [allPost, setAllPost] = useState([]);
    let { user } = useSelector(state => state.user);
    let dispatch=useDispatch()
    useEffect(() => {
        setAllPost(posts);
        setAllReels(reels)
    }, [posts]);

    return (
        <div
            className="d-flex "
            style={{
                maxHeight: "100vh",
                overflowY: "auto",
                marginBottom: "0",  // Ensure no extra space at the bottom
                paddingBottom: "0"  // Remove any bottom padding
            }}
        >
            <div className=' d-flex  ms-auto me-auto m-0 p-0 flex-wrap ' style={{
                maxHeight: "100vh",
                width: "90%"
            }}>
                {
                    allPost.map((element, key) => (
                        <div key={element._id} className='m-0 mt-3 p-0'>
                            <Post
                                className="m-0 p-0"
                                id={element._id}
                                youLiked={element.youLiked}
                                likes={element.likes.length}
                                _id={element._id}
                                src={element.media.url}
                                avatar={element.createdBy.avatar.url}
                                userName={element.createdBy._id === user._id ? "you" : element.createdBy.userName}
                                createdAt={element.createdAt}
                                comment={element.comment}
                                page="explore"
                            />
                        </div>
                    ))
                }
            </div>
        </div>
    );
}
