import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiFileText, FiBell, FiLogOut, FiUsers, FiMessageSquare } from 'react-icons/fi';
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
    const fetchNotifications = async () => {
      try {
        const adminId = localStorage.getItem("id");
        if (!adminId) {
          console.error('Admin ID not found');
          return;
        }
        const response = await fetch(`http://localhost:8081/notifications/${adminId}`);
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem("userToken");

    // Navigate to login page
    navigate("/", { replace: true });

    // Prevent back navigation
    setTimeout(() => {
        window.history.pushState(null, "", window.location.href);
        window.onpopstate = () => {
            window.history.pushState(null, "", window.location.href);
        };
    }, 0);

    // Reload to clear cached session data
    window.location.reload();
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

          <NavLink 
            to="/superadmin/user-management"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
          >
            <FiUsers className="nav-icon" />
            <span>Admin Management</span>
          </NavLink>

          <NavLink 
            to="/superadmin/remarks"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
          >
            <FiMessageSquare className="nav-icon" />
            <span>Remarks</span>
          </NavLink>

          <div 
            className="nav-link"
            onClick={handleLogout}
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
