import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import "./Hero.css";
import logo from "../assets/logo.jpg";

const PrivacyModal = ({ onClose, onProceed }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h3>Privacy Notice</h3>
      <p>We are dedicated to protecting your privacy and ensuring the security of your personal information. We collect only the data necessary for providing our services and use it exclusively for those purposes. Your information will not be shared with third parties without your consent. We have implemented robust security measures to safeguard your data from unauthorized access or misuse.</p>
      <p className="note-text">NOTE: Valid E-mail is required</p>
      <div className="modal-buttons">
        <button className="proceed-btn" onClick={onProceed}>
          Proceed
        </button>
      </div>
    </div>
  </div>
);

const Hero = () => {
  const navigate = useNavigate(); // ✅ Initialize navigation
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const scrollToAbout = () => {
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignUpClick = () => {
    setShowPrivacyModal(true);
  };

  const handleProceed = () => {
    setShowPrivacyModal(false);
    navigate("/signup");
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <img src={logo} alt="Solo Parents Welfare Logo" className="hero-logo" />
        <div className="hero-text">
          <h2 className="herotitle">Support for Solo Parents in Santa Maria</h2>
          <p>Providing assistance and welfare programs for solo parents.</p>
          <div className="hero-buttons">
            <button className="sign-up" onClick={handleSignUpClick}>
              Sign Up
            </button>
            <button className="learn-more" onClick={scrollToAbout}>
              Learn More
            </button>
          </div>
        </div>
      </div>
      {showPrivacyModal && (
        <PrivacyModal 
          onClose={() => setShowPrivacyModal(false)} 
          onProceed={handleProceed}
        />
      )}
    </section>
  );
};

export default Hero;
