import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faChevronDown,
  faSignOutAlt,
  faQuestionCircle,
  faTimes,
  faCheck,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import './UserTopNavbar.css';
import defaultAvatar from '../assets/avatar.jpg';

const UserTopNavbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faqItems] = useState([
    {
      question: 'What support services are available?',
      answer: 'We offer counseling, financial planning, and childcare assistance programs specifically designed for solo parents.'
    },
    {
      question: 'How do I apply for benefits?',
      answer: 'You can apply online through our portal or visit any of our regional offices for in-person assistance.'
    }
  ]);

  const notificationRef = useRef(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      // First check if localStorage is available
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear(); // Clear all localStorage items
      }
      
      // Use window.location.replace for more reliable navigation
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      // Fallback navigation if localStorage fails
      window.location.replace('/login');
    }
  };

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUserId) {
        console.error("No logged-in user found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.profilePic) {
            localStorage.setItem(`profilePic_${loggedInUserId}`, data.profilePic);
          } else {
            const cachedProfilePic = localStorage.getItem(`profilePic_${loggedInUserId}`);
            if (cachedProfilePic) {
              data.profilePic = cachedProfilePic;
            }
          }
          setUser(data);
        } else {
          console.error("Error fetching user data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [loggedInUserId, API_BASE_URL]);

  // Update the notification state and functions
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = localStorage.getItem("UserId");
        if (!userId) return;

        const response = await fetch(`http://localhost:8081/notifications/${userId}`);
        const data = await response.json();

        console.log("Fetched Notifications:", data);
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      }
    };

    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
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
    if (!Array.isArray(notifications)) return 0;
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

  // Add the notification icon function
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

  // Update the notification section in the return statement
  return (
    <nav className="top-nav">
     

      <div className="nav-right">
        <button className="nav-btn" onClick={() => setShowFAQ(true)}>
          <FontAwesomeIcon icon={faQuestionCircle} />
        </button>

        {/* Add FAQ Modal */}
        {showFAQ && (
          <div className="modal-overlay">
            <div className="faq-modal">
              <div className="modal-header">
                <h3>Frequently Asked Questions</h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowFAQ(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-content">
                {faqItems.map((item, index) => (
                  <div key={index} className="faq-item">
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="notification-wrapper" ref={notificationRef}>
          <button 
            className="nav-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FontAwesomeIcon icon={faBell} />
            {getUnreadCount() > 0 && (
              <span className="notification-badge">{getUnreadCount()}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
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
                      key={`${notification.id}-${notification.created_at}-${Math.random()}`}
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
        </div>

        <div className="nav-profile" onClick={() => setShowDropdown(!showDropdown)}>
          {!isLoading && (
            <>
              <img 
                src={user?.profilePic || defaultAvatar} 
                alt="Profile" 
                className="profile-image"
                onError={(e) => e.target.src = defaultAvatar}
              />
              <span className="profile-name">
                {user ? `${user.first_name} ${user.last_name}` : 'Guest'}
              </span>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`}
              />
            </>
          )}

          {showDropdown && (
            <div className="profile-dropdown">
              <button 
                className="dropdown-item logout-option"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserTopNavbar;