import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import OpenAI from "openai";
import connectDB from "./config/database.js";
import getRoomInfo from "./routes/getRoomInfo.js";




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const server = http.createServer(app);

app.use("/",getRoomInfo);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Use a Map to store rooms, where each room has a Set of users and drawing state
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
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
    }

    // Update the current room and user
    currentRoom = roomId;
    currentUser = { id: socket.id, name: userName };

    // Join the new room
    socket.join(roomId);

    // Initialize the room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        drawing: null, // Will store the current drawing state
      });
    }

    // Add the user to the room's Set
    rooms.get(roomId).users.add(currentUser);

    // Notify the room that a new user has joined
    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId).users));
  });

  // Listen for code changes and broadcast them to the room
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  // Listen for the "leaveRoom" event when a user leaves the room
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      // Remove the user from the room's Set
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );

      // Leave the room and reset currentRoom and currentUser
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  // Drawing board events
  socket.on("drawStart", ({ roomId, x, y }) => {
    if (rooms.has(roomId)) {
      socket.to(roomId).emit("remoteDrawStart", { x, y });
    }
  });

  socket.on("draw", ({ roomId, x, y, color, lineWidth, tool }) => {
    if (rooms.has(roomId)) {
      socket.to(roomId).emit("remoteDraw", { x, y, color, lineWidth, tool });
    }
  });

  socket.on("drawEnd", ({ roomId }) => {
    if (rooms.has(roomId)) {
      socket.to(roomId).emit("remoteDrawEnd");
    }
  });

  socket.on("drawClear", ({ roomId }) => {
    if (rooms.has(roomId)) {
      // Clear the drawing state for the room
      rooms.get(roomId).drawing = null;
      socket.to(roomId).emit("remoteDrawClear");
    }
  });

  socket.on("drawUndo", ({ roomId }) => {
    if (rooms.has(roomId)) {
      io.to(roomId).emit("remoteDrawUndo");
    }
  });

  socket.on(
    "remoteShape",
    ({ roomId, shape, startX, startY, endX, endY, color, lineWidth }) => {
      if (rooms.has(roomId)) {
        socket
          .to(roomId)
          .emit("remoteShape", {
            shape,
            startX,
            startY,
            endX,
            endY,
            color,
            lineWidth,
          });
      }
    }
  );

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
      try {
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
        io.to(roomId).emit("codeResponse", response.data);
      } catch (error) {
        console.error("Compilation error:", error);
        io.to(roomId).emit("codeResponse", {
          run: {
            output: "Error compiling code. Please try again.",
            stderr: error.message,
          },
        });
      }
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
          model: "gpt-4o-mini", // Updated to correct model name
          messages: [{ role: "system", content: prompt }],
        });

        io.to(roomId).emit("aiResponse", {
          question,
          response: response.choices[0].message.content,
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

  // Chat room events
  socket.on("chatMessage", ({ roomId, userName, message }) => {
    if (rooms.has(roomId)) {
      const chatData = {
        userName,
        message,
        timestamp: new Date().toISOString(),
      };
      io.to(roomId).emit("chatMessage", chatData);
    }
  });

  // Listen for disconnection events
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      // Remove the user from the room's Set
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
    }
    console.log("User Disconnected", socket.id);
  });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("Database connected Successfully");
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("DataBase cannot be connected");
    console.log(err);
  });
