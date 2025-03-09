import React from "react";
import "./About.css";
import aboutImage1 from "../assets/aboutImage.jpg";

const About = () => {
  return (
    <section className="about-minimal blue-bg"id="about">
      <div className="about-header"> {/* Added header div */}
        <h1>About Us</h1>
      </div>
      <div className="about-cards-container">
        <div className="about-card-minimal">
          <img src={aboutImage1} alt="Community Support" className="about-image-minimal" />
          <div className="about-text-minimal">
            <h2>Community Support</h2>
            <p>
              Building a strong network for solo parents through shared experiences and mutual aid.
            </p>
          </div>
        </div>

        <div className="about-card-minimal">
          <img src={aboutImage1} alt="Empowerment Programs" className="about-image-minimal" />
          <div className="about-text-minimal">
            <h2>Empowerment Programs</h2>
            <p>
              Providing resources and skills training to foster independence and growth.
            </p>
          </div>
        </div>

        <div className="about-card-minimal">
          <img src={aboutImage1} alt="Accessible Resources" className="about-image-minimal" />
          <div className="about-text-minimal">
            <h2>Accessible Resources</h2>
            <p>
              Ensuring vital information and assistance are readily available to all solo parents.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;