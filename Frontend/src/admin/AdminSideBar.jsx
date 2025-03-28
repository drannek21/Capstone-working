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
        localStorage.removeItem("adminBarangay");
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
                className="sidebar-toggle"
                onClick={toggleSidebar}
                aria-label={isOpen ? "Close menu" : "Open menu"}
            >
                {isOpen ? <FiX /> : <FiMenu />}
            </button>

            <div className={`sidebar ${isOpen ? "visible" : "hidden"}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <img src={logo} alt="Logo" className="sidebar-logo" />
                    </div>
                    <h2 className="sidebar-title">
                        Admin Panel - {localStorage.getItem("barangay") || "No barangay assigned"}
                    </h2>
                </div>
                <ul className="sidebar-menu">
                    <li>
                        <NavLink
                            to="/admin-dashboard/dashboard"
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                        >
                            <FiHome className="nav-icon" />
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin-dashboard/solo-parent"
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                        >
                            <FiUsers className="nav-icon" />
                            <span>Solo Parent</span>
                        </NavLink>
                    </li>
                </ul>
                <div className="logout-container">
                    <button onClick={handleLogout} className="logout">
                        <FiLogOut className="nav-icon" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {isOpen && window.innerWidth < 768 && (
                <div 
                    className="sidebar-overlay"
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
