import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Announcements.css";

// Importing images
import announcement1 from "../assets/images/announcement1.jpg";
import announcement2 from "../assets/images/announcement2.jpg";
import announcement3 from "../assets/images/announcement3.jpg";
import announcement4 from "../assets/images/announcement4.jpg";
import announcement5 from "../assets/images/announcement5.jpg";

const announcements = [
  { id: 1, image: announcement1, title: "Scholarship Application Open", description: "Solo parents can now apply for the 2024 scholarship program!", link: "https://www.youtube.com/watch?v=TIzBuvdLgbg" },
  { id: 2, image: announcement2, title: "Financial Assistance Update", description: "New guidelines for financial assistance have been released.", link: "https://www.youtube.com/watch?v=TIzBuvdLgbg" },
  { id: 3, image: announcement3, title: "Health Benefits Registration", description: "Enroll now to avail free health benefits for solo parents.", link: "https://www.youtube.com/watch?v=TIzBuvdLgbg" },
  { id: 4, image: announcement4, title: "Upcoming Community Event", description: "Join us for a special solo parents gathering this month!", link: "https://www.youtube.com/watch?v=TIzBuvdLgbg" },
  { id: 5, image: announcement5, title: "Government Housing Support", description: "New housing support options are now available for solo parents.", link: "https://www.youtube.com/watch?v=TIzBuvdLgbg" },
];

const Announcements = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePageClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="announcements">
      <h2 className="announcement-title">Latest Announcements</h2>
      <div className="announcement-container">
        <Link to={announcements[currentIndex].link} className="announcement-card">
          <img
            src={announcements[currentIndex].image}
            alt={announcements[currentIndex].title}
            className="announcement-image"
          />
          <div className="announcement-content">
            <h3>{announcements[currentIndex].title}</h3>
            <p>{announcements[currentIndex].description}</p>
          </div>
        </Link>
      </div>

      {/* Pagination Dots */}
      <div className="pagination">
        {announcements.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => handlePageClick(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Announcements;
