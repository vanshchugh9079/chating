import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import multer from "multer";
import { upload } from "../middleware/multer.js";
import fs from "fs"
import path from "path";
import { fileTypeFromBuffer } from "file-type"
import { cloudinaryUpload } from "../utils/cloudniaryUpload.js";
/**
 * Registers a user with their socket ID.
 * @param {Socket} socket - The connected socket instance.
 * @param {Map} allUser - A Map of user IDs and their corresponding socket IDs.
 * @param {string} id - The unique ID of the user.
 */

const registerUser = async (socket, allUser, id) => {
  allUser.set(id, socket.id);
  let user = await User.findById(id).populate("follower");
  if (!user) {
    console.log("user not found")
      ;
    return;
  }
  if (user) {
    user.isOnline = true;
  }
  await user.save();
  user.follower.forEach((friend) => {
    let socketId = allUser.get(friend._id.toString());
    if (socketId) {
      socket.to(socketId).emit("online", user)
    }
  })
  socket.on("disconnect", async () => {
    allUser.delete(id);
    user.isOnline = false;
    await user.save()
    user.follower.forEach((friend) => {
      let socketId = allUser.get(friend._id.toString());
      if (socketId) {
        socket.to(socketId).emit("offline", user)
      }
    })
  });
};

/**
 * Sends a message to all members in a chat.
 * @param {Socket} socket - The connected socket instance.
 * @param {Map} allUser - A Map of user IDs and their corresponding socket IDs.
 * @param {string} chatId - The ID of the chat room.
 * @param {string} content - The message content.
 */
const messageUser = async (socket, allUser, chatId, content, attachment) => {
  console.log(attachment);
  
  try {
    const chat = await Chat.findById(chatId).populate("people");
    if (!chat || !chat.people.length) {
      console.error("Chat or people not found");
      return;
    }


    const sender = Array.from(allUser.entries()).find(([, val]) => val === socket.id)?.[0];
    if (!sender) {
      console.error("Sender not found");
      return;
    }
    let { name: sendName } = await User.findById(sender)
    
    let notification = await Notification.create({
      type: "message",
      content: sendName + "create new message",
      user: sender
    })
    let message = await Message.create({
      content,
      createdBy: sender,
      chat: chatId,
      attachment:{
        url: attachment?.url || null,
        public_id: attachment?.public_id || null
      }
    });
    message = await Message.findById(message._id).populate("createdBy");
    chat.message.push(message._id);
    await chat.save();
    chat.people.forEach((user) => {
      const socketId = allUser.get(user._id.toString());
      if (socketId && socketId !== socket.id) {
        (async () => {
          let userObj = await User.findById(user._id);
          if (userObj) {
            userObj.notification.push(notification)
            await userObj.save()
          }
        })()
        socket.to(socketId).emit("message-recieved", { message, createdBy: sender, notification });
      }
    });
    socket.emit("message-recieved-success", { message, createdBy: sender });
  } catch (error) {
    console.error("Error in messageUser function:", error.message);
  }
};
/**
 * Creates a new chat and notifies participants.
 * @param {Socket} socket - The connected socket instance.
 * @param {Map} allUser - A Map of user IDs and their corresponding socket IDs.
 * @param {Object} chat - The chat details.
 */
const createChat = async (socket, allUser, chat) => {
  const receiver = chat.people.filter((user) => allUser.get(user) !== socket.id);
  const { name } = await User.findById(chat.createdBy);

  receiver.forEach((user) => {
    const newChat = { ...chat, name };
    socket.to(allUser.get(user)).emit("chat-created", newChat);
  });

  socket.emit("chat-created", chat);
};

/**
 * Follows a user.
 * @param {Socket} socket - The connected socket instance.
 * @param {Map} allUser - A Map of user IDs and their corresponding socket IDs.
 * @param {string} userId - The ID of the user to be followed.
 * @param {string} id - The ID of the current user.
 */
const follow = async (socket, allUser, userId, id) => {
  try {
    const user = await User.findById(userId);
    const you = await User.findById(id);

    if (!user) throw new Error("User not found");

    user.follower.push(id);
    await user.save();

    if (you?.following) {
      you.following.push(userId);
      await you.save();
    }
    let notification = await Notification.create({
      type: "follow",
      content: `${you.name} started following you`,
      user: userId,
      on: "profile",
      profile: you._id
    })
    user.notification.push(notification)
    await user.save();
    socket.to(allUser.get(userId)).emit("follow", {
      user: user,
      notification: notification
    });
    socket.emit("follow-success", user);
  } catch (error) {
    console.error("Error in follow function:", error.message);
  }
};

