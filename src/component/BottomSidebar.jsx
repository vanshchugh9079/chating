import React, { useEffect, useState } from 'react';
import "../css/sidebar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faMagnifyingGlass, faPlus, faVideo, faUser, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setShowModel } from '../redux/slice/showCreateModel';
import { useNavigate, useLocation } from 'react-router-dom';
import classNames from 'classnames';

export default function BottomSidebar() {
    let user=useSelector((state)=>state.user.user)
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [currentPath, setCurrentPath] = useState(getCurrentPath());

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        setCurrentPath(getCurrentPath());
    }, [location.pathname]);

    function getCurrentPath() {
        if (location.pathname.includes("message")) return "message";
        if (location.pathname.includes("profile")) return "profile";
        if (location.pathname.includes("search")) return "search";
        if (location.pathname.includes("reels")) return "reels";
        if (location.pathname === "/") return "home";
        return "";
    }

    const handleNavigation = (path) => {
        navigate(`/${path}`);
    };

    return (
        <>
            {!isMobile ? (
                <div className="sidebar d-lg-none ">
                    <h2 className="logo">Instagram</h2>
                    <ul>
                        <SidebarItem icon={faHouse} label="Home" current={currentPath} path="home" onClick={handleNavigation} />
                        <SidebarItem icon={faMagnifyingGlass} label="Search" current={currentPath} path="search" onClick={handleNavigation} />
                        <SidebarItem icon={faVideo} label="Reels" current={currentPath} path="reel" onClick={handleNavigation} />
                        <SidebarItem icon={faUser} label="Profile" current={currentPath} path="profile" onClick={handleNavigation} />
                        <SidebarItem icon={faPlus} label="Create" current={currentPath} path="create" onClick={() => dispatch(setShowModel(false))} />
                    </ul>
                </div>
            ) : (
                <div className="bottom-nav d-flex justify-content-between fixed-bottom bg-black p-0 m-0 w-100">
                    <div className="home ms-3">
                        <SidebarItem icon={faHouse} path="home" title={"home"} current={currentPath} onClick={handleNavigation} />
                    </div>
                    <div className="search">
                        <SidebarItem title="search" icon={faMagnifyingGlass} path="search" current={currentPath} onClick={handleNavigation}/>
                    </div>
                    <div className="create">
                        <SidebarItem
                            icon={faPlusCircle}
                            path="create"
                            title="create"
                            current={currentPath}
                            onClick={() => dispatch(setShowModel(false))}
                        />
                    </div>

                    <div className="reels">
                        <SidebarItem icon={faVideo} path="reel" title="reel" current={currentPath} onClick={handleNavigation} />
                    </div>
                    <div className="profile">
                        <SidebarItem icon={faUser} path={`profile/${user.name}`} title="profile" current={currentPath} onClick={handleNavigation} />
                    </div>
                </div>
            )}
        </>
    );
}

const SidebarItem = ({ icon, label, current, path, onClick ,title }) => (
    <li title={title} className={classNames("sidebar-item text-white ", { active: current === path })} onClick={() => onClick(path)}>
        <FontAwesomeIcon icon={icon} size="lg" />
        {label && <span>{label}</span>}
    </li>
);