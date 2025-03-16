import React, { useEffect, useState } from 'react';
import sideimage from "../public/img/sideimagelogin.png";
import '../css/login.css';
import { Link, useNavigate } from 'react-router-dom';
import { api } from "../contant.js";
import popup from "../model/popup.js";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { Form } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/slice/user.slice.js';
import Dropzone from '../component/DropZone.jsx';

const GOOGLE_CLIENT_ID = "229496418318-afjba1k375e43lv4c4ji08ht8e76pei3.apps.googleusercontent.com"; // Replace with your actual Google Client ID

function Register() {
  let dispatch = useDispatch();
  const [avatar, setAvatar] = useState({});
  const [credentials, setCredentials] = useState({ username: '', email: '', phone: '', password: '', type: "public" ,avatar:"" ,by:"user"});
  let navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async () => {
    console.log('Registering with:', credentials);
    try {
      const formData = new FormData();
      formData.append("name", credentials.username);
      formData.append("email", credentials.email);
      formData.append("phone", credentials.phone);
      formData.append("password", credentials.password);
      formData.append("type", credentials.type);
      if(credentials.by){
        formData.append("by", credentials.by);
      }
      if(credentials.avatar){
        formData.append("avatar", credentials.avatar);
      }
      if (avatar.file instanceof File) {
        formData.append("avatar", avatar.file);
      }
      const response = await api.post("/user/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        dispatch(setUserData({ user: response.data.data, loggedIn: true }));
        await popup("success", "Account created successfully", "", "false", 1000000000);
        navigate("/");
      }
    } catch (error) {
      console.log(error);
      setCredentials({ username: '', email: '', phone: '', password: '', type: "public" ,avatar:"" ,by:"user"})
      await popup("error", error.response?.data?.message || "Something went wrong", "", "false", 10000);
    }
  };
  
  const [googleUser, setGoogleUser] = useState(null);

  useEffect(() => {
    if (googleUser) {
      handleSubmit();
    }
  }, [googleUser]); // Submit after credentials update

  const handleGoogleLoginSuccess = async (response) => {
    try {
      const decodedUser =  jwtDecode(response.credential);
      console.log("Google User:", decodedUser);
      if(decodedUser)
      setCredentials({
        username: decodedUser.name,
        email: decodedUser.email,
        avatar:decodedUser.picture,
        phone: '',
        password: '',
        by:"google",
        type: 'public'
      });
      setGoogleUser(response);

    } catch (error) {
      console.error("Google login failed:", error);
      await popup("error", "Google login failed", "", "false", 10000);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className='d-flex justify-content-center bg-black vh-100'>
        <div className='ms-auto d-none d-lg-flex mt-auto mb-auto me-0 justify-content-end'>
          <img src={sideimage} alt="Side view" className='w-75 img-cont' />
        </div>
        <div className='login-container mt-5 mt-lg-auto mb-auto'>
          <h1 className='login-title p-0'>Register</h1>
          <form onSubmit={(e)=>{
            e.preventDefault()
            handleSubmit()
          }} className='login-form m-0'>
            <input name="username" type="text" placeholder="Username" value={credentials.username} onChange={handleChange} className='form-input' />
            <input name="email" type="email" placeholder="Email" value={credentials.email} onChange={handleChange} className='form-input' />
            <input name="phone" type="text" placeholder="Phone Number (optional)" value={credentials.phone} onChange={handleChange} className='form-input' />
            <input name="password" type="password" placeholder="Password" value={credentials.password} onChange={handleChange} className='form-input' />
            <Form.Select aria-label="select type of account" onChange={handleChange} name='type' className='mb-2'>
              <option value="public">public</option>
              <option value="private">private</option>
            </Form.Select>
            <Dropzone setAvatar={setAvatar} />
            <button type="submit" className='register-button'>Register</button>
          </form>
          <div className='signup'>
            <span>Already have an account? </span>
            <Link to="/login">Login</Link>
          </div>

          {/* Google Login Button */}
          <div className="mt-3">
            <GoogleLogin onSuccess={(response)=>{
              handleGoogleLoginSuccess(response)
            }} onError={() => console.log("Google login failed")} />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Register;
