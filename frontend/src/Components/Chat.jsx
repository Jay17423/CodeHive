import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, clearMessages } from "../Slice/GroupChat";

const Chat = ({ socket, roomId, userName, toggleChat }) => {
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.groupChat.messages);

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
          <button className="chatbox-clear" onClick={clearChat}>🗑</button>
          <button className="chatbox-close" onClick={toggleChat}>✖</button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <p className="chatbox-empty">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <p key={index} className={`chat-message ${msg.userName === userName ? "sent" : "received"}`}>
              <strong>{msg.userName}: </strong> {msg.message}
            </p>
          ))
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
        <button className="chatbox-send-button" onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
};

export default Chat;
