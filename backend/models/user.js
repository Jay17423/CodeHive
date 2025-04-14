import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    members: {
      type: [String],
      default: [],
    },
    code: {
      type: String,
      default: "",
    },
    codeLanguage: {
      type: String,
      default: "javascript",
    },
    chats: {
      type: [
        {
          user: String,
          message: String,
          time: Date,
        },
      ],
      default: [],
    },
    codeOutput: {
      type: [
        {
          output: String,
          time: Date,
        },
      ],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
