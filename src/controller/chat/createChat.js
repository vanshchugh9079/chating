import Chat from "../../models/Chat.js";
import User from "../../models/User.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import errorHandler from "../../utils/errorHandler.js";

const createChat = async (req, res) => {
  const user = req.user;
  let { people , name ,groupChat} = req.body;
// Validate input
if (!people || !Array.isArray(people) || people.length < 1) {
  throw new ApiError(400, "Please provide at least one user to chat with");
}

// Ensure uniqueness and add the current user's ID
people = [...new Set([user.id, ...people])];

// Validate user IDs exist in the database
const validUsers = await User.find({ _id: { $in: people } });
if (validUsers.length !== people.length) {
  throw new ApiError(400, "Some user IDs are invalid");
}

// Check if a chat with the same people already exists
const existingChat = await Chat.findOne({
  people: { $all: people, $size: people.length },
});
if (existingChat && !groupChat) {
  return res.status(209).json(
    new ApiResponse(existingChat, 209, "Chat already exists")
  );
}
// Determine the chat name based on participants (excluding the current user)
let avatar=validUsers
.filter((u) => u.id !== user.id)
.map((u) => u.avatar);
const recipientNames = validUsers
  .filter((u) => u.id !== user.id)
  .map((u) => u.name);
const chatName = recipientNames.join(", ") || "Chat";
// Create the chat document
const chat = await Chat.create({
  name: name || chatName,
  groupChat:groupChat || false, // Check if the chat is a group chat,
  people,
  messages: [],
  createdBy: user.id,
  avatar:avatar[0] || null, // Set the first avatar as the default avatar for the chat
});

// Respond with success
const response = new ApiResponse(chat, 200, "Chat created successfully");
res.status(200).json(response);
};

export default errorHandler(createChat);
