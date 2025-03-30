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
  { id: 1, image: announcement1, title: "Study Grant Program for Solo Parents and Their Children", description: "This initiative provides financial assistance to eligible solo parents and their children. To qualify, applicants must meet specific criteria, including income thresholds and academic performance standards. Detailed eligibility requirements and application procedures are outlined on CHED's official resources", link: "https://newstoday.ph/ched-scholarship/" },
  { id: 3, image: announcement3, title: "DSWD Pushes for Faster Solo Parent Benefits", description: "DSWD Secretary Rex Gatchalian is urging government agencies to finalize their guidelines for implementing RA 11861 (Expanded Solo Parents’ Welfare Act). While DOLE and TESDA have submitted their benefit lists, other agencies still need to comply.Rep. Erwin Tulfo pledged to follow up during budget hearings to ensure solo parents get their entitled benefits, including ₱1,000 monthly aid, PhilHealth coverage, housing priority, scholarships, and VAT-exempt discounts on essential child needs.The DSWD chairs the Solo Parents’ Inter-agency Committee to oversee implementation. Stay updated for further developments! #SoloParentsRights #RA11861", link: "https://www.dswd.gov.ph/dswd-wants-inter-agency-committee-to-expedite-benefits-to-solo-parents/" },
  { id: 4, image: announcement4, title: "Skills Training and Livelihood Assistance", description: "Solo parents can participate in free training sessions focusing on business management and income-generating skills, provided by agencies such as the Department of Trade and Industry (DTI), DepEd, Department of Labor and Employment (DOLE), CHED, and TESDA. Depending on their circumstances, they might also qualify for employment assistance or receive support in the form of startup capital for a business.", link: "https://digido.ph/articles/solo-parent-benefits?utm_source=chatgpt.com" },
  { id: 5, image: announcement5, title: "Discounts and VAT Exemptions", description: "Solo parents earning less than ₱250,000 annually are entitled to a 10% discount and VAT exemption on purchases of baby essentials such as milk, food, micronutrient supplements, diapers, medicines, vaccines, and other supplements from the child's birth until six years of age. ", link: "https://digido.ph/articles/solo-parent-benefits?utm_source=chatgpt.com" },
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
