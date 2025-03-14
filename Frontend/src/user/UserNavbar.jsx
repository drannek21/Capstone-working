import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faTimes, faCheck, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./UserNavbar.css";

const UserNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await axios.get(`http://localhost:8081/notifications/${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Fetch notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
    localStorage.removeItem("userId");
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

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`http://localhost:8081/notifications/read/${notificationId}`);
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem("userId");
      await axios.post(`http://localhost:8081/notifications/readAll/${userId}`);
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'verified':
        return <FontAwesomeIcon icon={faCheck} className="notification-icon success" />;
      case 'declined':
        return <FontAwesomeIcon icon={faExclamationCircle} className="notification-icon danger" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="notification-icon" />;
    }
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
                        <div className="notification-icon-wrapper">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-date">{formatDate(notification.created_at)}</span>
                        </div>
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