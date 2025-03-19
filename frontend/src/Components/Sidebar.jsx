import React from "react";
import Logo from "../assets/logo.png";

const Sidebar = ({
  roomId,
  users,
  typing,
  copyRoomId,
  copySuccess,
  leaveRoom,
  downloadCode,
  language,
  handleLanguageChange,
}) => {
  return (
    <div className="sidebar">
      <div className="room-info">
        <img className="logo-dark-mode" src={Logo} alt="Logo" />
        <h2>Room ID: {roomId}</h2>
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>
      </div>

      <h3 className="room-title">Members in Room: {users.length}</h3>
      <ul className="user-list">
        {users.map((user, index) => (
          <li key={index} className="user-item">
            <span className="user-icon">👤</span> {user.name}  
            <span className="user-id">({user.id.slice(0, 6)})</span>
          </li>
        ))}
      </ul>

      <p className="typing-indicator">{typing}</p>

      <button onClick={copyRoomId} className="copy-button">
        📋 Copy Room ID
      </button>
      {copySuccess && <span className="copy-success">{copySuccess}</span>}

      <button className="leave-button" onClick={leaveRoom}>
        🚪 Leave Room
      </button>
      <button className="download-button" onClick={downloadCode}>
        📥 Download Code
      </button>
    </div>
  );
};

export default Sidebar;
