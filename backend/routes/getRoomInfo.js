import express from "express";
import RoomModel from "../models/room.js";

const router = express.Router();

router.post("/getRoomInfo", async (req, res) => {
  try {
    const { roomId, name } = req.body;
    const info = new RoomModel({ roomId, members: [name] });
    const roomInfo = await info.save();
    res.status(200).json(roomInfo);
  } catch (error) {
    console.error("Error saving room info:", error);
    res
      .status(500)
      .json({ message: "Failed to save room info", error: error.message });
  }
});

export default router;
