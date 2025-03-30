import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaDatabase, FaUsers, FaClipboardList, FaSync, FaBars, FaSignOutAlt, FaUserFriends } from 'react-icons/fa';
import './SuperAdminSideBar.css';
import logo from '../assets/logo.jpg'; // Import the logo

const SuperAdminSideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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
