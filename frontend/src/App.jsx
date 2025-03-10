import React, { useState, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from '@monaco-editor/react'


const socket = io("http://localhost:5050");

const App = () => {

  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");  // default language as JavaScript
  const [code, setCode] = useState("");
  const [copySuccess, setCopySuccess] = useState("");


  // function for button onclick 
  const joinRoom = () =>{
    if( roomId && userName ){
      socket.emit("join", {roomId, userName});
      setJoined(true);
    }
  };


  // function for copy Room Id
  const copyRoomId = () =>{
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };


  // function to handle the edited code on the code editor
  const handleCodeChange = (newCode) =>{
    setCode(newCode);
  }


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
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room :{roomId}</h2>
          <button className="copy-button" onClick={copyRoomId}>Copy Id</button>
          { copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>Users in Room</h3>
        <ul>
          <li> Ram </li>
          <li> Krishna </li>
        </ul>
        <p className="typing-indicator"> User typing... </p>
        <select className="language-selector">
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
        <button className="leave-button">Leave Room</button>
      </div>
      <div className="editor-wrapper">
        <Editor 
          height= {"100%"}
          defaultLanguage= {language}
          language= {language}
          value= {code}
          onChange= {handleCodeChange}
          theme= "vs-dark"
          options ={
            {
              minimap: { enabled: false },
              fontSize: 14,
            }}
        />
      </div>
    </div>
  );
};

export default App;
