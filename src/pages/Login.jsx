import React, { useState } from 'react';
import sideimage from "../public/img/sideimagelogin.png";
import { Link, useNavigate } from 'react-router-dom';
import '../css/login.css'; // Add a CSS file for styling
import { api } from '../contant';
import popup from '../model/popup';
import { FacebookLoginButton } from 'react-social-login-buttons';
import { setUserData } from '../redux/slice/user.slice';
import { useDispatch } from 'react-redux';
function LoginComponent() {
  let dispatch = useDispatch();
  let navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle login logic here
    try {
      let response = await api.post("/user/login", {
        name: credentials.username,
        password: credentials.password
      })
      console.log(response);
      await popup("success", "you login successfully", "", false, 5000).then(() => {
        dispatch(setUserData({ user: response.data.data, loggedIn: true }))
        window.localStorage.setItem("token", response.data.data.token)
        navigate("/")
      })
    } catch (error) {
      console.log(error);
      popup("error", error.response.data.message, "", false, 5000).catch((error) => {
        console.log(error);
      })
    }
  };

  return (
    <div className='d-flex  justify-content-center bg-black min-vh-100'>
      <div className='ms-auto d-none d-lg-flex mt-auto mb-auto me-0 justify-content-end'>
        <img src={sideimage} alt="Side view" className='w-75 img-cont' />
      </div>
      <div className='login-container mt-5 mt-lg-auto mb-auto h-full  me-auto'>
        <h1 className='login-title'>Login</h1>
        <form onSubmit={handleSubmit} className='login-form'>
          <label htmlFor="username" className="visually-hidden">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Phone number, username, or email"
            value={credentials.username}
            onChange={handleChange}
            className='form-input'
          />
          <label htmlFor="password" className="visually-hidden">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            className='form-input'
          />
          <button type="submit" className='login-button'>Log in</button>
        </form>
        <div className='or-container'>
          <div className='or-line'></div>
          <span className='or-text'>OR</span>
          <div className='or-line'></div>
        </div>
        <FacebookLoginButton />
        <a href="/forgot-password" className='forgot-password-link d-block'>Forgot password?</a>
        <div className='signup'>
          <span>Don't have an account? </span>
          <Link to="/signup">signup</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginComponent;
