import { io } from "socket.io-client";

export const socket = io("http://localHost:3000", {
  transports: ["websocket"], // Ensure WebSocket transport is enabled
});
