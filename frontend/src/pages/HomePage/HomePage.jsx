import React from "react";
import Navbar from "../../components/layout/Navbar/Navbar";
import Hero from "../../components/layout/Hero/Hero";
import Services from "../../components/layout/Service/Service";
import "./HomePage.module.css";

const HomePage = () => {
  return (
    <div className="homepage">
      <Navbar />
      <Hero />
      <Services />
    </div>
  );
};

export default HomePage;