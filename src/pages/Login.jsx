import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/login.css';
import { api } from '../contant';
import popup from '../model/popup';
import { jwtDecode } from "jwt-decode";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { setUserData } from '../redux/slice/user.slice';
import { useDispatch } from 'react-redux';

const GOOGLE_CLIENT_ID = "229496418318-afjba1k375e43lv4c4ji08ht8e76pei3.apps.googleusercontent.com";

const ChatBubble = ({ style }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="chat-bubble"
      style={{
        position: 'absolute',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        backdropFilter: 'blur(2px)',
        ...style
      }}
    />
  );
};

function LoginComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [gb, setGb] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    email: '',
    by: 'user',
    phone: '',
    type: 'public',
    avatar: '',
  });
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
    setShake(false)
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user types
  };

  const triggerErrorAnimation = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = useCallback(async () => {
    if (credentials.by != "google") {
      if (!(credentials.username || credentials.email || credentials.phone) && !credentials.password) {
        setError('Please fill in all fields');
        triggerErrorAnimation();
        return;
      }
    }
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("user/login", {
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
      const errorMsg = error?.response?.data?.message || "Login failed";
      setError(errorMsg);
      triggerErrorAnimation();
      await popup("error", errorMsg, "", false, 5000);
    } finally {
      setLoading(false);
    }
  }, [credentials, dispatch, navigate]);

  useEffect(() => {
    if (gb) {
      handleSubmit();
    }
  }, [gb, handleSubmit]);

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
      setGb(response);
    } catch (error) {
      console.error("Google Login Error:", error);
      setError("Google login failed");
      triggerErrorAnimation();
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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

        <div className={`login-glass-container ${shake ? 'shake' : ''} w-75 h-75`}>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue your conversation</p>

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
                Username or Email
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

            <button type="submit" className="login-button text-center" disabled={loading}>
              <span className="button-text text-center ms-auto me-auto">
                {loading ? (
                  <div className="loader">
                    <div className="loader-dot"></div>
                    <div className="loader-dot"></div>
                    <div className="loader-dot"></div>
                  </div>
                ) : 'Log In'}
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
                setError("Google login failed");
                triggerErrorAnimation();
              }}
              theme="filled_blue"
              size="large"
              shape="pill"
            />
          </div>

          <div className="login-footer">
            <a href="/forgot-password" className="forgot-password-link">
              Forgot password?
            </a>
            <div className="signup-link">
              Don't have an account? <Link to="/signup" className="signup-text">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginComponent;