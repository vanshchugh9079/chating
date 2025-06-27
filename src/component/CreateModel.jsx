import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setShowModel } from "../redux/slice/showCreateModel";
import {
  faTimes, faMagic, faRedo, faShare,
  faImage, faVideo, faPhotoFilm, faSquarePlus,
  faUpload, faCamera
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PinturaEditor } from '@pqina/react-pintura';
import { getEditorDefaults } from '@pqina/pintura';
import '@pqina/pintura/pintura.css';
import { Spinner } from "react-bootstrap";
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from "framer-motion";
import "../css/createModel.css"

const CreateContentModal = () => {
  const isOpen = useSelector((state) => state.showCreateModel.showModel);
  const [contentType, setContentType] = useState(null);
  const [myImage, setMyImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  const contentTypes = [
    {
      type: "post",
      title: "Create Post",
      description: "Share photos with your followers",
      icon: faImage,
      accept: "image/*",
      color: "#4e9af1",
      colorLight: "#4e9af180"
    },
    {
      type: "reel",
      title: "Create Reel",
      description: "Share short videos with your followers",
      icon: faVideo,
      accept: "video/*",
      color: "#f14e9a",
      colorLight: "#f14e9a80"
    },
    {
      type: "story",
      title: "Create Story",
      description: "Share moments that disappear after 24 hours",
      icon: faPhotoFilm,
      accept: "image/*,video/*",
      color: "#9a4ef1",
      colorLight: "#9a4ef180"
    }
  ];

  const handleFileChange = async (event) => {
    try {
      setError(null);
      const files = event.target.files || event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      setMyImage(file);
      const newUrl = URL.createObjectURL(file);
      setImgUrl(newUrl);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async () => {
    if (!myImage) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setShowLoader(true);
      // Upload logic here...
    } catch (error) {
      setError(error.message);
    } finally {
      setShowLoader(false);
    }
  };

  const closeModal = () => {
    dispatch(setShowModel(false));
    setContentType(null);
    setMyImage(null);
    setEditImage(null);
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(null);
    setEditorMode(false);
  };

  const handleVideoDuration = (duration) => {
    setVideoDuration(duration);
  };

  const editorConfig = {
    ...getEditorDefaults(),
    imageWriter: {
      ...getEditorDefaults().imageWriter,
      targetSize: { width: 1080, height: 1080 }
    },
    utils: ['crop', 'filter', 'annotate', 'adjust', 'finetune']
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileChange(e);
  };

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="content-creator-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <motion.div
            className="content-creator-modal__container"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <motion.button
              className="content-creator-modal__close-btn"
              onClick={closeModal}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </motion.button>

            {showLoader ? (
              <div className="content-creator-modal__loader">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Spinner animation="border" variant="light" />
                </motion.div>
                <p>Uploading your {contentType}...</p>
                <small>Please don't close this window</small>
              </div>
            ) : (
              <>
                {error && (
                  <motion.div 
                    className="content-creator-modal__error"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                {!contentType ? (
                  <div className="content-creator-modal__type-selector">
                    <div className="content-creator-modal__type-header">
                      <div className="content-creator-modal__type-icon">
                        <FontAwesomeIcon icon={faSquarePlus} />
                      </div>
                      <h2>Create New Content</h2>
                      <p>What would you like to share today?</p>
                    </div>

                    <div className="content-creator-modal__type-grid">
                      {contentTypes.map((item) => (
                        <motion.div
                          key={item.type}
                          className="content-creator-modal__type-card"
                          style={{ 
                            '--card-color': item.color,
                            '--card-color-light': item.colorLight
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setContentType(item.type)}
                        >
                          <div className="content-creator-modal__type-card-icon">
                            <FontAwesomeIcon icon={item.icon} />
                          </div>
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : !myImage ? (
                  <div 
                    className={`content-creator-modal__upload-container ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {dragActive ? (
                      <div className="content-creator-modal__drop-zone">
                        <FontAwesomeIcon icon={faFileUpload} />
                        <h4>Drop your file here</h4>
                      </div>
                    ) : (
                      <>
                        <div className="content-creator-modal__upload-header">
                          <div className="content-creator-modal__upload-icon">
                            <FontAwesomeIcon 
                              icon={contentTypes.find(t => t.type === contentType).icon} 
                            />
                          </div>
                          <h2>{contentTypes.find(t => t.type === contentType).title}</h2>
                          <p>
                            {contentType === 'post' 
                              ? 'Drag photos here or select from your computer'
                              : contentType === 'reel'
                              ? 'Drag videos here or select from your computer'
                              : 'Drag photos or videos here or select from your computer'}
                          </p>
                        </div>

                        <div className="content-creator-modal__upload-buttons">
                          <motion.button
                            className="content-creator-modal__upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FontAwesomeIcon icon={faUpload} />
                            Select from Computer
                          </motion.button>

                          {contentType !== 'reel' && (
                            <motion.button
                              className="content-creator-modal__camera-btn"
                              onClick={() => setCurrentTab("camera")}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FontAwesomeIcon icon={faCamera} />
                              Use Camera
                            </motion.button>
                          )}
                        </div>

                        <div className="content-creator-modal__upload-info">
                          <small>
                            {contentType === 'post' 
                              ? 'JPEG, PNG, GIF (Max 50MB)'
                              : contentType === 'reel'
                              ? 'MP4, MOV, WEBM (Max 100MB)'
                              : 'JPEG, PNG, GIF, MP4, MOV (Max 15MB)'}
                          </small>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept={contentTypes.find(t => t.type === contentType).accept}
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="content-creator-modal__preview-wrapper">
                    <div className="content-creator-modal__preview-header">
                      <h5>{contentTypes.find(t => t.type === contentType).title}</h5>
                      <div className="content-creator-modal__preview-actions">
                        <motion.button
                          className="content-creator-modal__action-btn"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setMyImage(null);
                            setEditImage(null);
                            if (imgUrl) URL.revokeObjectURL(imgUrl);
                            setImgUrl(null);
                          }}
                        >
                          <FontAwesomeIcon icon={faRedo} />
                          <span>Change</span>
                        </motion.button>

                        {contentType === 'post' && (
                          <motion.button
                            className={`content-creator-modal__action-btn ${editorMode ? 'active' : ''}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditorMode(!editorMode)}
                          >
                            <FontAwesomeIcon icon={editorMode ? faCheck : faMagic} />
                            <span>{editorMode ? 'Done' : 'Edit'}</span>
                          </motion.button>
                        )}
                      </div>
                    </div>

                    <div className="content-creator-modal__preview-content">
                      {contentType === 'post' ? (
                        editorMode ? (
                          <div className="content-creator-modal__editor-container">
                            <PinturaEditor 
                              {...editorConfig}
                              src={imgUrl}
                              onProcess={({ dest }) => {
                                setEditImage(dest);
                                const newUrl = URL.createObjectURL(dest);
                                if (imgUrl) URL.revokeObjectURL(imgUrl);
                                setImgUrl(newUrl);
                                setEditorMode(false);
                              }}
                            />
                          </div>
                        ) : (
                          <img 
                            src={imgUrl}
                            alt="preview"
                            className="content-creator-modal__preview-media"
                          />
                        )
                      ) : contentType === 'story' ? (
                        myImage.type.startsWith('image/') ? (
                          <img 
                            src={imgUrl}
                            alt="story preview"
                            className="content-creator-modal__story-media"
                          />
                        ) : (
                          <ReactPlayer
                            url={imgUrl}
                            playing
                            loop
                            muted
                            width="100%"
                            height="100%"
                            onDuration={handleVideoDuration}
                          />
                        )
                      ) : (
                        <div className="content-creator-modal__video-container">
                          <ReactPlayer
                            url={imgUrl}
                            controls
                            width="100%"
                            height="100%"
                            onDuration={handleVideoDuration}
                          />
                          <div className="content-creator-modal__video-info">
                            <small>Duration: {Math.floor(videoDuration)} seconds</small>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="content-creator-modal__preview-footer">
                      <motion.button
                        className="content-creator-modal__share-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpload}
                      >
                        {showLoader ? (
                          <>
                            <Spinner size="sm" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faShare} />
                            <span>Share {contentType.charAt(0).toUpperCase() + contentType.slice(1)}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateContentModal;