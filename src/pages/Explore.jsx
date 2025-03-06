import React, { useEffect, useState } from 'react'
import fetchPost from '../fetch/fethPost'
import { useDispatch, useSelector } from 'react-redux'
import Post from '../component/Post';

export default function Explore() {
    const posts = useSelector((state) => state.post.posts);
    const [allPost,setAllPost]=useState([])
    useEffect(()=>{
        setAllPost(posts)
    },[posts])
    return (
        <div className='d-flex wrap'>
            {
                allPost.map((post) => (
                    <div key={post.id} className='col-md-3'>
                        <Post post={post} page={"explore"} />
                    </div>
                ))
            }
        </div>
    )
}
