import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import React from "react";
import "../css/ProfileCard.css";
import { api } from "../contant";
import { faMultiply } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { setShowEditModel } from "../redux/slice/editSlice";
import { setUserData } from "../redux/slice/user.slice";
import { useNavigate } from "react-router-dom";
import popup from "../model/popup";

const ProfileCard = ({ avatar, handleAvatarChange }) => {
    return (
        <div className="profile-card">
            <img src={avatar} alt="Profile" className="profile-image" />
            <input
                type="file"
                className="d-none"
                id="avatarInput"
                onChange={handleAvatarChange}
            />
            <button
                className="btn-primary btn ms-auto"
                onClick={() => document.getElementById("avatarInput").click()}
            >
                Change Avatar
            </button>
        </div>
    );
};

export default function EditProfile() {
    const { user } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [avatar, setAvatar] = useState(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialValues, setInitialValues] = useState({}); // Track initial values

    useEffect(() => {
        if (user) {
            const initialData = {
                username: user.name,
                email: user.email,
                phone: user.phone || "",
                avatar: user.avatar?.url || null,
            };
            setUsername(initialData.username);
            setEmail(initialData.email);
            setPhone(initialData.phone);
            setAvatar(initialData.avatar);
            setInitialValues(initialData); // Store initial values
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setAvatar(URL.createObjectURL(selectedFile));
        }
    };

    // Check if form values have changed
    const isChanged =
        username !== initialValues.username ||
        email !== initialValues.email ||
        phone !== initialValues.phone ||
        file !== null;

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (loading || !isChanged) return;

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", username);
            formData.append("email", email);
            if (phone) formData.append("phone", phone);
            if (file) formData.append("avatar", file);

            const result = await api.put("/user/update", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${user.token}`,
                },
            });

            dispatch(setUserData({ user: result.data.data, loggedIn: true }));
            dispatch(setShowEditModel(false));
            await popup("success", "Profile Updated successfully ", "", false, 5000).then(() => {
                navigate("/");
            });
            setFile(null);
        } catch (error) {
            console.error("Update failed:", error.response?.data || error.message);
        }

        setLoading(false);
    };

    return (
        <div className="m-0 p-0 d-flex justify-content-center align-items-center w-100 h-100 model-container">
            <FontAwesomeIcon
                icon={faMultiply}
                className="text-white fs-2 position-absolute end-0 top-0 me-5 mt-3 pointer"
                onClick={() => dispatch(setShowEditModel(false))}
            />
            <div className="card p-4 shadow-lg" style={{ width: "400px", borderRadius: "20px", height: "400px" }}>
                <div className="card-body text-center">
                    <div className="mb-3">
                        <ProfileCard avatar={avatar} handleAvatarChange={handleAvatarChange} />
                    </div>
                    <input type="text" className="form-control mb-2" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
                    <input type="email" className="form-control mb-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    <input type="tel" className="form-control mb-3" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />

                    {/* ✅ Disable button when no changes */}
                    <button className="btn btn-primary w-100" onClick={handleUpdate} disabled={!isChanged || loading}>
                        {loading ? (
                            <span>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Updating...
                            </span>
                        ) : (
                            "Update Profile"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
