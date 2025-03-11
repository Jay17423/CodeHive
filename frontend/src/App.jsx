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
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState([]);
  
  useEffect( () => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    // code update functionality
    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    }) 

    // typing indicator functionality
    socket.on("userTyping", (user)=>{
      setTyping(`${user.slice(0, 8)}... is Typing`)
      setTimeout(()=> setTyping(""), 6000); // empty it after 2 seconds
    });
  
    // cleanup function for socket off
    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
    };
  }, []);

  // useEffect for

  useEffect( ()=> {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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
    socket.emit("codeChange", {roomId, code: newCode});
    socket.emit("typing", {roomId, userName});  // typing indicator
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
          <h2> Code Room :{roomId} </h2>
          <button className="copy-button" onClick={copyRoomId}> Copy Id </button>
          {/* if copied then show it  */}
          { copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>Users in Room</h3>
        <ul>
          {
            users.map((user, index) => (
              <li key={index}> {user.slice(0,8)}..</li>
            ))
          }
        </ul>
        <p className="typing-indicator"> {typing} </p>
        { /* to choose the language of our choice */}
        <select 
          className="language-selector" 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          >
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
          options ={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
        />
      </div>
    </div>
  );
};

export default App;
