import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheck, faExclamationCircle, faCog, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "./UserNavbar.css";

const UserNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const settingsRef = useRef(null);

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

  const handleChangePassword = () => {
    // Show the change password modal
    setShowChangePasswordModal(true);
    setShowSettings(false);
    
    // Reset form fields and messages
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    
    // Reset password visibility
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Click outside handler for settings dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      case "renewal_accepted":
        return <FontAwesomeIcon icon={faCheck} className="notification-icon success" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="notification-icon" />;
    }
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 10 || newPassword.length > 15) {
      setPasswordError('Password must be between 10 and 15 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password');
      return;
    }

    try {
      const userId = localStorage.getItem("UserId");
      const email = localStorage.getItem("loggedInUser"); // Get email from localStorage
      if (!userId && !email) {
        setPasswordError('User not authenticated');
        return;
      }

      console.log("Sending password change request with:", { 
        userId, 
        email, 
        currentPassword: currentPassword ? "provided" : "missing",
        newPassword: newPassword ? "provided" : "missing"
      });

      const response = await fetch('http://localhost:8081/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email, // Include email for more reliable user identification
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully');
        setTimeout(() => {
          setShowChangePasswordModal(false);
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('An error occurred. Please try again. ' + (error.message || ''));
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
          <li className="settings-container" ref={settingsRef}>
            <button className="settings-button" onClick={toggleSettings}>
              <FontAwesomeIcon icon={faCog} />
            </button>
            
            {showSettings && (
              <div className="settings-dropdown">
                <button onClick={handleChangePassword}>Change Password</button>
                <button onClick={() => setShowLogoutPopup(true)}>Logout</button>
              </div>
            )}
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

      {showChangePasswordModal && (
        <div className="modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
          <div className="modal-content change-password-modal" onClick={e => e.stopPropagation()}>
            <h3>Change Password</h3>
            
            {passwordSuccess && (
              <div className="success-message">
                {passwordSuccess}
              </div>
            )}
            
            {passwordError && (
              <div className="error-message">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={submitChangePassword}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <small className="password-helper">Password must be between 10-15 characters</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowChangePasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;
