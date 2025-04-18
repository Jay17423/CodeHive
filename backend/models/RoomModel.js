import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    set: (value) => value.length > 20 ? value.slice(0, 20) : value
  },
  members:{
    type: [String],
    default: []
  },
  code: {
    type: String,
    default: ""
  },
  language: {
    type: String,
    default: "javascript"
  },
  version: {
    type: String,
    default: "*"
  },
  consoleText: {
    type: String,
    default: ""
  },
  messages: [{
    userName: String,
    message: String,
    timestamp: Date
  }],
  drawingState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);