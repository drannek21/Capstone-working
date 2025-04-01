import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";
import logo from "../assets/logo.jpg";

const PrivacyModal = ({ onClose, onProceed }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Privacy Notice</h3>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>
      <div className="modal-body">
        <p>We are dedicated to protecting your privacy and ensuring the security of your personal information. We collect only the data necessary for providing our services and use it exclusively for those purposes.</p>
        <p>Your information will not be shared with third parties without your consent. We have implemented robust security measures to safeguard your data from unauthorized access or misuse.</p>
        <p className="note-text">Note: Valid e-mail is required</p>
      </div>
      <div className="modal-buttons">
        <button className="proceed-btn" onClick={onProceed}>
          Proceed
        </button>
      </div>
    </div>
  </div>
);

const Hero = () => {
  const navigate = useNavigate();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
      <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
        <div className="hero-left">
          <img src={logo} alt="Solo Parents Welfare Logo" className="hero-logo" />
        </div>
        <div className="hero-right">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-title-line">Support for Solo Parents</span>
              <span className="hero-title-line accent">in Santa Maria</span>
            </h1>
            <p className="hero-description">
              Empowering solo parents through comprehensive assistance and welfare programs. 
              Join our community and access the support you deserve.
            </p>
            <div className="hero-buttons">
              <button className="sign-up" onClick={handleSignUpClick}>
                <span className="button-text">Sign Up</span>
                <span className="button-icon">→</span>
              </button>
              <button className="learn-more" onClick={scrollToAbout}>
                Learn More
              </button>
            </div>
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
