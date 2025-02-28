import { io } from "socket.io-client";

export const socket = io("https://chatingfightserver.onrender.com", {
  transports: ["websocket"], // Ensure WebSocket transport is enabled
});
