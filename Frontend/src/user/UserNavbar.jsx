import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import "./UserNavbar.css";

const UserNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showLogoutPopup) {
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, "", window.location.href);
      };
    }
  }, [showLogoutPopup]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/", { replace: true });
    setTimeout(() => {
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, "", window.location.href);
      };
    }, 0);
    window.location.reload();
  };

  const handleClickOutside = (e) => {
    if (e.target.classList.contains("logout-popup")) {
      setShowLogoutPopup(false);
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

        <ul className={`nav-links ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
          <li>
            <button className="notif-bell">
              <FontAwesomeIcon icon={faBell} />
            </button>
          </li>
          <li>
            <Link to="/track">Track</Link>
          </li>
          <li className="logout-item">
            <button onClick={() => setShowLogoutPopup(true)}>Logout</button>
          </li>
        </ul>
      </div>

      {showLogoutPopup && (
        <div className="logout-popup show" onClick={handleClickOutside}>
          <div className="popup-content">
            <h3>Are you sure you want to log out?</h3>
            <div className="popup-buttons">
              <button className="confirm" onClick={handleLogout}>Yes, Log Out</button>
              <button className="cancel" onClick={() => setShowLogoutPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;
