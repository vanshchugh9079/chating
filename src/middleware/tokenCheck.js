import jwt from "jsonwebtoken"
import User from "../models/User.js"
import ApiError from "../utils/ApiError.js"
import errorHandler from "../utils/errorHandler.js"
let tokenCheck=async(req,res,next)=>{
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies["token"];
    if(!token){
        throw new ApiError(401,"plese provide token and login")
    }
   let decoded= await jwt.verify(token, process.env.TOKEN_SECRET)
   let user=await User.findOne({_id: decoded.id,token:token})    
   if(!user){
       throw new ApiError(401,"user not found or invalid token")
   }
   req.user=decoded
   next();
}
export default errorHandler(tokenCheck);