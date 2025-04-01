import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Announcements.css";

// Importing images
import announcement1 from "../assets/images/announcement1.jpg";
import announcement3 from "../assets/images/announcement3.jpg";
import announcement4 from "../assets/images/announcement4.jpg";
import announcement5 from "../assets/images/announcement5.jpg";

const announcements = [
  {
    id: 1,
    image: announcement1,
    title: "Study Grant Program for Solo Parents and Their Children",
    description: "This initiative provides financial assistance to eligible solo parents and their children. To qualify, applicants must meet specific criteria, including income thresholds and academic performance standards.",
    link: "https://newstoday.ph/ched-scholarship/"
  },
  {
    id: 3,
    image: announcement3,
    title: "DSWD Pushes for Faster Solo Parent Benefits",
    description: "DSWD Secretary Rex Gatchalian is urging government agencies to finalize their guidelines for implementing RA 11861. Benefits include ₱1,000 monthly aid, PhilHealth coverage, and more.",
    link: "https://www.dswd.gov.ph/dswd-wants-inter-agency-committee-to-expedite-benefits-to-solo-parents/"
  },
  {
    id: 4,
    image: announcement4,
    title: "Skills Training and Livelihood Assistance",
    description: "Free training sessions on business management and income-generating skills, provided by DTI, DepEd, DOLE, CHED, and TESDA. Includes potential startup capital support.",
    link: "https://digido.ph/articles/solo-parent-benefits?utm_source=chatgpt.com"
  },
  {
    id: 5,
    image: announcement5,
    title: "Discounts and VAT Exemptions",
    description: "Solo parents earning under ₱250,000 annually get 10% discount and VAT exemption on baby essentials from birth until six years of age.",
    link: "https://digido.ph/articles/solo-parent-benefits?utm_source=chatgpt.com"
  },
];

const Announcements = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handlePrevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
      );
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleDotClick = (index) => {
    if (!isAnimating && index !== currentIndex) {
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  return (
    <section className="announcements">
      <div className="announcements-header">
        <h2 className="announcement-title">Announcements</h2>
        <p className="announcement-subtitle">Stay informed about the latest programs and benefits</p>
      </div>

      <div className="announcement-container">
        <button 
          className="nav-button prev" 
          onClick={handlePrevSlide}
          aria-label="Previous announcement"
        >
          ‹
        </button>

        <Link 
          to={announcements[currentIndex].link} 
          className={`announcement-card ${isAnimating ? 'animating' : ''}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="card-image-container">
            <img
              src={announcements[currentIndex].image}
              alt={announcements[currentIndex].title}
              className="announcement-image"
            />
          </div>
          <div className="announcement-content">
            <span className="announcement-tag">Program Update</span>
            <h3>{announcements[currentIndex].title}</h3>
            <p>{announcements[currentIndex].description}</p>
            <span className="read-more">
              Read More <span className="arrow">→</span>
            </span>
          </div>
        </Link>

        <button 
          className="nav-button next" 
          onClick={handleNextSlide}
          aria-label="Next announcement"
        >
          ›
        </button>
      </div>

      <div className="pagination">
        {announcements.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to announcement ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Announcements;
