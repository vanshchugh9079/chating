import { setReel } from "../redux/slice/reel.slice";
import { api } from "../contant";
import { setUserData } from "../redux/slice/user.slice";
let getReel = async (token, dispatch) => {
    try {
        let response = await api.get(`/reel/get`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        dispatch(setReel(response.data));
    } catch (error) {
        if(error.status===500){
            dispatch(setUserData({
                user: null,
                loggedIn: false
            }))
        }
        console.log(error.status);
    }
}
export default getReel;