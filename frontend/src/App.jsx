import React, { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { setCode, setLanguage, setRoomId } from "./Slice/CodeSlice";
import JoinRoom from "./Components/JoinRoom";
import Sidebar from "./Components/Sidebar";
import CodeEditor from "./Components/CodeEditor";
import OutputConsole from "./Components/OutputConsole";

const socket = io("http://localhost:5050");

const App = () => {
  const dispatch = useDispatch();
  const { code, language, roomId, version } = useSelector((state) => state.code);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Are you sure you want to leave this page?";
    };

    const handlePopState = () => {
      const confirmNavigation = window.confirm("Are you sure you want to leave this page?");
      if (!confirmNavigation) {
        window.history.pushState(null, "", window.location.href);
      } else {
        socket.emit("leaveRoom");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTimeout(() => {
          if (document.visibilityState === "hidden") {
            socket.emit("leaveRoom");
          }
        }, 1000);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      dispatch(setCode(newCode));
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is typing...`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      dispatch(setLanguage(newLanguage));
    });

    socket.on("codeResponse", (response) => {
      setOutput(response.run.output);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    dispatch(setRoomId(""));
    setUserName("");
    dispatch(setCode("//Start code here"));
    dispatch(setLanguage("javascript"));
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => {
      setCopySuccess("");
    }, 2000);
  };

  const handleCodeChange = (newCode) => {
    dispatch(setCode(newCode));
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("userTyping", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    dispatch(setLanguage(newLanguage));
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  const runCode = () => {
    socket.emit("compileCode", { code, language, roomId, version });
  };

  const downloadCode = () => {
    const hardcodedData = `// Room ID: ${roomId}\n // User Name: ${userName}\n`;
    const finalCode = hardcodedData + code;
    const blob = new Blob([finalCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const extensions = {
      javascript: "js",
      python: "py",
      c: "c",
      cpp: "cpp",
      java: "java",
    };
    a.download = `code.${extensions[language] || "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!joined) {
    return (
      <JoinRoom
        roomId={roomId}
        userName={userName}
        setRoomId={(e) => dispatch(setRoomId(e))}
        setUserName={setUserName}
        joinRoom={joinRoom}
      />
    );
  }

  return (
    <div className="editor-container">
      <Sidebar
        roomId={roomId}
        users={users}
        typing={typing}
        copyRoomId={copyRoomId}
        copySuccess={copySuccess}
        leaveRoom={leaveRoom}
        downloadCode={downloadCode}
        language={language}
        handleLanguageChange={handleLanguageChange}
      />
      <div className="editor-wrapper">
        <CodeEditor language={language} code={code} handleCodeChange={handleCodeChange} />
        <div className="run-container">
          <button className="run-btn" onClick={runCode}>Execute</button>
          <OutputConsole output={output} />
        </div>
      </div>
    </div>
  );
};

export default App;