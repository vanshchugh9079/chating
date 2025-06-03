import React, { useState, useEffect } from 'react';
import "../css/searchBar.css"
import search from "../asset/images/search.png"
import getUsers from '../fetch/getUsers';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
const DEBOUNCE_DELAY = 200; // Adjust delay as needed
const SearchBar = () => {
  let [allUser, setAllUser] = useState([])
  let [searchUser, setSearchUser] = useState();
  let [showLoader,setShowLoader]=useState(false);
  let navigate=useNavigate();
  let token = useSelector(state => state.user.user.token)

  useEffect(() => {
    const debounceFetch = setTimeout(async () => {
      let target = searchUser.trim(); // Ensure no whitespace-only strings
      if (target === "") {
        setShowLoader(false);
        setAllUser([]); // Clear users if the search string is empty
        return;
      }
      try {
        let users = await getUsers(token, target);
        setAllUser(users.data);
        setShowLoader(false);
      } catch (error) {
        setShowLoader(false);
        console.error("Error fetching users:", error);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(debounceFetch); // Cleanup timeout on every update
  }, [searchUser]); // Only runs when `searchUser` changes

  return (
    <div className='searchBar bg-black vh-100 w-100'>
      <div className="suggestions-page bg-black  ms-auto">
        <div className="header">
          <div className="emoji-circle">
            <img src={search} alt="mental" />
          </div>
          <div className="text">
            <h2>Find friends and accounts you like</h2>
          </div>
        </div>
        <div className="search-bar position-relative">
          <input type="text" className='' placeholder="Search" onChange={(event) => {
            setShowLoader(true)
            setSearchUser(event.target.value)
          }} />
          <FontAwesomeIcon icon={faMagnifyingGlass}  className='position-absolute end-0 p-0 mt-2 btn me-3  p-0 magnify'/> 
        </div>
        {
          showLoader && search.length>0 && (
            <div className="loader-container d-flex justify-content-center">
              <div className="spinner-border text-white text-center" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )  
        }
        <ul className="suggestions-list m-0 p-0">
          {allUser.length>0 && allUser.map((user, index) => (
            <li key={index} className="suggestion-item pointer " onClick={()=>{
              navigate(`/profile/${user.name}`)
            }}>
              <div className="profile-pic">
                <img src={user.avatar.url} className='w-100 h-100 rounded-circle' alt="user" />
              </div>
              <div className="suggestion-info">
                <strong>{user.name}</strong>
                <p>suggested for you</p>
              </div>
            </li>
          ))}
        </ul>
        {
          allUser.length==0 && !showLoader &&(
            <h6 className='m-0 p-0 ms-1 fw-bold text-secondary'>No user found</h6>
          )
        }
      </div>
    </div>
  );
};

export default SearchBar;