import Story from '../models/Story.js';
import User from '../models/User.js';

let storyAdd=async(socket,allUser,story,id)=>{
    let userObj=await User.findById(id)
    console.log(story,"this is a story");
    console.log(socket.id);
    let storyObj=await Story.findById(story._id).populate("user","avatar name")
    userObj.follower.forEach((friend)=>{
        console.log(friend._id);
        
        socket.to(allUser.get(friend._id.toString())).emit("new-story", storyObj)
    })
    socket.emit(storyObj);
}
let getYourStory=async(socket,allUser,id)=>{
    let story=await Story.find({user:id}).populate("user","avatar name")
    socket.emit(story)
}
export {storyAdd,getYourStory}