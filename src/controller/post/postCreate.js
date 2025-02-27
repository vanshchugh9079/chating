import PostModel from "../../models/Post.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { cloudinaryUpload } from "../../utils/cloudniaryUpload.js";
import errorHandler from "../../utils/errorHandler.js";
import fs from "fs"
let postCreate=async(req,res)=>{
    let user = req.user;
    let media=req.file
    if(!media){
        throw new ApiError(400,"plese provide media file")
    }
    let people=[...[],...req.body.people?req.body.people:[]];
    let uploadedResult=await cloudinaryUpload(media)
    
    fs.unlink(media.path,(error)=>{
        if(error) throw new ApiError(500,error.message) 
    })
    let postObj={
        createdBy:user.id,
        media:{
            public_id:uploadedResult.public_id,
            url:uploadedResult.url
        },
        people:people
    }
    let post=await PostModel.create(postObj)
    let response=new ApiResponse(post,200,"post added successfully")
    res.status(200).json(response)
}
export default errorHandler(postCreate);