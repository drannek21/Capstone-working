import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiFileText, FiBell } from 'react-icons/fi';
import './SuperAdminSideBar.css';

const SuperAdminSideBar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [notifications, setNotifications] = useState([]);

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

  const unreadCount = notifications.filter(n => !n.read).length || 0;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
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
            {unreadCount > 0 && (
              <span className="notification-badge" aria-label={`${unreadCount} unread applications`}>
                {unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="notifications">
            <FiBell className="notification-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount}
              </span>
            )}
          </div>
        </div>
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
