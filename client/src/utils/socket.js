// client/src/utils/socket.js
import { io } from "socket.io-client";

let socket = null;

export function initSocket(token) {
  if (socket) return socket;
  socket = io("http://localhost:5000", {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => console.log("🔌 Socket connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));
  socket.on("connect_error", (err) => console.error("Socket error:", err.message));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
