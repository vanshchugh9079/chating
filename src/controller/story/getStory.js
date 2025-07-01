import Story from "../../models/Story.js";
import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";

let getStory=async(req,res)=>{
    let user=req.user;
    
    let id=req.params.id;   
    let story=await Story.find({user:id}).populate("user")
    
    let creator=await User.findById(id)
    if(creator.type=="private"){
        if(!creator.following.includes(user.id) && creator._id!=user.id){
            throw new ApiError(400,"you are not allowed to acces it story")
        }
    }
    let response=new ApiResponse(story,200,"getting story succesfully")
    res.status(200).json(response)
}

export default errorHandler(getStory);