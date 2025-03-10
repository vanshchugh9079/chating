import { populate } from "dotenv";
import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";
import jsonResponse from "../../utils/jsonResponse.js";

let login = async (req, res) => {    
        let enterSource = req.body.name || req.body.email || req.body.phone;
        let password = req.body.password;  // Retrieve password from request body
        if(!enterSource){
            throw new ApiError(400,"plese enter name or email or Mobile-no")
        }
        if(!password){
            throw new ApiError(400,"plese enter password")
        }
        // Find user by email, name, or phone
        let user = await User.findOne({
            $or: [
                { email: enterSource },
                { name: enterSource },
                { phone: enterSource }
            ]
        }).populate("notification savedPost savedReel reel post follower following").populate({
            path: "savedPost",
            populate: {
                path: "comment",
                populate:{
                    path:"createdBy",
                }
            }
        }).populate({
            path: "savedReel",
            populate: {
                path: "comment",
                populate:{
                    path:"createdBy",
                }
            }
        });        
        if (!user) {
            throw new ApiError(404, `User not found:`);
        }

        // Check if the password matches
        let isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            throw new ApiError(401, "Invalid password");
        }
        // Generate token and prepare response
        let sanitizedUser = await jsonResponse(user);
        user.isOnline=true;
        await user.save();
        let response = new ApiResponse(sanitizedUser, 200, "Login successfully");
        // Send response
        res.cookie("token",response.data.token);
        res.status(response.status).json(response);
};
export default errorHandler(login);
