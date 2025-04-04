import React from "react";


const MemberInfo = ({users}) => {
  return (
    <div className="member-container">
      <h2 className="member-title">👥 Members</h2>
      <div className="member-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="profile-container">
              <div className="profile-icon" />
              { <div className="online-indicator" />}
            </div>
            <p className="user-name">{user.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberInfo;
