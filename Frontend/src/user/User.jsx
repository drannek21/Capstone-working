import React, { useEffect, useState } from 'react';
import UserTopNavbar from './UserTopNavbar';
import Profile from './Profile';
import './User.css';
import Faq from './Faq';
import LogoutModal from '../components/LogoutModal';

const User = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handlePopState = (event) => {
      setShowLogoutModal(true);
      window.history.pushState(null, '', window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
      sessionStorage.clear();
    }
    window.location.replace('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="user-container">
      <UserTopNavbar />
      <div className="user-content">
        <Profile />
      </div>
      <div className="faq-floating">
        <Faq />
      </div>
      <LogoutModal isOpen={showLogoutModal} onConfirm={confirmLogout} onCancel={cancelLogout} />
    </div>
  );
};

export default User;