import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import navigate
import "./AdminSideBar.css";

const AdminSideBar = () => {
    const navigate = useNavigate(); // Initialize navigate function
    const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsOpen(window.innerWidth >= 768); // Open sidebar on large screens
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        // Clear user session
        localStorage.removeItem("userToken");

        // Navigate to login page
        navigate("/", { replace: true });

        // Prevent back navigation
        setTimeout(() => {
            window.history.pushState(null, "", window.location.href);
            window.onpopstate = () => {
                window.history.pushState(null, "", window.location.href);
            };
        }, 0);

        // Reload to clear cached session data
        window.location.reload();
    };

    return (
        <>
            {/* Toggle Button - Only visible on small screens */}
            <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
                ☰
            </button>

            {/* Sidebar */}
            <div className={`sidebar ${isOpen ? "visible" : "hidden"}`}>
                <h2 className="sidebar-title">Admin Panel</h2>
                <ul className="sidebar-menu">
                    <li><button>Dashboard</button></li>
                    <li><button>Users</button></li>
                    <li><button>Settings</button></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
            </div>
        </>
    );
};

export default AdminSideBar;
