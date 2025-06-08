import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/login.css';
import { api } from '../contant';
import popup from '../model/popup';
import { jwtDecode } from "jwt-decode";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { setUserData } from '../redux/slice/user.slice';
import { useDispatch } from 'react-redux';
import Dropzone from '../component/DropZone.jsx';
import { Form } from 'react-bootstrap';

const GOOGLE_CLIENT_ID = "229496418318-afjba1k375e43lv4c4ji08ht8e76pei3.apps.googleusercontent.com";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [gb, setGb] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    type: 'public',
    by: 'user',
    avatar: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newBubble = {
        id: Date.now(),
        left: `${Math.random() * 100}%`,
        size: `${10 + Math.random() * 20}px`,
        animationDuration: `${5 + Math.random() * 10}s`,
        animationDelay: `${Math.random() * 2}s`
      };
      setBubbles(prev => [...prev.slice(-20), newBubble]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const triggerErrorAnimation = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = useCallback(async () => {
    if (credentials.by!="google" && (!credentials.username || !credentials.email || !credentials.password)) {
      setError('Please fill in all required fields');
      triggerErrorAnimation();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', credentials.username);
      formData.append('email', credentials.email);
      formData.append('phone', credentials.phone || '');
      formData.append('password', credentials.password);
      formData.append('type', credentials.type);
      formData.append('by', credentials.by);
      
      if (avatar) {
        formData.append('avatar', avatar);
      } else if (credentials.avatar) {
        formData.append('avatarUrl', credentials.avatar);
      }

      const response = await api.post("user/create", formData,{
        headers:{
          "Content-Type":"multipart/form-data"
        }
      });

      await popup("success", "Registration successful!", "", false, 5000);
      dispatch(setUserData({ user: response?.data?.data, loggedIn: true }));
      window.localStorage.setItem("token", response?.data?.data?.token);
      navigate("/");
    } catch (error) {
      console.error("Registration Error:", error);
      const errorMsg = error?.response?.data?.message || "Registration failed";
      setError(errorMsg);
      triggerErrorAnimation();
      await popup("error", errorMsg, "", false, 5000);
    } finally {
      setLoading(false);
    }
  }, [credentials, avatar, dispatch, navigate]);

  useEffect(() => {
    if (gb) {
      console.log(gb);
      
      handleSubmit();
    }
  }, [gb, handleSubmit]);

  const handleGoogleLogin = async (response) => {
    try {
      const decodedUser = jwtDecode(response.credential);
      console.log(decodedUser);
      setCredentials({
        username: decodedUser.name ,
        email: decodedUser.email,
        password: "",
        phone: "",
        type: "public",
        by: "google",
        avatar: decodedUser.picture
      });
      setGb(response);
    } catch (error) {
      console.error("Google Registration Error:", error);
      setError("Google registration failed");
      triggerErrorAnimation();
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <style>
        {`
          /* Custom scrollbar styles */
          .custom-scroll-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scroll-container::-webkit-scrollbar-track {
            background: rgba(122, 124, 215, 0.1);
            border-radius: 10px;
            margin: 10px 0;
          }
          .custom-scroll-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            transition: all 0.3s ease;
          }
          .custom-scroll-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          .custom-scroll-container::-webkit-scrollbar-corner {
            background: transparent;
          }
        `}
      </style>
      
      <div className="login-background w-100 h-100">
        {bubbles.map(bubble => (
          <div 
            key={bubble.id}
            className="falling-bubble"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              animationDuration: bubble.animationDuration,
              animationDelay: bubble.animationDelay
            }}
          />
        ))}
        
        <div className={`login-glass-container ${shake ? 'shake' : ''} w-75 h-auto`} style={{ maxHeight: '90vh' }}>
          <div className="custom-scroll-container" style={{ 
            maxHeight: '80vh', 
            overflowY: 'auto',
            paddingRight: '8px' // Add padding to prevent content from being hidden behind scrollbar
          }}>
            <h1 className="login-title">Create Account</h1>
            <p className="login-subtitle">Join us to start your conversation</p>
            
            {error && (
              <div className="error-box">
                <div className="error-icon">!</div>
                <div className="error-message">{error}</div>
              </div>
            )}
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="login-form"
            >
              <div className="form-group">
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder=" "
                  value={credentials.username}
                  onChange={handleChange}
                  className="form-input fs-6"
                  autoComplete="off"
                />
                <label htmlFor="username" className="form-label">
                  Username
                </label>
              </div>
              
              <div className="form-group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder=" "
                  value={credentials.email}
                  onChange={handleChange}
                  className="form-input fs-6"
                  autoComplete="off"
                />
                <label htmlFor="email" className="form-label">
                  Email
                </label>
              </div>
              
              <div className="form-group">
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder=" "
                  value={credentials.phone}
                  onChange={handleChange}
                  className="form-input fs-6"
                  autoComplete="off"
                />
                <label htmlFor="phone" className="form-label">
                  Phone Number (optional)
                </label>
              </div>
              
              <div className="form-group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder=" "
                  value={credentials.password}
                  onChange={handleChange}
                  className="form-input fs-6"
                />
                <label htmlFor="password" className="form-label">
                  Password
                </label>
              </div>

              <div className="form-group mb-3 position-relative">
                <Form.Select
                  aria-label="Select type of account"
                  onChange={handleChange}
                  name="type"
                  className="form-input select-custom"
                  style={{
                    padding: '15px 20px',
                    color: '#ffffff',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23ffffff' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '12px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <option value="public" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
                    Public 
                  </option>
                  <option value="private" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
                    Private 
                  </option>
                </Form.Select>
              </div>

              <div className="form-group mb-3">
                <Dropzone setAvatar={setAvatar} />
              </div>
              
              <button type="submit" className="login-button text-center" disabled={loading}>
                <span className="button-text text-center ms-auto me-auto">
                  {loading ? (
                    <div className="loader">
                      <div className="loader-dot"></div>
                      <div className="loader-dot"></div>
                      <div className="loader-dot"></div>
                    </div>
                  ) : 'Register'}
                </span>
                {!loading && <span className="button-icon">→</span>}
              </button>
            </form>
            
            <div className="or-container">
              <div className="or-line"></div>
              <span className="or-text">OR</span>
              <div className="or-line"></div>
            </div>
            
            <div className="social-login">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  setError("Google registration failed");
                  triggerErrorAnimation();
                }}
                theme="filled_blue"
                size="large"
                shape="pill"
              />
            </div>
            
            <div className="login-footer">
              <div className="signup-link">
                Already have an account? <Link to="/login" className="signup-text">Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Register;