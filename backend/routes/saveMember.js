import express from "express";
import Room from "../models/RoomModel.js"

const router = express.Router();

router.post("/addMember", async (req, res) => {
  try {
    const { userName, roomId } = req.body;
    console.log(userName,roomId);
    
    if (!roomId || !userName || userName.length === 0) {
      return res.status(400).json({ message: "Room ID or user data not provided." });
    }

    const roomData = await Room.findOne({ roomId });
    // console.log(roomData);
    

    if (!roomData) {
      return res.status(404).json({ message: "Room not found." });
    }
    userName.forEach(user => {
      if (!roomData.members.includes(user)) {
        roomData.members.push(user);
      }
    });
    
    await roomData.save();

    res.status(200).json({ message: "Members added successfully.", roomData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
