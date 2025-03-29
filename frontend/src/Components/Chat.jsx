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
    <div className="chat-container chat-visible">
      {/* Chat Header */}
      <div className="chat-header">
        Chat Room
        <button className="chat-close" onClick={toggleChat}>
          ✖
        </button>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <p key={index} className="chat-message">
            <strong>{msg.userName}: </strong> {msg.message}
          </p>
        ))}
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="chat-send-button" onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default Chat;
