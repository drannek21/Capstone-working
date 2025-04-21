import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faChevronDown,
  faSignOutAlt,
  faQuestionCircle,
  faTimes,
  faCheck,
  faExclamationCircle,
  faCalendarAlt,
  faFileAlt,
  faFileUpload,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './UserTopNavbar.css';
import defaultAvatar from '../assets/avatar.jpg';
import LogoutModal from '../components/LogoutModal';

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

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const notificationRef = useRef(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear(); // Clear all localStorage items
        sessionStorage.clear();
      }
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      window.location.replace('/login');
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setIsLoggingOut(false);
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

        // Fetch regular notifications
        const notificationsResponse = await fetch(`http://localhost:8081/notifications/${userId}`);
        const notificationsData = await notificationsResponse.json();

        // Fetch events
        const eventsResponse = await fetch('http://localhost:8081/events');
        const eventsData = await eventsResponse.json();

        // Convert events to notification format
        const eventNotifications = eventsData.map(event => ({
          id: `event_${event.id}`,
          type: 'event',
          message: `New Event: ${event.title}`,
          details: {
            date: `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`,
            time: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`,
            location: event.location
          },
          created_at: event.created_at,
          read: event.is_read === 1 // Convert MySQL TINYINT(1) to boolean
        }));

        // Combine both notifications and events
        const allNotifications = [...notificationsData, ...eventNotifications];
        
        // Sort by creation date (newest first)
        allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setNotifications(allNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      }
    };

    fetchNotifications();
    
    // Set up polling for new events every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId, type) => {
    try {
      const userId = localStorage.getItem("UserId");
      if (!userId) return;

      // Update the notification state to mark it as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );

      // If it's an event notification, mark it as read in the backend
      if (type === 'event') {
        const eventId = notificationId.replace('event_', '');
        await fetch(`http://localhost:8081/events/mark-as-read/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return;
      }

      // For regular notifications, mark as read in the backend
      await fetch(`http://localhost:8081/notifications/mark-as-read/${userId}/${type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Update the notification icon function
  const getNotificationIcon = (type) => {
    switch (type) {
      case "event":
        return <FontAwesomeIcon icon={faCalendarAlt} className="notification-icon event" />;
      case "application":
        return <FontAwesomeIcon icon={faFileAlt} className="notification-icon application" />;
      case "document":
        return <FontAwesomeIcon icon={faFileUpload} className="notification-icon document" />;
      case "status":
        return <FontAwesomeIcon icon={faInfoCircle} className="notification-icon status" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="notification-icon" />;
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      localStorage.removeItem("userToken");
      localStorage.removeItem("UserId");
      window.history.pushState(null, "", "/login");
      window.location.replace("/login");
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update the notification section in the return statement
  return (
    <nav className="top-nav">
      <LogoutModal isOpen={showLogoutModal} onConfirm={confirmLogout} onCancel={cancelLogout} />

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
            className="nav-btn notification-bell-green"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="notification-bell-bg">
              <FontAwesomeIcon icon={faBell} />
            </span>
            {getUnreadCount() > 0 && (
              <span className="notification-badge">{getUnreadCount()}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                {getUnreadCount() > 0 && (
                  <button className="mark-all-as-read-btn" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={`${notification.id}-${notification.created_at}`}
                      className={`notification-item ${notification.read ? "read" : "unread"}`}
                      onClick={() => markAsRead(notification.id, notification.type)}
                    >
                      <div className="notification-icon-wrapper-new">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        {notification.details && (
                          <div className="notification-details">
                            <p className="notification-date">{notification.details.date}</p>
                            <p className="notification-time">{notification.details.time}</p>
                            <p className="notification-location">{notification.details.location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-notifications">No notifications available</p>
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