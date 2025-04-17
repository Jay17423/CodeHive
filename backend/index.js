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
import {
  saveRoomData,
  getRoomData,
  cleanupInactiveRooms,
} from "./service/roomService.js";
import { log } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const server = http.createServer(app);

app.use("/", getRoomInfo);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Use a Map to store rooms, where each room has a Set of users and other data
const rooms = new Map();

// Set up periodic saving (every minute)
setInterval(async () => {
  console.log("Saving all rooms data...");
  for (const [roomId, roomData] of rooms.entries()) {
    const dataToSave = {
      code: roomData.code || "",
      language: roomData.language || "javascript",
      version: roomData.version || "*",
      consoleText: roomData.consoleText || "",
      messages: roomData.messages || [],
      drawingState: roomData.drawing || null,
      users: Array.from(roomData.users || []).map((user) => user.name),
    };

    await saveRoomData(roomId, dataToSave);
  }
}, 60 * 1000);

// Cleanup inactive rooms (runs daily at 3 AM)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 3 && now.getMinutes() === 0) {
    cleanupInactiveRooms();
  }
}, 60 * 1000); // Check every minute

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  let currentRoom = null;
  let currentUser = null;

  // Handle typing event
  socket.on("userTyping", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", { userName });
  });

  // Listen for the "join" event when a user joins a room
  socket.on("join", async ({ roomId, userName }) => {
    // If the user is already in a room, leave it
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
      await saveRoomData(currentRoom, {
        users: Array.from(rooms.get(currentRoom).users).map(
          (user) => user.name
        ),
      });
    }

    // Update the current room and user
    currentRoom = roomId;
    currentUser = { id: socket.id, name: userName };

    // Join the new room
    socket.join(roomId);

    // Initialize the room if it doesn't exist
    if (!rooms.has(roomId)) {
      // Try to load from database first
      const existingRoom = await getRoomData(roomId);
      if (existingRoom) {
        rooms.set(roomId, {
          users: new Set(),
          code: existingRoom.code || "",
          language: existingRoom.language || "javascript",
          version: existingRoom.version || "*",
          consoleText: existingRoom.consoleText || "",
          messages: existingRoom.messages || [],
          drawing: existingRoom.drawingState || null,
        });
      } else {
        rooms.set(roomId, {
          users: new Set(),
          code: "",
          language: "javascript",
          version: "*",
          consoleText: "",
          messages: [],
          drawing: null,
        });
      }
    }

    // Add the user to the room's Set
    rooms.get(roomId).users.add(currentUser);

    // Send existing data to the new user
    if (rooms.get(roomId).code) {
      socket.emit("codeUpdate", rooms.get(roomId).code);
    }
    if (rooms.get(roomId).messages && rooms.get(roomId).messages.length > 0) {
      rooms.get(roomId).messages.forEach((msg) => {
        socket.emit("chatMessage", msg);
      });
    }

    // Notify the room that a new user has joined
    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId).users));
    await saveRoomData(roomId, {
      users: Array.from(rooms.get(roomId).users).map((user) => user.name),
    });
  });

  // Listen for code changes and broadcast them to the room
  socket.on("codeChange", async ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      await saveRoomData(roomId, { code });
    }
    socket.to(roomId).emit("codeUpdate", code);
  });

  // Listen for the "leaveRoom" event when a user leaves the room
  socket.on("leaveRoom", async () => {
    if (currentRoom && currentUser) {
      // Remove the user from the room's Set
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
      await saveRoomData(currentRoom, {
        users: Array.from(rooms.get(currentRoom).users).map(
          (user) => user.name
        ),
      });

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

  socket.on("drawEnd", async ({ roomId }) => {
    if (rooms.has(roomId)) {
      // In a real implementation, you'd capture the drawing state here
      rooms.get(roomId).drawing = { exists: true };
      await saveRoomData(roomId, { drawingState: rooms.get(roomId).drawing });
      socket.to(roomId).emit("remoteDrawEnd");
    }
  });

  socket.on("drawClear", async ({ roomId }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).drawing = null;
      await saveRoomData(roomId, { drawingState: null });
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
        socket.to(roomId).emit("remoteShape", {
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

  // Listen for language changes and broadcast them to the room
  socket.on("languageChange", async ({ roomId, language }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      await saveRoomData(roomId, { language });
    }
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

        rooms.get(roomId).consoleText = response.data.run.output;
        await saveRoomData(roomId, { consoleText: response.data.run.output });
        io.to(roomId).emit("codeResponse", response.data);
      } catch (error) {
        console.error("Compilation error:", error);
        const errorOutput = "Error compiling code. Please try again.";
        rooms.get(roomId).consoleText = errorOutput;
        await saveRoomData(roomId, { consoleText: errorOutput });
        io.to(roomId).emit("codeResponse", {
          run: {
            output: errorOutput,
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
          model: "gpt-4o-mini", 
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
  socket.on("chatMessage", async ({ roomId, userName, message }) => {
    if (rooms.has(roomId)) {
      const chatData = {
        userName,
        message,
        timestamp: new Date(),
      };

      if (!rooms.get(roomId).messages) {
        rooms.get(roomId).messages = [];
      }
      rooms.get(roomId).messages.push(chatData);
      await saveRoomData(roomId, { messages: rooms.get(roomId).messages });

      io.to(roomId).emit("chatMessage", chatData);
    }
  });

  // Listen for disconnection events
  socket.on("disconnect", async () => {
    if (currentRoom && currentUser) {
      // Remove the user from the room's Set
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users)
      );
      await saveRoomData(currentRoom, {
        users: Array.from(rooms.get(currentRoom).users).map(
          (user) => user.name
        ),
      });
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
