import React from 'react';
import UserTopNavbar from './UserTopNavbar';
import Profile from './Profile';
import './User.css';

const User = () => {
  return (
    <div className="user-container">
      <UserTopNavbar />
      <div className="user-content">
        <Profile />
      </div>
    </div>
  );
};

export default User;