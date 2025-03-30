import React, { useState } from "react";

const Chat = ({ socket, roomId, userName, messages, toggleChat }) => {
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { roomId, userName, message });
      setMessage("");
    }
  };
  
  
  return (
    <div className="chatbox-container chat-visible">
      {/* Chat Header */}
      <div className="chatbox-header">
        Chat Room
        <button className="chatbox-close" onClick={toggleChat}>
          ✖
        </button>
      </div>

      {/* Chat Messages */}
      <div className="chatbox-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.userName === userName ? "sent" : "received"
            }`}
          >
            <strong>{msg.userName}</strong>
            <p>{msg.message}</p>
          </div>
        ))}
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
