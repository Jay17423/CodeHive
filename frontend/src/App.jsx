import React, { useState, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";

const socket = io("http://localhost:5050");

const App = () => {

  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  // function for button onclick 
  const joinRoom = () =>{
    if( roomId && userName ){
      socket.emit("join", {roomId, userName});
      setJoined(true);
    }
  };

  // function for copy Room Id

  const copyRoomId = () =>{

  };

  if( !joined ){
    return (
      <div className="join-container">
        <div className="join-form">
          {/* join form  */}

          <h1> Join Code Room </h1>
          {/* Get Room id from the user to join him in that room */}
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          {/* get user name */}
          <input
            type="text"
            placeholder="User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}> Join Room </button>

        </div>
      </div>
    );
  }
  return (
    <div className="edito-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room :{roomId}</h2>
          <button onClick={copyRoomId}>Copy Id</button>
        </div>
        <h3>User in Room:</h3>
        <ul>
          <li> Ram</li>
          <li> Krishna</li>
        </ul>
        <p className="typing-indicator"> User typing... </p>

      </div>
    </div>
  )
};

export default App;
