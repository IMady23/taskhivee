import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // Join team room for real-time updates
    socket.on("join:team", (teamId) => {
      socket.join(teamId);
      console.log(`👥 Socket ${socket.id} joined team room: ${teamId}`);
    });

    // Leave team room
    socket.on("leave:team", (teamId) => {
      socket.leave(teamId);
      console.log(`👋 Socket ${socket.id} left team room: ${teamId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
