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

    // console.log("used joined room", roomId);
  });

  /* to show change in code to everyUser */

  socket.on("codeChange", ({roomId, code}) => {
  socket.to(roomId).emit("codeUpdate", code)
  });

  /* leave user  */

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

      socket.leave(currentRoom);

      currentRoom = null;
      currentUser = null;
    }
  });

  /* typing indicator */

  socket.on("typing", ({roomId, userName}) => {
    socket.to(roomId).emit("userTyping", userName)
  })

  /*  to disconnect user   */

  socket.on("disconnect", () => {
    if(currentRoom && currentUser ){
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom))); // notify other user that somebody left the room
    }
    console.log("user Disconnected");
  });
});

const port = process.env.PORT || 5050;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
