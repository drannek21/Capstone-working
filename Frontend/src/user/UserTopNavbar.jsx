import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faSearch,
  faUserCircle,
  faChevronDown,
  faSignOutAlt,
  faQuestionCircle,
  faTimes,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import './UserTopNavbar.css';

const UserTopNavbar = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const markAsRead = async (notificationId) => {
    try {
      const userId = localStorage.getItem('UserId');
      if (!userId) return;

      const response = await fetch(`http://localhost:8081/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? {...n, read: true} : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem('UserId');
      if (!userId) return;

      const promises = notifications.filter(n => !n.read).map(n => 
        fetch(`http://localhost:8081/notifications/${n.id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId })
        })
      );

      await Promise.all(promises);
      setNotifications(notifications.map(n => ({...n, read: true})));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const faqItems = [
    {
      question: 'What support services are available?',
      answer: 'We offer counseling, financial planning, and childcare assistance programs specifically designed for solo parents.'
    },
    {
      question: 'How do I apply for benefits?',
      answer: 'You can apply online through our portal or visit any of our regional offices for in-person assistance.'
    }
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      // Add your logout logic here (e.g., Firebase auth signOut)
      // await auth.signOut(); 
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <button className="menu-toggle">
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      <div className="nav-right">
        <button 
          className="nav-btn"
          onClick={() => setShowFAQ(true)}
        >
          <FontAwesomeIcon icon={faQuestionCircle} />
        </button>

        <div className="notification-wrapper" ref={notificationRef}>
          <button 
            className="nav-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FontAwesomeIcon icon={faBell} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="mark-all-read" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`notification-item ${notification.read ? '' : 'unread'}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <p>{notification.text}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div 
          className="nav-profile"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User profile" />
          ) : (
            <FontAwesomeIcon icon={faUserCircle} />
          )}
          <span>{user?.displayName || 'User'}</span>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`}
          />

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item logout-option"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  'Signing Out...'
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Sign Out
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="modal-overlay" onClick={() => setShowFAQ(false)}>
          <div className="faq-modal" onClick={e => e.stopPropagation()}>
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
    </nav>
  );
};

export default UserTopNavbar;