import ViperAudioPlayer from "@/components/ViperAudioPlayer";
import WhatItDoes from "@/components/WhatItDoes";
import DeploymentTargets from "@/components/DeploymentTargets";
import Specs from "@/components/Specs";
import Security from "@/components/Security";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen text-white relative">
      <ViperAudioPlayer />
      <WhatItDoes />
      <DeploymentTargets />
      <Specs />
      <Security />
      <Footer />
    </main>
  );
}
