import { useEffect, useState } from "react";
import "./styles/App.css";
import io from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import {
  setCode,
  setLanguage,
  setRoomId,
  setConsoleText,
} from "./Slice/CodeSlice";
import JoinRoom from "./Components/JoinRoom";
import Sidebar from "./Components/Sidebar";
import CodeEditor from "./Components/CodeEditor";
import OutputConsole from "./Components/OutputConsole";
import AskAi from "./Components/AskAi";
import Chat from "./Components/Chat";
import { addMessage } from "./Slice/GroupChat";
import DrawingBoard from "./Components/DrawingBoard";

const socket = io("https://codehive-srlm.onrender.com");

const App = () => {
  const dispatch = useDispatch();
  const { code, language, roomId, version } = useSelector(
    (state) => state.code
  );

  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [showAskAi, setShowAskAi] = useState(false);
  const [aiResponse, setAiResponse] = useState({ question: "", response: "" });
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [Board, setBoard] = useState(false);

  const toggleChat = () => {
    setShowChat((prev) => !prev);
  };

  const toggleBoard = () => {
    setBoard((prev) => !prev);
    console.log(Board);
  };
  const fetchRoomData = async (roomId) => {
    try {
      const response = await fetch("http://localhost:5050/get-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch room data");
      }

      const data = await response.json();

      if (data.code) dispatch(setCode(data.code));
      if (data.language) dispatch(setLanguage(data.language));
      if (data.consoleText) dispatch(setConsoleText(data.consoleText));
      if (data.messages) {
        data.messages.forEach((msg) => dispatch(addMessage(msg)));
      }

      return data;
    } catch (error) {
      console.error("Error fetching room data:", error);
      return null;
    }
  };

  useEffect(() => {
    const handleChatMessage = (chatData) => {
      dispatch(addMessage(chatData));
    };

    socket.off("chatMessage");
    socket.on("chatMessage", handleChatMessage);

    return () => {
      socket.off("chatMessage", handleChatMessage);
    };
  }, [dispatch]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Are you sure you want to leave this page?";
    };

    const handlePopState = () => {
      const confirmNavigation = window.confirm(
        "Are you sure you want to leave this page?"
      );
      if (!confirmNavigation) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      dispatch(setCode(newCode));
    });

    socket.on("userTyping", ({ userName: typingUser }) => {
      if (typingUser && typingUser !== userName) {
        setTyping(`${typingUser.slice(0, 8)}... is typing...`);
        setTimeout(() => setTyping(""), 3000);
      }
    });

    socket.on("languageUpdate", (newLanguage) => {
      dispatch(setLanguage(newLanguage));
    });

    socket.on("codeResponse", (response) => {
      dispatch(setConsoleText(response.run.output));
    });

    socket.on("aiResponse", (data) => {
      setAiResponse(data);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
      socket.off("aiResponse");
    };
  }, [dispatch]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = async () => {
    if (roomId && userName) {
      await fetchRoomData(roomId);

      socket.emit("join", { roomId, userName });

      setJoined(true);
    }
  };

  const handleAskAI = (question) => {
    socket.emit("askAI", { roomId, question, code });
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

  const toggleAskAi = () => {
    setShowAskAi(!showAskAi);
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
        toggleChat={() => setShowChat(!showChat)}
        toggleBoard={() => setBoard(!Board)}
        users={users}
        roomId={roomId}
        typing={typing}
        copyRoomId={copyRoomId}
        copySuccess={copySuccess}
        leaveRoom={leaveRoom}
        downloadCode={downloadCode}
        language={language}
        handleLanguageChange={handleLanguageChange}
        Board={Board}
      />

      {showChat && (
        <div className="chat-container chat-visible">
          <Chat
            socket={socket}
            roomId={roomId}
            userName={userName}
            messages={messages}
            setMessages={setMessages}
            toggleChat={toggleChat}
          />
        </div>
      )}

      <div className="editor-wrapper">
        {Board && (
          <div className="drawing-board-container-main">
            <DrawingBoard
              toggleBoard={toggleBoard}
              roomId={roomId}
              socket={socket}
            />
          </div>
        )}
        <div className="editor-header">
          <button className="ask-ai-button" onClick={toggleAskAi}>
            {showAskAi ? "Hide" : "Ask AI"}
          </button>
        </div>
        {!Board && (
          <CodeEditor
            language={language}
            code={code}
            handleCodeChange={handleCodeChange}
          />
        )}
        <div className="run-container">
          {!Board && (
            <button className="run-btn" onClick={runCode}>
              Execute
            </button>
          )}
          {!Board && <OutputConsole />}
        </div>
      </div>
      {showAskAi && (
        <AskAi aiResponse={aiResponse} onSendQuestion={handleAskAI} />
      )}
    </div>
  );
};

export default App;
