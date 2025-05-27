import { Server } from "socket.io";

const onlineUsers = new Map();

export default function socketHandle(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(socket.id);
    socket.on("new user", (data) => {
      const { message, userName } = data;
      onlineUsers.set(userName, {
        socketId: socket.id,
      });
      console.log(message, userName);
    });
    socket.on("disconnect", () => {
      console.log("user disconnect" + socket.id);
      for (const [key, value] of onlineUsers.entries()) {
        if (socket.id === value.socketId) {
          console.log(key);

          onlineUsers.delete(key);
        }
        console.log(onlineUsers, "finals");

        break;
      }
    });
    socket.emit("new notification", {
      message: socket.id + "is joined",
    });
  });

  return io;
}