/**
 * Unfollows a user.
 * @param {Socket} socket - The connected socket instance.
 * @param {Map} allUser - A Map of user IDs and their corresponding socket IDs.
 * @param {string} userId - The ID of the user to be unfollowed.
 * @param {string} id - The ID of the current user.
 */
const unFollow = async (socket, allUser, userId, id) => {
  try {
    const user = await User.findById(userId);
    const you = await User.findById(id);

    if (!user) throw new Error("User not found");

    user.follower = user.follower.filter((element) => element.toString() !== id);
    await user.save();
    let notification = await Notification.create({
      type: "information",
      content: `${you.name} unfollow  you`,
      user: you._id,
      on: "profile",
      profile: you._id
    })
    user.notification.push(notification)
    await user.save();
    socket.to(allUser.get(userId)).emit("follow", {
      user: you,
      notification: notification
    });
    if (you?.following) {
      you.following = you.following.filter((element) => element.toString() !== userId);
      await you.save();
    }

    socket.to(allUser.get(userId)).emit("unfollow", {
      user: user,
      notification: notification
    });
    socket.emit("unfollow-success", "You successfully unfollowed");
  } catch (error) {
    console.error("Error in unFollow function:", error.message);
  }
};

/**
 * Sends a follow request.
 * @param {Socket} socket - The connected socket instance.
 * @param {Map} allUser - A Map of user IDs and their corresponding socket IDs.
 * @param {string} userId - The ID of the user to send the request to.
 * @param {string} id - The ID of the current user.
 */
const sendRequest = async (socket, allUser, userId, id) => {
  try {
    const user = await User.findById(userId);
    const you = await User.findById(id);

    if (!user) throw new Error("User not found");

    user.request.push(id);
    await user.save();
    let notification = await Notification.create({
      type: "request",
      content: `${you.name} request  you`,
      user: you._id,
      on: "profile",
      profile: you._id
    })
    user.notification.push(notification._id)
    await user.save();
    notification = await Notification.findById(notification._id).populate("user");
    socket.to(allUser.get(userId)).emit("follow-request", {
      user: you,
      notification: notification
    });
    socket.emit("requested", user);
  } catch (error) {
    console.error("Error in sendRequest function:", error.message);
  }
};

/**
 * Accepts or declines a follow request.
 * @param {Socket} socket - The connected socket instance.
 * @param {Map} allUser - A Map of user IDs and their corresponding socket IDs.
 * @param {string} userId - The ID of the requesting user.
 * @param {string} id - The ID of the current user.
 * @param {boolean} accept - Whether to accept the request.
 */
const acceptRequest = async (socket, allUser, userId, id, accept) => {
  try {
    // Fetch users
    const user = await User.findById(userId);
    const you = await User.findById(id).populate("notification");

    if (!user || !you) throw new Error("User or request sender not found");

    // Handle notification creation
    const notification = await Notification.create({
      type: "information",
      content: `${you.name} ${accept ? "accepted" : "rejected"} your follow request`,
      user: userId,
      on: "profile",
      profile: you._id,
    });

    // Remove the original request notification
    you.notification = you.notification.filter(
      (e) => !(e.type === "request" && e.user.toString() === userId)
    );
    let yourNotification = await Notification.findOne({ type: "request", user: userId }).populate("user");
    await Notification.findOneAndDelete({ type: "request", user: userId });

    if (!accept) {
      // Handle rejection case

      you.request = you.request.filter((reqId) => reqId.toString() !== userId);
      await you.save();

      socket.to(allUser.get(userId)).emit("decline-request", {
        user: you,
        notification,
      });
      socket.emit("decline-request-success", {
        user,
        notification: yourNotification,
      });
      return;
    }

    // Handle acceptance case
    you.request = you.request.filter((reqId) => reqId.toString() != user._id);
    you.follower.push(userId);
    await you.save();

    user.following.push(id);
    user.notification.push(notification);
    await user.save();

    socket.to(allUser.get(userId)).emit("accept-request", {
      user: you,
      notification,
    });
    socket.to(allUser.get(userId)).emit("follow-success", {
      user,
      notification,
    });
    socket.emit("accept-request-success", {
      user,
      notification: yourNotification,
    });
  } catch (error) {
    console.error("Error in acceptRequest function:", error.message);
    socket.emit("error", { message: "Failed to process request." });
  }
};
const readNoti = async (socket, data) => {
  data.forEach(async (noti) => {
    let notification = await Notification.findById(noti._id).populate("user")
    notification.seen = true
    data.seen = true;
    await notification.save()
  })
  socket.emit("read-notification", data)
}
export { registerUser, messageUser, createChat, follow, unFollow, sendRequest, acceptRequest, readNoti };
