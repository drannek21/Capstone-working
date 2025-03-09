import React from "react";
import Hero from "../components/Hero"; // ✅ Fix: Correct import path
import Announcements from "../components/Announcements";
import About from "../components/About";
import Contacts from "../components/Contacts";


const MainPage = () => {
  return (
    <>
      <Hero />
      <Announcements />
      <About />
      <Contacts />
    </>
  );
};

export default MainPage;
