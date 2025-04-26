import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserTopNavbar from './UserTopNavbar';
import Profile from './Profile';
import ForumRoom from './ForumRoom';
import './User.css';
import Faq from './Faq';
import LogoutModal from '../components/LogoutModal';

const User = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    // Prevent direct history manipulation
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (event) => {
      event.preventDefault();
      setShowLogoutModal(true);
      // Push another state to prevent immediate browser back
      window.history.pushState(null, '', window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup function
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.replace('/login'); // Fallback to login page
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    // Push a new state to maintain the current page
    window.history.pushState(null, '', window.location.pathname);
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="user-container">
      <UserTopNavbar onNavigate={handleNavigation} />
      <div className="user-content">
        {activeSection === 'profile' ? (
          <Profile />
        ) : (
          <div className="forum-container">
            <ForumRoom />
          </div>
        )}
      </div>
      {activeSection === 'profile' && (
        <div className="faq-floating">
          <Faq />
        </div>
      )}
      <LogoutModal isOpen={showLogoutModal} onConfirm={confirmLogout} onCancel={cancelLogout} />
    </div>
  );
};

export default User;