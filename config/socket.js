const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "https://attendance-system-client-dun.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  
  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Join personal room
    socket.on("join-user-room", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`📌 User ${userId} joined room: user-${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initSocket };
