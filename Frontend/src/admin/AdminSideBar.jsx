import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { FiMenu, FiX, FiHome, FiUsers, FiLogOut } from 'react-icons/fi';
import { FaBell } from 'react-icons/fa';
import "./AdminSideBar.css";
import logo from '../assets/logo.jpg';

const AdminSideBar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleResize = () => {
            setIsOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch notifications for the logged-in admin's barangay
    useEffect(() => {
        const fetchNotifications = async () => {
            const barangay = localStorage.getItem('barangay');
            if (!barangay) return;
            try {
                const res = await fetch(`http://localhost:8081/api/adminnotifications?barangay=${encodeURIComponent(barangay)}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.notifications)) {
                    // Normalize notification objects for UI
                    setNotifications(
                        data.notifications.map(n => ({
                            ...n,
                            read: n.is_read === 1 || n.is_read === true,
                            date: n.created_at ? n.created_at.split('T')[0] : ''
                        }))
                    );
                }
            } catch (err) {
                console.error('Failed to fetch admin notifications:', err);
            }
        };
        fetchNotifications();
    }, [showNotifModal]); // refetch when modal opens/changes

    const handleLogout = () => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("id");
        localStorage.removeItem("barangay");
        navigate("/", { replace: true });
        setTimeout(() => {
            window.history.pushState(null, "", window.location.href);
            window.onpopstate = () => {
                window.history.pushState(null, "", window.location.href);
            };
        }, 0);
        window.location.reload();
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button 
                className="admin-sidebar-toggle"
                onClick={toggleSidebar}
                aria-label={isOpen ? "Close menu" : "Open menu"}
            >
                {isOpen ? <FiX /> : <FiMenu />}
            </button>

            <div className={`admin-sidebar ${isOpen ? "admin-sidebar-visible" : "admin-sidebar-hidden"}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-logo-container">
                        <img src={logo} alt="Logo" className="admin-sidebar-logo" />
                        <h2 className="admin-sidebar-title">
                            Admin Panel - {localStorage.getItem("barangay") || "Loading..."}
                        </h2>
                    </div>
                </div>
                <ul className="admin-sidebar-menu">
                    <li>
                        <NavLink
                            to="/admin-dashboard/dashboard"
                            className={({ isActive }) => isActive ? 'admin-sidebar-active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                        >
                            <FiHome className="admin-sidebar-nav-icon" />
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin-dashboard/solo-parent"
                            className={({ isActive }) => isActive ? 'admin-sidebar-active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                        >
                            <FiUsers className="admin-sidebar-nav-icon" />
                            <span>Solo Parent</span>
                        </NavLink>
                    </li>
                </ul>
                <div className="admin-sidebar-logout-container">
                    <button onClick={handleLogout} className="admin-sidebar-logout">
                        <FiLogOut className="admin-sidebar-nav-icon" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Right-side notification icon */}
            <div className="notifications-right-side" onClick={() => setShowNotifModal(true)}>
                <FaBell color="#16C47F" />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>

            {isOpen && window.innerWidth < 768 && (
                <div 
                    className="admin-sidebar-overlay"
                    onClick={toggleSidebar}
                    role="button"
                    aria-label="Close sidebar"
                    tabIndex={0}
                />
            )}

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
                                    notifications.filter(n => !n.read).map(n =>
                                        fetch(`http://localhost:8081/api/adminnotifications/mark-as-read/${n.id}`, {method: 'PUT'})
                                    )
                                );
                                setNotifications(notifications.map(n => ({...n, read: true})));
                            } catch (err) {
                                alert('Failed to mark all as read');
                            }
                        }}>Mark all as read</button>
                        <button className="notif-action-btn" onClick={async () => {
                            // Clear all notifications
                            const barangay = localStorage.getItem('barangay');
                            if (!window.confirm('Are you sure you want to clear all notifications?')) return;
                            try {
                                await fetch(`http://localhost:8081/api/adminnotifications?barangay=${encodeURIComponent(barangay)}`, {method: 'DELETE'});
                                setNotifications([]);
                            } catch (err) {
                                alert('Failed to clear notifications');
                            }
                        }}>Clear all</button>
                        <button className="close-modal" onClick={() => setShowNotifModal(false)}><FiX /></button>
                    </div>
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
        </>
    );
};

export default AdminSideBar;
