import { io } from "socket.io-client";

export const socket = io("http://192.168.29.73:3000", {
  transports: ["websocket"], // Ensure WebSocket transport is enabled
});
