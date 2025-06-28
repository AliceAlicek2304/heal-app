import React from "react";
import Navbar from "../../components/layout/Navbar/Navbar";
import Hero from "../../components/layout/Hero/Hero";
import Services from "../../components/layout/Service/Service";
import LatestBlogPosts from "../../components/layout/LatestBlogPosts/LatestBlogPosts";
import Testimonials from "../../components/layout/Testimonials/Testimonials";
import Footer from "../../components/layout/Footer/Footer";
import "./HomePage.module.css";

const HomePage = () => {
  return (
    <div className="homepage">
      <Navbar />
      <Hero />
      <Services />
      <LatestBlogPosts />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default HomePage;