import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserTopNavbar from './UserTopNavbar';
import Profile from './Profile';
import './User.css';
import Faq from './Faq';  

const User = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = () => {
      localStorage.clear();
      navigate('/login', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

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