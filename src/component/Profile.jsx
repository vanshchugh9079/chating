import React from 'react'

export default function Profile({username,avatar}) {
  return (
    <div className='d-flex'>
        <div className='rounded-circle me-2' style={{height:"50px", width:"50px"}}>
            <img className='h-100 w-100 rounded-circle' src={avatar} alt="avatar"/>
        </div>
        <p style={{fontSize:"17px"}}>{username}</p>
    </div>
  )
}
