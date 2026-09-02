import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhatItDoes from "@/components/WhatItDoes";
import DeploymentTargets from "@/components/DeploymentTargets";
import AudioDemo from "@/components/AudioDemo";
import Specs from "@/components/Specs";
import Security from "@/components/Security";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-vaani-bg">
      <Navbar />
      <Hero />
      <WhatItDoes />
      <DeploymentTargets />
      <AudioDemo />
      <Specs />
      <Security />
      <Footer />
    </main>
  );
}
