import Story from "../../models/Story.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { cloudinaryUpload } from "../../utils/cloudniaryUpload.js";
import fs from "fs"
import errorHandler from "../../utils/errorHandler.js";
let createStory=async(req,res)=>{
    let user=req.user;
    let media=req.file
    
    if(!user){
        throw new ApiError(401,"unauthorized access")
    }
    if(!media){
        throw new ApiError(400,"plese provide media file")
    }
    let uploadedResult=await cloudinaryUpload(media)
    fs.unlink(media.path,(error)=>{
        if(error) throw new ApiError(500,error.message) 
    })
    let storyObj=await Story.create({
        media:{
            public_id:uploadedResult.public_id,
            url:uploadedResult.url
        },
        user:user.id
    })
    let response=new ApiResponse(storyObj,200,"story added successfully")
    res.status(200).json(response)
}
export default errorHandler(createStory);