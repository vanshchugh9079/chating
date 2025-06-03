import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setShowModel } from "../redux/slice/showCreateModel";
import upload from "../asset/images/upload.png"; // Adjust the path if necessary
import "../css/createModel.css";
import { faCross, faMultiply } from "@fortawesome/free-solid-svg-icons";
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
import { useSocket } from "../socket/SocketContext"
import { setYourStory } from "../redux/slice/yourStory";
const Modal = () => {
  const isOpen = useSelector((state) => state.showCreateModel.showModel);
  const isShowStory = useSelector((state) => state.showCreateModel.story);
  const yourStory = useSelector((state) => state.yourStory.story)
  const [showStory, setShowStory] = useState(isShowStory);
  let location = useLocation()
  let [myImage, setMyimage] = useState(null)
  let [editImage, setEditImage] = useState(null)
  let [imgUrl, setImgurl] = useState(null)
  const [showLoader, setShowLoader] = useState(null);
  const [createImage, setCreateImage] = useState(true);
  let user = useSelector((state) => state.user.user)
  let params = useParams()
  let socket = useSocket();
  const dispatch = useDispatch();
  // Handle file selection
  useEffect(() => {
    setShowStory(isShowStory)
  }, [isShowStory])
  const handleFileChange = (event) => {
    const files = event.target.files;
    console.log(files[0].name.split("."));
    let ext = files[0].name.split(".")[files[0].name.split(".").length - 1];
    if (ext === "jpg" || ext === "png" || ext === "jpeg" || ext === "gif") {
      setMyimage(files[0])
    }
    else if (ext === "mp4" || ext === "mpeg") {
      setCreateImage(false);
      setMyimage(files[0])
      setImgurl(URL.createObjectURL(files[0]))
    }
  };
  let fetchPathData = () => {
    let { pathname } = location
    console.log(pathname);
    if (pathname === "/") {
      fetchPost(user.token, dispatch);
    }
    else if (pathname === `/profile/${params.name}`) {
      getProfile(params.name, user.token, dispatch)
    }
  }
  let handleUpload = async () => {
    if (createImage) {
      try {
        setShowLoader(true)
        let formData = new FormData();
        formData.append('media', editImage);
        let response = await api.post(`/${showStory ? "story" : "post"}/create`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer ' + user.token,
          },
        })
        if (showStory) {
          socket.emit("story-added", {
            id: user._id,
            story: response.data.data
          });
        }
        fetchPathData();
        setShowLoader(false)
        showStory && dispatch(setYourStory([...yourStory, response.data.data]))
        await popup("success", `${showStory ? "story" : "post"} created successfully`, "", "false", 1000000000)
        setShowStory(false);
      } catch (error) {
        console.log(error);
        setShowStory(false)
      }
      dispatch(setShowModel(false))
      setMyimage(null)
      setEditImage(null)
      setImgurl(null)
    }
    else {
      try {
        setShowLoader(true)
        let formData = new FormData();
        formData.append('media', myImage);
        let response = await api.post(`/${showStory ? "story" : "reel"}/create`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer ' + user.token,
          },
        })
        fetchPathData();
        setShowLoader(false)
        console.log(response);
        showStory && dispatch(setYourStory([...yourStory, response.data.data]))
        dispatch(setShowModel())
        await popup("success", `${showStory ? "story" : "reel"} created successfully`, "", "false", 1000000000)
      } catch (error) {
        console.log(error);
      }
      finally {
        showStory && dispatch(set)
        setShowStory(false);
        setMyimage(null)
        setEditImage(null)
        setImgurl(null)
      }

    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="modal-overlay justify-content-center d-flex align-items-center m-0 p-0"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-content bg-dark position-relative text-center">
            {
              showLoader &&
              <Spinner animation="border" role="status" variant="white">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            }

            {
              !showLoader &&
              <>
                <FontAwesomeIcon icon={faMultiply} className="text-white fs-5 fw-bold position-absolute text-white top-0 end-0 m-2 v-close" onClick={() => {
                  dispatch(setShowModel())
                  setMyimage(null)
                  setEditImage(null)
                  setImgurl(null)
                }} />
                {
                  !myImage &&
                  <div className="h-75 w-75">
                    <img src={upload} alt="upload" className="upload-img" height={100} width={100} />
                    <h6 className="text-white mt-3">Drag photos and videos here</h6>
                    <div className="mt-4">
                      <input
                        type="file"
                        id="fileInput"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => document.getElementById("fileInput").click()}
                      >
                        Select from Computer
                      </button>
                    </div>
                  </div>
                }
                {
                  myImage && (
                    <div className="img-preview h-75 w-75 d-flex justify-content-center" >
                      {
                        !imgUrl && createImage &&
                        <PinturaEditor {...getEditorDefaults()} src={myImage} alt="image" className="h-100 w-100" onProcess={(res) => {
                          setEditImage(res.dest)
                          setImgurl(URL.createObjectURL(res.dest))
                        }
                        } />
                      }
                      {
                        !createImage && imgUrl &&
                        <div className="w-100 h-100 ">
                          <video src={URL.createObjectURL(myImage)} controls className="w-100 mb-3 h-100"></video>
                          <button className="btn btn-primary" onClick={() => {
                            handleUpload()
                          }}>upload</button>
                        </div>
                      }
                      {
                        imgUrl && createImage &&
                        <div className="w-100 h-100">
                          <img src={imgUrl} alt="preview" className="w-100 mb-3 h-100" />
                          <button className="btn btn-primary" onClick={() => {
                            handleUpload()

                          }}>upload</button>
                        </div>
                      }
                    </div>
                  )
                }
              </>
            }
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
