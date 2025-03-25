import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiFileText, FiBell, FiLogOut, FiUsers, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import './SuperAdminSideBar.css';

const SuperAdminSideBar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/', { replace: true });
    setTimeout(() => {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, '', window.location.href);
      };
    }, 0);
    window.location.reload();
  };

  return (
    <>
      <button
        className="menu-toggle"
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
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

          <NavLink
            to="/superadmin/renewal"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
          >
            <FiRefreshCw className="nav-icon" />
            <span>Renewal</span>
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
