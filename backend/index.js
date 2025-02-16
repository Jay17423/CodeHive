import express from "express"
import http from "http"
import { Server } from "socket.io"

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

io.on("connection", (socket) => {
  console.log("User Connected",socket.id);
  socket.on("disconnect", () => {  // Extra part later we will remove it
    console.log("user disconnected");
  });
})

const port = process.env.PORT || 5050;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
