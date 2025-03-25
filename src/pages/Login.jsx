import React, { useEffect, useState, useCallback } from 'react';
import sideimage from "../public/img/sideimagelogin.png";
import { Link, useNavigate } from 'react-router-dom';
import '../css/login.css';
import { api } from '../contant';
import popup from '../model/popup';
import { jwtDecode } from "jwt-decode";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { setUserData } from '../redux/slice/user.slice';
import { useDispatch } from 'react-redux';

const GOOGLE_CLIENT_ID = "229496418318-afjba1k375e43lv4c4ji08ht8e76pei3.apps.googleusercontent.com";

function LoginComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [gb, setGb] = useState(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    email: '',
    by: 'user',
    phone: '',
    type: 'public',
    avatar: '',
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  // Handle login API call
  const handleSubmit = useCallback(async () => {
    try {
      const response = await api.post("/user/login", {
        name: credentials.username,
        password: credentials.password,
        email: credentials.email,
        by: credentials.by,
        phone: credentials.phone,
        type: credentials.type,
        avatar: credentials.avatar,

      });

      await popup("success", "You logged in successfully", "", false, 5000);
      dispatch(setUserData({ user: response?.data?.data, loggedIn: true }));

      window.localStorage.setItem("token", response?.data?.data?.token);
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
      await popup("error", error?.response?.data?.message || "Login failed", "", false, 5000);
    }
  }, [credentials, dispatch, navigate]);

  // Trigger login when Google login sets credentials
  useEffect(() => {
    if(gb){
      handleSubmit()
    }
  }, [gb]);

  // Handle Google login
  const handleGoogleLogin = async (response) => {
    try {
      const decodedUser = jwtDecode(response.credential);
      setCredentials({
        username: decodedUser.name,
        password: "",
        email: decodedUser.email,
        phone: "",
        type: "public",
        by: "google",
        avatar: decodedUser.picture,
      });
      setGb(response)
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="d-flex justify-content-center bg-black min-vh-100">
        <div className="ms-auto d-none d-lg-flex mt-auto mb-auto me-0 justify-content-end">
          <img src={sideimage} alt="Side view" className="w-75 img-cont" />
        </div>
        <div className="login-container mt-5 mt-lg-auto mb-auto h-full me-auto">
          <h1 className="login-title">Login</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="login-form"
          >
            <label htmlFor="username" className="visually-hidden">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Phone number, username, or email"
              value={credentials.username}
              onChange={handleChange}
              className="form-input"
            />
            <label htmlFor="password" className="visually-hidden">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              className="form-input"
            />
            <button type="submit" className="login-button">
              Log in
            </button>
          </form>
          <div className="or-container">
            <div className="or-line"></div>
            <span className="or-text">OR</span>
            <div className="or-line"></div>
          </div>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => console.log("Google login failed")}
          />
          <a href="/forgot-password" className="forgot-password-link d-block mt-3">
            Forgot password?
          </a>
          <div className="signup mt-3">
            <span>Don't have an account? </span>
            <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginComponent;
