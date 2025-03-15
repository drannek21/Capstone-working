import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheck, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import "./UserNavbar.css";

const UserNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = localStorage.getItem("UserId");
        if (!userId) return;
  
        const response = await fetch(`http://localhost:8081/notifications/${userId}`);
        const data = await response.json();
  
        console.log("Fetched Notifications:", data); // 🔍 Debugging
        setNotifications(Array.isArray(data) ? data : []); // Ensure it's an array
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]); // Prevents undefined issues
      }
    };
  
    fetchNotifications();
  }, []);
  

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("UserId");
    navigate("/", { replace: true });
    setTimeout(() => {
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, "", window.location.href);
      };
    }, 0);
    window.location.reload();
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId, type) => {
    try {
      const userId = localStorage.getItem("UserId");
  
      await fetch(`http://localhost:8081/notifications/mark-as-read/${userId}/${type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
  
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem("UserId");
  
      await fetch(`http://localhost:8081/notifications/mark-all-as-read/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
  
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  
const getUnreadCount = () => {
  if (!Array.isArray(notifications)) return 0; // Ensure it's an array
  return notifications.filter((notif) => !notif.read).length;
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "application_accepted":
        return <FontAwesomeIcon icon={faCheck} className="notification-icon success" />;
      case "application_declined":
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

        <ul
          className={`nav-links ${menuOpen ? "open" : ""}`}
          onClick={(e) => {
            if (!e.target.closest(".notif-bell") && !e.target.closest(".notification-panel")) {
              setMenuOpen(false);
            }
          }}
        >
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
                        className={`notification-item ${notification.read ? "read" : "unread"}`}
                        onClick={() => markAsRead(notification.id, notification.type)}
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
        <div className="logout-popup show" onClick={(e) => e.target.classList.contains("logout-popup") && setShowLogoutPopup(false)}>
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
