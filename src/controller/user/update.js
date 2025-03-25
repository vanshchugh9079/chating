import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { cloudinaryUpload } from "../../utils/cloudniaryUpload.js";
import errorHandler from "../../utils/errorHandler.js";
import fs from "fs";

let update = async (req, res) => {
    let user = req.user;
    let changes = req.body;
    let file = req.file;

    let userObj = await User.findById(user.id);

    if (!userObj) {
        throw new ApiError(404, "User not found");
    }

    let uploadResult = null;
    if (file) {
        try {
            uploadResult = await cloudinaryUpload(file);
            await fs.unlink(file.path,()=>{
                console.log("file deleted")
            }); // Delete local file after upload

            // Update avatar only if a file is uploaded
            userObj.avatar = {
                public_id: uploadResult.public_id,
                url: uploadResult.secure_url
            };
        } catch (error) {
            await fs.unlink(file.path, (err) => {
                if (err)
                    console.log(err);
            });
            throw new ApiError(500, "File upload failed");
        }
    }

    // Update user object fields from request body
    Object.assign(userObj, changes);

    await userObj.save();

    let response = new ApiResponse(userObj, 200, "Your account was updated successfully");
    res.status(200).json(response);
};

export default errorHandler(update);
