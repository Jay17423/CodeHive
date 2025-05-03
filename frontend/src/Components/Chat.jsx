import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearMessages } from "../Slice/GroupChat";
import EmojiPicker from "emoji-picker-react";
import "../styles/Chat.css";

const Chat = ({ socket, roomId, userName, toggleChat }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.groupChat.messages);
  const emojiPickerRef = useRef(null);

  // Handle typing indicators
  useEffect(() => {
    if (message) {
      socket.emit("userTyping", { roomId, userName });
    }
  }, [message, socket, roomId, userName]);

  // Listen for typing users
  useEffect(() => {
    socket.on("userTyping", ({ userName }) => {
      setTypingUsers((prev) => new Set([...prev, userName]));

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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.classList.contains("chatbox-emoji-button")
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { roomId, userName, message });
      setMessage("");
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const clearChat = () => {
    dispatch(clearMessages());
  };

  return (
    <div className="chatbox-container chat-visible">
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
                const users = Array.from(typingUsers).filter((user) => user);
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

      <div className="chatbox-input-container">
        <button
          className="chatbox-emoji-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          😊
        </button>

        {showEmojiPicker && (
          <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width={300}
              height={350}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        <input
          type="text"
          className="chatbox-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
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
