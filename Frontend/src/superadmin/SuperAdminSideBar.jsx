import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiFileText, FiBell, FiLogOut } from 'react-icons/fi';
import './SuperAdminSideBar.css';

const SuperAdminSideBar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Fetch notifications from backend
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:8081/notifications');
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8081/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear tokens or session data
        localStorage.removeItem('authToken');
        sessionStorage.clear();

        // Redirect to main content or entry page
        navigate('/'); // Assuming '/' routes to App.js or your main content
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
};

  return (
    <>
      <button 
        className="menu-toggle"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      <div className={`super-admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Super Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink 
            to="/superadmin/sdashboard"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
          >
            <FiHome className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/superadmin/applications"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
          >
            <FiFileText className="nav-icon" />
            <span>Applications</span>
          </NavLink>
          
          {/* Logout link styled like other nav links */}
          <div 
            className="nav-link"
            onClick={() => {
              handleLogout();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            style={{ cursor: 'pointer' }}
          >
            <FiLogOut className="nav-icon" />
            <span>Log Out</span>
          </div>
        </nav>

      </div>

      {isOpen && window.innerWidth < 768 && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
          role="button"
          aria-label="Close sidebar"
          tabIndex={0}
        />
      )}
    </>
  );
};

export default SuperAdminSideBar;