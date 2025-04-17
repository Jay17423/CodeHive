import express from "express";
import Room from "../models/RoomModel.js";

const router = express.Router();

// New endpoint to get room data by ID
router.post("/get-room", express.json(), async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const roomData = await Room.findOne({ roomId });
    if (!roomData) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.json(roomData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching room data", error });
  }
});

export default router;