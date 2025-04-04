// Components/JoinRoom.jsx
import React from "react";
import Logo from "../assets/logo.png";

const JoinRoom = ({ roomId, userName, setRoomId, setUserName, joinRoom }) => {
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomId = '';
    for (let i = 0; i < 20; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
  };
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
    <p className="random-room" onClick={() => setRoomId(generateRoomId()) } >Click to Generate a Randon Room Id</p>
  </div>
</div>
  );
};

export default JoinRoom;