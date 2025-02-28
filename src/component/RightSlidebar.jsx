import React from 'react';
import Profile from './Profile';
// import './RightSidebar.css'; // Create this CSS file for styling

function RightSidebar() {
  return (
    <div className="right-sidebar vh-100 bg-black text-white d-none ">
      <Profile avatar="https://th.bing.com/th/id/OIP.Z_PIeIRDajXPmZHROt-T_QHaEK?rs=1&pid=ImgDetMain" username="vansh"/>
      <h3 className='mt-3'>Suggested for you</h3>
      <ul>
        <li>goldenrays_publicschool</li>
        <li>cherry._.khurana</li>
        <li>aanchal_thakral6</li>
        <li>jai_ks25</li>
      </ul>
    </div>
  );
}

export default RightSidebar;