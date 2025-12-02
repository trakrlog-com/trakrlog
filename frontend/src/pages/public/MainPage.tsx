import React from "react";
import { Hero } from "../../components/public/Hero";
import { Navbar } from "../../components/public/Navbar";
import { Features } from "../../components/public/Features";
import { Footer } from "../../components/public/Footer";
import { Divider } from "../../components/public/Divider";
import GetStartedNow from "../../components/public/GetStartedNow";

export const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Divider />
      <Features />

      <GetStartedNow />
      <Divider />
      <Footer />
    </div>
  );
};
