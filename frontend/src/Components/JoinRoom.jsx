// Components/JoinRoom.jsx
import React from "react";
import Logo from "../assets/logo.png";

const JoinRoom = ({ roomId, userName, setRoomId, setUserName, joinRoom }) => {
  return (
    <div className="join-container">
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
    <button onClick={joinRoom}>Join Room</button>
  </div>
</div>
  );
};

export default JoinRoom;