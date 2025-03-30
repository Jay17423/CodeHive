import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Use a Map to store rooms, where each room has a Set of users
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  let currentRoom = null;
  let currentUser = null;

  // Listen for the "join" event when a user joins a room
  socket.on("join", ({ roomId, userName }) => {
    // If the user is already in a room, leave it and remove the user from the room's Set
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    // Update the current room and user
    currentRoom = roomId;
    currentUser = { id: socket.id, name: userName }; // Store user as an object with ID and name

    // Join the new room
    socket.join(roomId);

    // Initialize the room's Set if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    // Add the user to the room's Set
    rooms.get(roomId).add(currentUser);

    // Notify the room that a new user has joined
    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });

  // Listen for code changes and broadcast them to the room
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  // Listen for the "leaveRoom" event when a user leaves the room
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      // Remove the user from the room's Set
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

      // Leave the room and reset currentRoom and currentUser
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  // Listen for typing events and broadcast them to the room
  socket.on("userTyping", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  // Listen for language changes and broadcast them to the room
  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  // Listen for code compilation requests
  socket.on("compileCode", async ({ code, roomId, language, version }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const response = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language,
          version,
          files: [
            {
              content: code,
            },
          ],
        }
      );

      // Store the output in the room and broadcast it
      room.output = response.data.run.output;
      io.to(roomId).emit("codeResponse", response.data);
    }
  });

  // Listen for AI assistance requests
  socket.on("askAI", async ({ roomId, question, code }) => {
    if (rooms.has(roomId)) {
      try {
        const prompt = `
          You are a coding assistant. A user has written the following code:\n\n
          "${code}"\n\n
          They have asked: "${question}".\n
          Please analyze the code and give a response according to the question asked to you point-wise.
          Also, give best practices on how to write the code.
        `;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Use the correct model name
          messages: [{ role: "system", content: prompt }],
        });

        // Broadcast the AI response to the room
        io.to(roomId).emit("aiResponse", {
          question,
          response: response.choices[0].message.content,
          // console.log(response.choices[0].message.content);
        });
      } catch (error) {
        console.error("Error calling OpenAI API:", error);
        io.to(roomId).emit("aiResponse", {
          question,
          response: "Failed to get AI response. Please try again.",
        });
      }
    }
  });

  // chat room

  socket.on("chatMessage", ({ roomId, userName, message }) => {
  const chatData = { userName, message, timestamp: new Date().toISOString() };
  io.to(roomId).emit("chatMessage", chatData);
  });


  // Listen for disconnection events
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      // Remove the user from the room's Set
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
    console.log("User Disconnected", socket.id);
  });
});






const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

