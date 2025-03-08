import chat from "../../models/Chat.js";
import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";

let getChat = async (req, res) => {
    let chatId = req.params.id;
    let user = req.user;
    let chatObj = await chat.findById(chatId)
        .populate({
            path: "message",
            populate: {
                path: "createdBy",
                select: "name avatar"
            }
        })
        .populate("people", "isOnline name avatar");
    if (!chatObj) {
        throw new ApiError(404, "chat not found")
    }
    if (chatObj.createdBy != user.id && !chatObj.groupChat && chatObj.people.length>1) {
        let { name, avatar } = await User.findById(chatObj.createdBy);
        chatObj.name = name;
        chatObj.avatar = avatar
    }    
    let response = new ApiResponse(chatObj, 200, "getting chat succesfully")
    res.status(200).json(response)
}
export default errorHandler(getChat);