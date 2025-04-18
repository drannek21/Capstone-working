import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaDatabase, FaUsers, FaClipboardList, FaSync, FaBars, FaSignOutAlt, FaUserFriends, FaBell, FaTimes } from 'react-icons/fa';
import './SuperAdminSideBar.css';
import logo from '../assets/logo.jpg'; // Import the logo

const SuperAdminSideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState([
    // Example notifications; replace with real data fetching
    { id: 1, message: 'New application submitted', read: false, date: '2025-04-18' },
    { id: 2, message: 'Document uploaded by user', read: true, date: '2025-04-17' },
    { id: 3, message: 'Renewal request pending', read: false, date: '2025-04-16' },
  ]);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('superadminToken');
    // Redirect to login page
    window.location.href = '/';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {isMobile && (
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
      )}
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      <aside className={`super-admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Super Admin</h1>
          <div className="logo-container">
            <img src={logo} alt="Logo" className="sidebar-logo" />
          </div>
        </div>
        <div className="notifications" onClick={() => setShowNotifModal(true)}>
          <FaBell />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </div>
        {/* Notification Modal */}
        {showNotifModal && (
          <div className="notif-modal-root">
            <div className="notif-modal-overlay" onClick={() => setShowNotifModal(false)}>
              <div className="notif-modal" onClick={e => e.stopPropagation()}>
                <div className="notif-modal-header">
                  <h3>Notifications</h3>
                  <button className="close-modal" onClick={() => setShowNotifModal(false)}><FaTimes /></button>
                </div>
                <div className="notif-modal-content">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">No notifications available.</p>
                  ) : (
                    <ul className="notif-list">
                      {notifications.map(n => (
                        <li key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                          <span className="notif-message">{n.message}</span>
                          <span className="notif-date">{n.date}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <nav className="sidebar-nav">
          <NavLink 
            to="/superadmin/sdashboard" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={isMobile ? toggleSidebar : undefined}
          >
            <FaTachometerAlt className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/superadmin/applications" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={isMobile ? toggleSidebar : undefined}
          >
            <FaDatabase className="nav-icon" />
            <span>Applications</span>
          </NavLink>

          <NavLink 
            to="/superadmin/solo-parent-management" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={isMobile ? toggleSidebar : undefined}
          >
            <FaUserFriends className="nav-icon" />
            <span>Solo Parent Management</span>
          </NavLink>
          
          <NavLink 
            to="/superadmin/admin-management" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={isMobile ? toggleSidebar : undefined}
          >
            <FaUsers className="nav-icon" />
            <span>Admin Management</span>
          </NavLink>

          <NavLink 
            to="/superadmin/events" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={isMobile ? toggleSidebar : undefined}
          >
            <FaClipboardList className="nav-icon" />
            <span>Events</span>
          </NavLink>

          <div className="nav-spacer"></div>
          
          <div className="nav-link logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon logout-icon" />
            <span>Logout</span>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default SuperAdminSideBar;
