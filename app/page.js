import dynamic from 'next/dynamic';
import Header from "./components/Header";
import Hero from "./components/Hero";
import Intro from "./components/Intro";

// Dynamically import heavy below-the-fold UI components to optimize initial load
const Destination = dynamic(() => import("./components/Difference Slider"));
const FeaturesSelection = dynamic(() => import("./components/FeaturesSelection"));
const RealTimeAdjuster = dynamic(() => import("./components/Live Demo"));
const PassportGrid = dynamic(() => import("./components/PassportGrid"));
const FAQAndMarqueeCTA = dynamic(() => import("./components/FAQAndMarqueeCTA"));
const FigmaReveal = dynamic(() => import("./components/FigmaReveal"));
const FigmaPinnedSlide = dynamic(() => import("./components/FigmaPinnedSlide"));

export default function Home() {
  return (
    <>
      {/* Opening animation — position:fixed overlay, first-visit only. */}
      <Intro />

      <main className="w-full max-w-full overflow-x-clip relative">
        <Header />
        <Hero />
        <FeaturesSelection />
        <FigmaPinnedSlide
          baseSection={<RealTimeAdjuster />}
          slideSection={<Destination />}
        />
        <PassportGrid />
        <FAQAndMarqueeCTA />
      </main>
    </>
  );
}
