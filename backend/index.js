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

const rooms = new Map(); // rooms store

io.on("connection", (socket) => {
  console.log("User Connected",   socket.id);

  let currentRoom = null ;  // initialise current room
  let currentUser = null ;  // initialise current user

  // join instance
  socket.on("join" , ({roomId, userName}) => {
    if(currentRoom){  // if user is already joined in any other room 
      socket.leave(currentRoom) // then had to leave that room
      rooms.get(currentRoom).delete(currentUser)
  
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));// notify to other user of the current room that new user joined
    }

    // if user in not joined in any room then
    currentRoom = roomId;
    currentUser = userName;
    socket.join(roomId)

    // if this room id already exit then
    if(!rooms.has(roomId)){
      rooms.set(roomId , new Set());
    }

    rooms.get(roomId).add(userName)
    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));// notify other users then user joined
  })

  //socket.on("disconnect", () => {  // Extra part later we will remove it
    //console.log("user disconnected");
  //});
})

const port = process.env.PORT || 5050;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
