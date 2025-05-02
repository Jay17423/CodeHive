import axios from "axios";
import { useEffect } from "react";

const MemberInfo = ({ users, roomId }) => {
  
  const userName = users.map(user => user.name);
  console.log(userName,roomId);
  const addMembers = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5050/addMember",
        { userName, roomId } 
      );
      console.log("Members added successfully:", response.data);
    } catch (error) {
      console.error("Error adding members:", error.message);
    }
  };

  useEffect(() =>{
    addMembers();
  },)

  return (
    <div className="member-container">
      <h2 className="member-title">👥 Members</h2>
      <div className="member-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="profile-container">
              <div className="profile-icon" />
              <div className="online-indicator" />
            </div>
            <p className="user-name">{user.name}</p>
          </div>
        ))}
        
      </div>
    </div>
  );
};

export default MemberInfo;
