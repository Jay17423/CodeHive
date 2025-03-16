import React, { useState, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5050");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript"); // default language as JavaScript
  const [code, setCode] = useState("// start code here ");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState([]);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    // code update functionality
    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    // typing indicator functionality
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`);
      setTimeout(() => setTyping(""), 4000); // empty it after 2 seconds
    });

    // for language change
    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    // cleanup function for socket off
    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  // useEffect to handle room on reload the page

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("theme-transition");
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 300); // Delay for transition effect

    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // useEffect to listen for redirect event

  useEffect(() => {
    const handleRedirect = () => {
      if (joined) {
        // Only update state if needed
        setJoined(false);
        setRoomId("");
        setUserName("");
        setCode("// start code here");
        setLanguage("javascript");
      }
    };

    socket.on("redirectToJoinPage", handleRedirect);

    return () => {
      socket.off("redirectToJoinPage", handleRedirect);
    };
  }, []); 

  /*   function for button onclick   */
  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  /*   function for leave room    */

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    };

  /* function for copy Room Id  */
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  // function to handle the edited code on the code editor
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName }); // typing indicator
  };

  // function to handle the language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          {/* join form  */}

          <h1> Join Code Room </h1>
          {/* Get Room id from the user to join him in that room */}
          <div className="input-container">
            <input
              type="text"
              placeholder="Room Id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>
          {/* get user name */}
          <div className="input-container">
            <input
              type="text"
              placeholder="User Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <button onClick={joinRoom}> Join Room </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="sidebar-content">
          <div className="room-info">
            <h2> Code Room : {roomId} </h2>
            <button className="copy-button" onClick={copyRoomId}>
              Copy Id
            </button>
            {/* if copied then show it  */}
            {copySuccess && <span className="copy-success">{copySuccess}</span>}
          </div>
          <h3>Users in Room</h3>
          <ul>
            {users.map((user, index) => (
              <li key={index}> {user.slice(0, 8)}..</li>
            ))}
          </ul>
          <p className="typing-indicator"> {typing} </p>
          {/* to choose the language of our choice */}
          <select
            className="language-selector"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
          <button className="leave-button" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
        <div className="theme-toggle-container">
          <button className="toggle-dark-mode" onClick={toggleDarkMode}>
            {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height={"100%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme={darkMode ? "vs-dark" : "vs-light"}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
};

export default App;
