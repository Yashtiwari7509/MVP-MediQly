import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import { setupSocketIO } from "./chat/chathandler.controller.js";

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

setupSocketIO(server);

server.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`server running on PORT ${PORT}`);
  }
});
