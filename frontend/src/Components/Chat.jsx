import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, clearMessages } from "../Slice/GroupChat";
import "../styles/Chat.css";


const Chat = ({ socket, roomId, userName, toggleChat }) => {
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.groupChat.messages);
  const [typingUsers, setTypingUsers] = useState(new Set()); // Use Set for unique users

  // Emit event when user is typing (with debounce)
  useEffect(() => {
    if (message) {
      socket.emit("userTyping", { roomId, userName });
    }
  }, [message, socket, roomId, userName]);

  // Listen for other users typing
  useEffect(() => {
    socket.on("userTyping", ({ userName }) => {
      setTypingUsers((prev) => new Set([...prev, userName])); // Add user to Set

      // Remove user after 3 seconds of inactivity
      setTimeout(() => {
        setTypingUsers((prev) => {
          const updatedUsers = new Set(prev);
          updatedUsers.delete(userName);
          return updatedUsers;
        });
      }, 3000);
    });

    return () => {
      socket.off("userTyping");
    };
  }, [socket]);

  
  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { roomId, userName, message });
      setMessage(""); // Clear input after sending
    }
  };

  // Function to clear all messages
  const clearChat = () => {
    dispatch(clearMessages()); // Clear messages from Redux
  };

  return (
    <div className="chatbox-container chat-visible">
      {/* Chat Header */}
      <div className="chatbox-header">
        Chat Room
        <div className="chatbox-buttons">
          <button className="chatbox-clear" onClick={clearChat}>
            🗑
          </button>
          <button className="chatbox-close" onClick={toggleChat}>
            ✖
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <p className="chatbox-empty">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <p
              key={index}
              className={`chat-message ${
                msg.userName === userName ? "sent" : "received"
              }`}
            >
              <strong>{msg.userName}: </strong> {msg.message}
            </p>
          ))
        )}

        {typingUsers.size > 0 && (
          <div className="chatbox-typing">
            <p>
              {(() => {
                const users = Array.from(typingUsers).filter((user) => user); // Filter out any undefined values
                return users.length === 1
                  ? `${users[0]} is typing...`
                  : `${users.slice(0, -1).join(", ")} and ${
                      users.slice(-1)[0]
                    } are typing...`;
              })()}
            </p>
          </div>
        )}


      </div>

      {/* Chat Input */}
      <div className="chatbox-input-container">
        <input
          type="text"
          className="chatbox-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="chatbox-send-button" onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default Chat;