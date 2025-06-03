import {api} from "../contant.js"
let getUsers=async(token,name)=>{
    let users=await api.get(`/user/search/${name}`,{
        headers:{
            'Authorization':`Bearer ${token}`
        }
    })
    return users;
}
export default getUsers;