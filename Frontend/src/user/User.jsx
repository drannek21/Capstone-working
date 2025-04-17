import React from 'react';
import UserTopNavbar from './UserTopNavbar';
import Profile from './Profile';
import './User.css';
import Faq from './Faq';  
const User = () => {
  return (
    <div className="user-container">
      <UserTopNavbar />
      <div className="user-content">
        <Profile />
      </div>
      <div className="faq-floating">
        <Faq />
      </div>
    </div>
  );
};

export default User;