import http from "http";
import { Server } from "socket.io";
import dbConnect from "./src/database/dbConnect.js";
import app from "./src/app.js";
import { messageUser, registerUser,createChat, follow, unFollow, sendRequest, acceptRequest, readNoti } from "./src/socket/controller.js";
import { getYourStory, storyAdd } from "./src/socket/storyController.js";
import { likedController } from "./src/socket/likedController.js";
import { commentOnPost, commentOnReel } from "./src/socket/commentController.js";
import { aiChat } from "./src/socket/aiChat.js";
import { callAccept, callController, callOnAccept } from "./src/socket/callController.js";
// Environment variables
const PORT = process.env.PORT || 4000;

// Graceful shutdown flag
let isShuttingDown = false;

// Function to start the server
let allUser = new Map();
const startServer = async () => {
  try {
    // Connect to the database
    await dbConnect();
    console.log("Database connected successfully");
    // Create an HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO with CORS configuration
    const io = new Server(server, {
      cors: {
        origin: "https://chatfight.netlify.app",
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
    });
    // Socket.IO connection handling
    io.on("connection", (socket) => {
      if (isShuttingDown) {
        socket.disconnect(true);
        return;
      }
      console.log(`New client connected: ${socket.id}`);
      socket.on("register", (id) => {
        registerUser(socket, allUser, id);
      })
      socket.on("message",({chatId,content,attachment})=>{
        messageUser(socket, allUser, chatId,content,attachment);
      })
      socket.on("create-chat",(chat)=>{
        createChat(socket,allUser,chat)
      })
      socket.on("follow",(obj)=>{
        follow(socket,allUser,obj.userId,obj.id);
      })
      socket.on("unfollow",(obj)=>{
        unFollow(socket,allUser,obj.userId,obj.id);
      })
      socket.on("send-request",(obj)=>{
        sendRequest(socket,allUser,obj.userId,obj.id)
      })
      socket.on("accept-request",(obj)=>{
        acceptRequest(socket,allUser,obj.userId,obj.id,obj.accept)
      })
      socket.on("read-notification",(data)=>{
        readNoti(socket,data)
      })
      socket.on("ai-chat",({message,id,chatId})=>{
        aiChat(socket,message,id,chatId)
      })

      socket.on("story-added",(obj)=>{
        storyAdd(socket,allUser,obj.story,obj.id)
      })
      socket.on("liked-post",(obj)=>{
        likedController(socket,allUser,obj.post,obj.id,obj.liked,obj.type)
      })
      socket.on("comment-post",(obj)=>{
          commentOnPost(socket,allUser,obj.post,obj.id,obj.content)
      })
      socket.on("comment-reel",(obj)=>{
          commentOnReel(socket,allUser,obj.post,obj.id,obj.content)
      })
      socket.on("call",(obj)=>{
        callController(socket,allUser,obj.reciverId,obj.id)
      })
      socket.on("call-accept",(obj)=>{
        callAccept(socket,allUser,obj.callId,obj.accepted)
      })
      socket.on("send-offer",(obj)=>{
        callOnAccept(socket,allUser,obj.callId,obj.offer)
      })
      // Event: disconnect
      socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${socket.id}. Reason: ${reason}`);
      });

      // Handle errors in the socket
      socket.on("error", (error) => {
        console.error(`Error on socket ${socket.id}:`, error.message);
      });
    });

    // Start the HTTP server
    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("SIGINT received. Shutting down server...");
      isShuttingDown = true;

      io.close(() => {
        console.log("Socket.IO server closed");
      });

      server.close(async () => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down server...");
      isShuttingDown = true;
      io.close(() => {
        console.log("Socket.IO server closed");
      });
      server.close(async () => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1); // Exit the process with an error code
  }
};

// Start the server
startServer();
