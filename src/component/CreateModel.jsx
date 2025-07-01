import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setShowModel } from "../redux/slice/showCreateModel";
import upload from "../asset/images/upload.png";
import "../css/createModel.css";
import { faTimes, faImage, faVideo, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PinturaEditor } from '@pqina/react-pintura';
import { getEditorDefaults } from '@pqina/pintura';
import '@pqina/pintura/pintura.css';
import { api } from "../contant";
import { Spinner } from "react-bootstrap";
import popup from "../model/popup";
import fetchPost from "../fetch/fethPost";
import { useLocation, useParams } from "react-router-dom";
import getProfile from "../fetch/getProfile";
import { useSocket } from "../socket/SocketContext";
import { setYourStory } from "../redux/slice/yourStory";

const Modal = () => {
  const isOpen = useSelector((state) => state.showCreateModel.showModel);
  const isShowStory = useSelector((state) => state.showCreateModel.story);
  const yourStory = useSelector((state) => state.yourStory.story);
  const [showStory, setShowStory] = useState(isShowStory);
  const [activeTab, setActiveTab] = useState(isShowStory ? 'story' : 'post');
  const location = useLocation();
  const [myImage, setMyImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [createImage, setCreateImage] = useState(true);
  const user = useSelector((state) => state.user.user);
  const params = useParams();
  const socket = useSocket();
  const dispatch = useDispatch();

  // Color scheme
  const colors = {
    primary: '#FF5C8D',       // Vibrant pink
    secondary: '#5C6BC0',     // Soft purple
    accent: '#00E5FF',        // Bright cyan
    background: '#1A1A2E',    // Dark navy
    surface: '#16213E',       // Slightly lighter navy
    text: '#FFFFFF',          // White
    textSecondary: '#B8B8B8', // Light gray
    error: '#FF5252',         // Bright red
    success: '#4CAF50'        // Green
  };

  useEffect(() => {
    setShowStory(isShowStory);
    setActiveTab(isShowStory ? 'story' : 'post');
  }, [isShowStory]);

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const ext = files[0].name.split(".").pop().toLowerCase();
    
    if (['jpg', 'png', 'jpeg', 'gif'].includes(ext)) {
      setCreateImage(true);
      setMyImage(files[0]);
      setImgUrl(URL.createObjectURL(files[0]));
    } else if (['mp4', 'mpeg', 'mov', 'avi'].includes(ext)) {
      setCreateImage(false);
      setMyImage(files[0]);
      setImgUrl(URL.createObjectURL(files[0]));
    } else {
      popup("error", "Unsupported file type", "Please upload an image or video file", "false", 3000);
    }
  };

  const fetchPathData = () => {
    const { pathname } = location;
    if (pathname === "/") {
      fetchPost(user.token, dispatch);
    } else if (pathname === `/profile/${params.name}`) {
      getProfile(params.name, user.token, dispatch);
    }
  };

  const handleUpload = async () => {
    if (!myImage) return;
    
    try {
      setShowLoader(true);
      const formData = new FormData();
      formData.append('media', editImage || myImage);
      
      let endpoint = '';
      if (activeTab === 'story') {
        endpoint = 'story';
      } else if (activeTab === 'post') {
        endpoint = createImage ? 'post' : 'reel';
      }
      
      const response = await api.post(`/${endpoint}/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer ' + user.token,
        },
      });
      
      if (activeTab === 'story') {
        socket.emit("story-added", {
          id: user._id,
          story: response.data.data
        });
        dispatch(setYourStory([...yourStory, response.data.data]));
      }
      
      fetchPathData();
      await popup("success", `${endpoint} created successfully`, "", "false", 3000);
    } catch (error) {
      console.error(error);
      popup("error", "Upload failed", error.response?.data?.message || "Something went wrong", "false", 3000);
    } finally {
      setShowLoader(false);
      dispatch(setShowModel(false));
      setMyImage(null);
      setEditImage(null);
      setImgUrl(null);
      setShowStory(false);
    }
  };

  const renderUploadArea = () => (
    <div 
      className="upload-area"
      onClick={() => document.getElementById("fileInput").click()}
    >
      <img src={upload} alt="upload" className="upload-img" />
      <h5 style={{ color: colors.text }}>
        Create New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
      </h5>
      <p style={{ color: colors.textSecondary }}>
        Drag photos and videos here or select from computer
      </p>
      <input
        type="file"
        id="fileInput"
        accept={activeTab === 'reel' ? "video/*" : "image/*,video/*"}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        className="select-button"
        style={{ backgroundColor: colors.primary }}
      >
        Select from Computer
      </button>
    </div>
  );

  const renderMediaPreview = () => {
    if (!myImage) return null;
    
    if (!createImage && imgUrl) {
      return (
        <div className="media-preview">
          <video src={imgUrl} controls className="preview-media" />
          <div className="preview-actions">
            <button 
              className="cancel-button"
              style={{ borderColor: colors.error, color: colors.error }}
              onClick={() => {
                setMyImage(null);
                setImgUrl(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="upload-button"
              style={{ backgroundColor: colors.primary }}
              onClick={handleUpload}
              disabled={showLoader}
            >
              {showLoader ? (
                <>
                  <Spinner animation="border" size="sm" /> Uploading...
                </>
              ) : (
                `Share ${activeTab}`
              )}
            </button>
          </div>
        </div>
      );
    }
    
    if (imgUrl && createImage) {
      return (
        <div className="media-preview">
          <img src={imgUrl} alt="preview" className="preview-media" />
          <div className="preview-actions">
            <button 
              className="cancel-button"
              style={{ borderColor: colors.error, color: colors.error }}
              onClick={() => {
                setMyImage(null);
                setEditImage(null);
                setImgUrl(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="upload-button"
              style={{ backgroundColor: colors.primary }}
              onClick={handleUpload}
              disabled={showLoader}
            >
              {showLoader ? (
                <>
                  <Spinner animation="border" size="sm" /> Uploading...
                </>
              ) : (
                `Share ${activeTab}`
              )}
            </button>
          </div>
        </div>
      );
    }
    
    if (!imgUrl && createImage) {
      return (
        <div className="image-editor">
          <PinturaEditor 
            {...getEditorDefaults()} 
            src={myImage} 
            className="editor-container"
            onProcess={(res) => {
              setEditImage(res.dest);
              setImgUrl(URL.createObjectURL(res.dest));
            }}
          />
          <div className="editor-actions">
            <button 
              className="cancel-button"
              style={{ borderColor: colors.error, color: colors.error }}
              onClick={() => {
                setMyImage(null);
                setEditImage(null);
                setImgUrl(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      {isOpen && (
        <div 
          className="modal-overlay" 
          role="dialog" 
          aria-modal="true"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
        >
          <div 
            className="modal-content"
            style={{ backgroundColor: colors.surface }}
          >
            {showLoader ? (
              <div className="loader-container">
                <Spinner 
                  animation="border" 
                  style={{ color: colors.accent }} 
                />
                <p style={{ color: colors.text }}>
                  Uploading your {activeTab}...
                </p>
              </div>
            ) : (
              <>
                <button 
                  className="close-button"
                  style={{ color: colors.text }}
                  onClick={() => {
                    dispatch(setShowModel(false));
                    setMyImage(null);
                    setEditImage(null);
                    setImgUrl(null);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                
                <div 
                  className="modal-header"
                  style={{ borderBottom: `1px solid ${colors.primary}20` }}
                >
                  <h4 style={{ color: colors.text }}>
                    Create New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h4>
                </div>
                
                <div 
                  className="content-type-selector"
                  style={{ backgroundColor: colors.background }}
                >
                  {['post', 'story', 'reel'].map((type) => (
                    <div
                      key={type}
                      className={`type-option ${activeTab === type ? 'active' : ''}`}
                      onClick={() => setActiveTab(type)}
                      style={{
                        color: activeTab === type ? colors.primary : colors.textSecondary,
                        borderBottomColor: colors.primary
                      }}
                    >
                      <FontAwesomeIcon 
                        icon={
                          type === 'post' ? faImage : 
                          type === 'story' ? faUserCircle : faVideo
                        } 
                      />
                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="modal-body">
                  {!myImage ? renderUploadArea() : renderMediaPreview()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;