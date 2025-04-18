import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaDatabase, FaUsers, FaClipboardList, FaSync, FaBars, FaSignOutAlt, FaUserFriends, FaBell, FaTimes, FaBullhorn, FaLink, FaImage } from 'react-icons/fa';
import './SuperAdminSideBar.css';
import logo from '../assets/logo.jpg'; // Import the logo

const SuperAdminSideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState([
    // Example notifications; replace with real data fetching
    { id: 1, message: 'New application submitted', read: false, date: '2025-04-18' },
    { id: 2, message: 'Document uploaded by user', read: true, date: '2025-04-17' },
    { id: 3, message: 'Renewal request pending', read: false, date: '2025-04-16' },
  ]);

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
    if (!announcementTitle && !announcementDescription && !announcementImagePreview && !announcementLink) return;
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
        setAnnouncementTitle("");
        setAnnouncementDescription("");
        setAnnouncementLink("");
        setAnnouncementEndDate("");
        setAnnouncementImage(null);
        setAnnouncementImagePreview(null);
      } else {
        setAnnError(data.error || "Failed to post announcement");
      }
    } catch (err) {
      setAnnError("Failed to post announcement");
    }
    setIsAnnLoading(false);
  };



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

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <aside className={`super-admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Super Admin</h1>
          <div className="logo-container">
            <img src={logo} alt="Logo" className="sidebar-logo" />
          </div>
        </div>
        <div className="notifications" onClick={() => setShowNotifModal(true)}>
          <FaBell />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </div>
        {/* Notification Modal */}
        {showNotifModal && (
          <div className="notif-modal-root">
            <div className="notif-modal-overlay" onClick={() => setShowNotifModal(false)}>
              <div className="notif-modal" onClick={e => e.stopPropagation()}>
                <div className="notif-modal-header">
                  <h3>Notifications</h3>
                  <button className="close-modal" onClick={() => setShowNotifModal(false)}><FaTimes /></button>
                </div>
                <div className="notif-modal-content">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">No notifications available.</p>
                  ) : (
                    <ul className="notif-list">
                      {notifications.map(n => (
                        <li key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                          <span className="notif-message">{n.message}</span>
                          <span className="notif-date">{n.date}</span>
                        </li>
                      ))}
                    </ul>
                  )}
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

          <div className="nav-spacer"></div>
          
          <div className="nav-link logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon logout-icon" />
            <span>Logout</span>
          </div>
        </nav>
      </aside>

      {/* Announcement Modal */}
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
                    required
                    style={{marginBottom: 4}}
                  />
                  <textarea
                    placeholder="Description"
                    value={announcementDescription}
                    onChange={e => setAnnouncementDescription(e.target.value)}
                    required
                    style={{resize: 'vertical', minHeight: 40, maxHeight: 120, marginBottom: 4}}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAnnouncementImageChange}
                    style={{marginBottom: 8}}
                  />
                  <input
                    type="date"
                    placeholder="End Date (optional)"
                    value={announcementEndDate}
                    onChange={e => setAnnouncementEndDate(e.target.value)}
                    style={{marginBottom: 8}}
                  />
                  {announcementImagePreview && (
                    <img src={announcementImagePreview} alt="preview" style={{maxWidth: '100%', maxHeight: 120, marginBottom: 8, borderRadius: 4}} />
                  )}
                  <input
                    type="text"
                    placeholder="Link (optional)"
                    value={announcementLink}
                    onChange={e => setAnnouncementLink(e.target.value)}
                  />
                  <button type="submit" className="superadmin-generate-btn" style={{alignSelf: 'flex-end', marginTop: 4, padding: '6px 18px'}}>Add</button>
                </form>
                {annError && <p style={{fontSize: 15, color: 'red'}}>{annError}</p>}
                {isAnnLoading && <p style={{fontSize: 15, color: '#888'}}>Posting...</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminSideBar;
