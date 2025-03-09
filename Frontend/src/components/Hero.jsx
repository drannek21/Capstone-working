import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import "./Hero.css";
import logo from "../assets/logo.jpg";

const Hero = () => {
  const navigate = useNavigate(); // ✅ Initialize navigation

  const scrollToAbout = () => {
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <img src={logo} alt="Solo Parents Welfare Logo" className="hero-logo" />
        <div className="hero-text">
          <h2 className="herotitle">Support for Solo Parents in Santa Maria</h2>
          <p>Providing assistance and welfare programs for solo parents.</p>
          <div className="hero-buttons">
            {/* ✅ Updated Login button to navigate to /login */}
            <button className="login-hero" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="learn-more" onClick={scrollToAbout}>
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
