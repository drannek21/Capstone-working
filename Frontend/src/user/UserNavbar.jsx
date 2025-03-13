import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faTimes } from "@fortawesome/free-solid-svg-icons";
import "./UserNavbar.css";

const UserNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  // Sample notifications - replace with your actual data fetching logic
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Your application has been approved", read: false, date: "2025-03-12" },
    { id: 2, message: "New event: Community meeting on Friday", read: false, date: "2025-03-10" },
    { id: 3, message: "Document verification required", read: true, date: "2025-03-08" },
  ]);

  useEffect(() => {
    if (showLogoutPopup) {
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, "", window.location.href);
      };
    }
  }, [showLogoutPopup]);

  useEffect(() => {
    // Close notification panel when clicking outside
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notification-panel') && !e.target.closest('.notif-bell')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/", { replace: true });
    setTimeout(() => {
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, "", window.location.href);
      };
    }, 0);
    window.location.reload();
  };

  const handleClickOutside = (e) => {
    if (e.target.classList.contains("logout-popup")) {
      setShowLogoutPopup(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  return (
    <nav className="user-navbar">
      <div className="user-navbar-container">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          Solo Parent Welfare
        </Link>

        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <ul className={`nav-links ${menuOpen ? "open" : ""}`} onClick={(e) => {
          // Prevent closing the menu when clicking notification bell
          if (!e.target.closest('.notif-bell') && !e.target.closest('.notification-panel')) {
            setMenuOpen(false);
          }
        }}>
          <li className="notification-container">
            <button className="notif-bell" onClick={toggleNotifications}>
              <FontAwesomeIcon icon={faBell} />
              {getUnreadCount() > 0 && <span className="notification-badge">{getUnreadCount()}</span>}
            </button>
            
            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {getUnreadCount() > 0 && (
                    <button className="mark-all-read" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-date">{notification.date}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-notifications">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </li>
          <li className="logout-item">
            <button onClick={() => setShowLogoutPopup(true)}>Logout</button>
          </li>
        </ul>
      </div>

      {showLogoutPopup && (
        <div className="logout-popup show" onClick={handleClickOutside}>
          <div className="popup-content">
            <h3>Are you sure you want to log out?</h3>
            <div className="popup-buttons">
              <button className="confirm" onClick={handleLogout}>Yes, Log Out</button>
              <button className="cancel" onClick={() => setShowLogoutPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;