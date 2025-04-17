import Room from '../models/RoomModel.js';

export const saveRoomData = async (roomId, data) => {
  try {
    const roomData = {
      roomId,
      ...data,
      lastUpdated: new Date()
    };

    return await Room.findOneAndUpdate(
      { roomId },
      roomData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error(`Error saving room ${roomId}:`, error);
    throw error;
  }
};

export const getRoomData = async (roomId) => {
  try {
    return await Room.findOne({ roomId }).lean();
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    throw error;
  }
};

export const cleanupInactiveRooms = async (inactiveDays = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
    
    const result = await Room.deleteMany({
      lastUpdated: { $lt: cutoffDate }
    });
    
    return {
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} inactive rooms`
    };
  } catch (error) {
    console.error("Error cleaning up inactive rooms:", error);
    throw error;
  }
};