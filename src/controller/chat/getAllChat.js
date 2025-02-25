import Chat from "../../models/Chat.js";
import User from "../../models/User.js";
import ApiResponse from "../../utils/ApiResponse.js";

let getAllChat = async (req, res) => {
    try {
        const user = req.user;

        // Ensure user is authenticated
        if (!user || !user.id) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        // Query the database for chats involving the user
        let yourChats = await Chat.find({ people: { $in: [user.id] } }).populate("people","isOnline _id");

        // Respond with the filtered chats
        yourChats = await Promise.all(
            yourChats.map(async (chat) => {
                if (!chat.groupChat && chat.createdBy != user.id) {
                    const user = await User.findById(chat.createdBy);
                    if (user) {
                        chat.name = user.name;
                    } else {
                        chat.name = "Unknown User"; // Fallback if the user is not found
                    }
                }
                return chat;
            })
        );
        let response = new ApiResponse(yourChats, 200, "getting chat succesfully")
        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export default getAllChat;
