import Logo from "../assets/logo.png";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const JoinRoom = ({ roomId, userName, setRoomId, setUserName, joinRoom }) => {
  const generateRoomId = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let roomId = "";
    for (let i = 0; i < 20; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
  };

  const handleJoinRoom = () => {
    if (roomId.length > 40) {
      toast.error("Room ID must be 40 characters or less");
      return;
    }

    if (userName.length > 20) {
      toast.error("Username must be 20 characters or less");
      return;
    }

    if (!roomId.trim() || !userName.trim()) {
      toast.warning("⚠️ Both fields are required");
      return;
    }

    joinRoom();
  };

  return (
    <div className="join-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="join-form">
        <img className="logo" src={Logo} alt="Logo" />
        <h1>Join Code Room</h1>
        <input
          type="text"
          placeholder="Room Id"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Join Room</button>
        <p className="random-room" onClick={() => setRoomId(generateRoomId())}>
          🔄 Click to Generate a Random Room ID
        </p>
      </div>
    </div>
  );
};

export default JoinRoom;
