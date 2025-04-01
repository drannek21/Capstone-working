import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { FiMenu, FiX, FiHome, FiUsers, FiLogOut } from 'react-icons/fi';
import "./AdminSideBar.css";
import logo from '../assets/logo.jpg';

const AdminSideBar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

            {isOpen && window.innerWidth < 768 && (
                <div 
                    className="admin-sidebar-overlay"
                    onClick={toggleSidebar}
                    role="button"
                    aria-label="Close sidebar"
                    tabIndex={0}
                />
            )}
        </>
    );
};

export default AdminSideBar;
