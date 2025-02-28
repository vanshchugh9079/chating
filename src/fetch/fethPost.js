import { setPost } from "../redux/slice/post.slice";
import { api } from "../contant";
import { setUserData } from "../redux/slice/user.slice";
let fetchPost = async (token, dispatch) => {
    try {
        let response = await api.get(`/post/get`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        dispatch(setPost(response.data));
    } catch (error) {
        if(error.status===500 || error.status===401){
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