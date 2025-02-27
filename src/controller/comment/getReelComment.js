import ApiResponse from "../../utils/ApiResponse.js";
import Reel from "../../models/Reel.js"
import ApiError from "../../utils/ApiError.js";
import errorHandler from "../../utils/errorHandler.js";
let getReelComment=async (req,res)=>{
    let user=req.user;
    let postId=req.params.id;
    let post=await Reel.findById(postId).populate("createdBy","type _id follower comment")
    if(!post){
        throw new Error("post not found")
    }
    if(post.createdBy.type=="private"){
        if(!post.createdBy.follower.includes(user.id) && post.createdBy._id!=user.id){
            throw new ApiError(404,"you are not allowed to acces it post")
        }
    }
    let response=new ApiResponse(post.comment,204,"getting comment successfully")
    res.status(200).json(response)
}
export default errorHandler(getReelComment);
