import { api } from "../contant";
import { setProfile } from "../redux/slice/profile";
let getProfile=async(name,token,dispatch)=>{
    try {
        let response = await api.get(`/user/profile/${name}`,{
            headers:{
                'Authorization': `Bearer ${token}`
            }
        })
        console.log(response.data.data);
        dispatch(setProfile(response.data.data));
    } catch (error) {
        console.log(error);
    }
}
export default getProfile;