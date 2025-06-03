import { io } from "socket.io-client";

export const socket = io("https://chating-chhi.onrender.com", {
  transports: ["websocket"], // Ensure WebSocket transport is enabled
});
