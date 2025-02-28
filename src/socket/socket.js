import { io } from "socket.io-client";

export const socket = io("https://chatfightserver.onrender.com", {
  transports: ["websocket"], // Ensure WebSocket transport is enabled
});
