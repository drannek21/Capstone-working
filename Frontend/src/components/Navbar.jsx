import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToAbout = (e) => {
    e.preventDefault();
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const scrollToContacts = (e) => {
    e.preventDefault();
    const contactsSection = document.getElementById("contacts");
    if (contactsSection) {
      contactsSection.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles["navbar-container"]}>
        {/* ✅ Logo */}
        <Link to="/" className={styles["navbar-logo"]}>
          Solo Parent Welfare
        </Link>

        {/* ✅ Hamburger Button */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
        </button>

        {/* ✅ Navigation Menu */}
        <ul
          className={`${styles["nav-links"]} ${menuOpen ? styles.open : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <li>
            <Link to="/" className={styles["nav-link"]} onClick={scrollToTop}>
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={styles["nav-link"]}
              onClick={scrollToAbout}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/Contacts"
              className={styles["nav-link"]}
              onClick={scrollToContacts}
            >
              Contacts
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
