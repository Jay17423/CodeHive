import React, { useState, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";

const socket = io("http://localhost:5050");

const App = () => {

  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

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
          <button > Join Room </button>

        </div>
      </div>
    );
  }
  return <div>User joined</div>;
};

export default App;
