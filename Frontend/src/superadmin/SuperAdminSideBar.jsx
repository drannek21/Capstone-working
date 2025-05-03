import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { FaTachometerAlt, FaDatabase, FaUsers, FaClipboardList,FaComments, FaSync, FaBars, FaSignOutAlt, FaUserFriends, FaBell, FaTimes, FaBullhorn, FaLink, FaImage } from 'react-icons/fa';
import './SuperAdminSideBar.css';
import logo from '../assets/logo.jpg'; // Import the logo

const SuperAdminSideBar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");

  // Function to fetch notifications
  const fetchNotifications = async () => {
    setNotifLoading(true);
    setNotifError("");
    try {
      const response = await fetch("http://localhost:8081/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      // Expect { success, notifications: [...] }
      const notificationsArr = Array.isArray(data.notifications) ? data.notifications : [];
      const normalized = notificationsArr.map(n => ({
        id: n.id,
        user_id: n.user_id,
        notif_type: n.notif_type,
        message: n.message,
        is_read: n.is_read === 1 || n.is_read === true, // handle 0/1 or boolean
        created_at: n.created_at
      }));
      // Sort by created_at desc
      normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(normalized);
    } catch (err) {
      setNotifError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  // Fetch notifications when component mounts and every 30 seconds
  useEffect(() => {
    fetchNotifications(); // Initial fetch on mount
    
    // Set up periodic fetching every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Refetch notifications when modal opens for real-time refresh
  useEffect(() => {
    if (showNotifModal) {
      fetchNotifications();
    }
  }, [showNotifModal]);

  // Mark notification as read (patterned after UserTopNavbar)
  const markAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    // Optionally, update backend if endpoint exists
    try {
      await fetch(`http://localhost:8081/api/notifications/mark-as-read/${notifId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      // Ignore backend error for now, UI stays responsive
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await fetch(`http://localhost:8081/api/notifications`, {
        method: 'DELETE',
      });
      setNotifications([]);
    } catch (err) {
      alert('Failed to clear notifications');
    }
  };

  // Handle notification click: mark as read and navigate
  const handleNotifClick = notif => {
    markAsRead(notif.id);
    if (notif.notif_type === "remarks") {
      navigate("/superadmin/solo-parent-management");
    } else if (notif.notif_type === "new_app") {
      navigate("/superadmin/applications?tab=regular");
    } else if (notif.notif_type === "follow_up_doc") {
      navigate("/superadmin/applications?tab=follow_up");
    }
    setShowNotifModal(false);
  };

  // Announcement modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementDescription, setAnnouncementDescription] = useState("");
  const [announcementLink, setAnnouncementLink] = useState("");
  const [announcementEndDate, setAnnouncementEndDate] = useState("");
  const [announcementImage, setAnnouncementImage] = useState(null);
  const [announcementImagePreview, setAnnouncementImagePreview] = useState(null);
  const [isAnnLoading, setIsAnnLoading] = useState(false);
  const [annError, setAnnError] = useState("");
  const [annSuccess, setAnnSuccess] = useState("");

  // Reset announcement modal state
  const resetAnnouncementModal = () => {
    setAnnouncementTitle("");
    setAnnouncementDescription("");
    setAnnouncementLink("");
    setAnnouncementEndDate("");
    setAnnouncementImage(null);
    setAnnouncementImagePreview(null);
    setAnnError("");
    setAnnSuccess("");
  };

  // Handle image upload
  const handleAnnouncementImageChange = (e) => {
    const file = e.target.files[0];
    setAnnouncementImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAnnouncementImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAnnouncementImagePreview(null);
    }
  };

  // Handle add announcement
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setAnnError("");
    setAnnSuccess("");
    // Require title
    if (!announcementTitle.trim()) {
      setAnnError("Title is required.");
      return;
    }
    // Require description
    if (!announcementDescription.trim()) {
      setAnnError("Description is required.");
      return;
    }
    // Require end date
    if (!announcementEndDate) {
      setAnnError("End date is required.");
      return;
    }
    // Validate end date (must not be in the past)
    const today = new Date();
    today.setHours(0,0,0,0);
    const inputDate = new Date(announcementEndDate);
    if (inputDate < today) {
      setAnnError("End date cannot be in the past.");
      return;
    }
    // Require image
    if (!announcementImage) {
      setAnnError("Image is required.");
      return;
    }
    setIsAnnLoading(true);
    try {
      const res = await fetch("http://localhost:8081/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle,
          description: announcementDescription,
          link: announcementLink,
          endDate: announcementEndDate || undefined,
          imageBase64: announcementImagePreview || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnnSuccess("Announcement posted successfully!");
        resetAnnouncementModal();
        setTimeout(() => {
          setShowAnnouncementModal(false);
          setAnnSuccess("");
        }, 1200);
      } else {
        setAnnError(data.error || "Failed to post announcement");
      }
    } catch (err) {
      setAnnError("Failed to post announcement");
    }
    setIsAnnLoading(false);
  };

  // Reset modal state when closed
  useEffect(() => {
    if (!showAnnouncementModal) {
      resetAnnouncementModal();
    }
    // eslint-disable-next-line
  }, [showAnnouncementModal]);

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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
      
      {/* Right-side notification icon */}
      <div className="notifications-right-side" onClick={() => setShowNotifModal(true)}>
        <FaBell color="#16C47F" />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>
      
      <aside className={`super-admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Super Admin</h1>
          <div className="logo-container">
            <img src={logo} alt="Logo" className="sidebar-logo" />
          </div>
        </div>
        
        {/* Notification Modal */}
        {showNotifModal && (
  <div className="notif-modal-root">
    <div className="notif-modal-overlay" onClick={() => setShowNotifModal(false)}>
      <div className="notif-modal" onClick={e => e.stopPropagation()}>
        <div className="notif-modal-header">
          <h3>Notifications</h3>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <button className="notif-action-btn" onClick={async () => {
              // Mark all as read
              try {
                await Promise.all(
                  notifications.filter(n => !n.is_read).map(n =>
                    fetch(`http://localhost:8081/api/notifications/mark-as-read/${n.id}`, {method: 'PUT'})
                  )
                );
                setNotifications(notifications.map(n => ({...n, is_read: true})));
              } catch (err) {
                alert('Failed to mark all as read');
              }
            }}>Mark all as read</button>
            <button className="notif-action-btn" onClick={async () => {
              if (!window.confirm('Are you sure you want to clear all notifications?')) return;
              try {
                await fetch(`http://localhost:8081/api/notifications`, {method: 'DELETE'});
                setNotifications([]);
              } catch (err) {
                alert('Failed to clear notifications');
              }
            }}>Clear all</button>
            <button className="close-modal" onClick={() => setShowNotifModal(false)}><FaTimes /></button>
          </div>
        </div>
        <div className="notif-modal-content">
          {notifications.length === 0 ? (
            <p className="no-notifications">No notifications available.</p>
          ) : (
            <ul className="notif-list">
              {notifications.map(n => (
                <li key={n.id} className={`notif-item${n.is_read ? '' : ' unread'}`} style={{cursor:'pointer'}} onClick={() => handleNotifClick(n)}>
                  <span className="notif-message">{n.message}</span>
                  <span className="notif-date">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  </div>
)}
        {/* Announcement Modal - SEPARATE */}
        {showAnnouncementModal && (
          <div className="notif-modal-root">
            <div className="notif-modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
              <div className="notif-modal" onClick={e => e.stopPropagation()} style={{width: '420px', maxWidth: '95vw'}}>
                <div className="notif-modal-header">
                  <h3><FaBullhorn style={{marginRight: 6}}/>Announcements</h3>
                  <button className="close-modal" onClick={() => setShowAnnouncementModal(false)}><FaTimes /></button>
                </div>
                <div className="notif-modal-content announcement-modal-content">
                  <form onSubmit={handleAddAnnouncement} style={{marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 8}}>
                    <input
                      type="text"
                      placeholder="Title"
                      value={announcementTitle}
                      onChange={e => setAnnouncementTitle(e.target.value)}
                    />
                    <textarea
                      placeholder="Description"
                      value={announcementDescription}
                      onChange={e => setAnnouncementDescription(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Link (optional)"
                      value={announcementLink}
                      onChange={e => setAnnouncementLink(e.target.value)}
                    />
                    <input
                      type="date"
                      placeholder="End Date (optional)"
                      value={announcementEndDate}
                      onChange={e => setAnnouncementEndDate(e.target.value)}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAnnouncementImageChange}
                    />
                    {announcementImagePreview && (
                      <img src={announcementImagePreview} alt="Preview" style={{maxWidth: 120, margin: '8px 0'}} />
                    )}
                    <button
                      type="submit"
                      className="ann-btn"
                      disabled={isAnnLoading}
                      style={{
                        background: isAnnLoading ? '#ccc' : '#ffb300',
                        color: isAnnLoading ? '#888' : '#222',
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px 0',
                        fontWeight: 700,
                        fontSize: 16,
                        cursor: isAnnLoading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s, color 0.2s',
                        boxShadow: isAnnLoading ? 'none' : '0 2px 8px #ffb30044',
                        marginTop: 8
                      }}
                      onMouseOver={e => {
                        if (!isAnnLoading) e.currentTarget.style.background = '#ff9800';
                      }}
                      onMouseOut={e => {
                        if (!isAnnLoading) e.currentTarget.style.background = '#ffb300';
                      }}
                    >
                      {isAnnLoading ? "Posting..." : "Add Announcement"}
                    </button>
                    {annError && <p style={{fontSize: 15, color: 'red', marginTop: 6}}>{annError}</p>}
                    {annSuccess && <p style={{fontSize: 15, color: 'green', marginTop: 6}}>{annSuccess}</p>}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
        <nav className="sidebar-nav">
          <div className="nav-link" onClick={() => setShowAnnouncementModal(true)} style={{cursor: 'pointer'}}>
            <FaBullhorn className="nav-icon" />
            <span>Announcements</span>
          </div>
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

          <NavLink 
            to="/superadmin/events" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={isMobile ? toggleSidebar : undefined}
          >
            <FaClipboardList className="nav-icon" />
            <span>Events</span>
          </NavLink>

          <NavLink 
            to="/superadmin/forum-management" 
            className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={isMobile ? toggleSidebar : undefined}
          >
            <FaComments className="nav-icon" />
            <span>Forum Management</span>
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
