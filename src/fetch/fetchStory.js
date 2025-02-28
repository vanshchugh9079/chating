import { api } from "../contant";

let fetchStory=async(token)=>{
    let response=await api.get("/story/get",{
        headers:{
            'Authorization':`Bearer ${token}`
        }
    })
    console.log(response);
    return response;
}
export default fetchStory;