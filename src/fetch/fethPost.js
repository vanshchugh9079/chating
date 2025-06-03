import { setPost } from "../redux/slice/post.slice";
import { api } from "../contant";
import { setUserData } from "../redux/slice/user.slice";
import { Navigate, useNavigate } from "react-router-dom";
let fetchPost = async (token, dispatch,naviagte) => {
    try {
        let response = await api.get(`/post/get`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        dispatch(setPost(response.data));
    } catch (error) {
        if(error){
            window.localStorage.clear();
            dispatch(setUserData({
                user: null,
                loggedIn: false
            }))
            naviagte("/")
        }
        if(error.status===500 ){
            window.localStorage.clear();
            dispatch(setUserData({
                user: null,
                loggedIn: false
            }))
        }
        console.log(error.status);
    }
}
export default fetchPost;