import Destination from "./components/Difference Slider";
import FeaturesSelection from "./components/FeaturesSelection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RealTimeAdjuster from "./components/Live Demo";
import PassportGrid from "./components/PassportGrid";
import FAQAndMarqueeCTA from "./components/FAQAndMarqueeCTA";
import FigmaReveal from "./components/FigmaReveal";
import FigmaPinnedSlide from "./components/FigmaPinnedSlide";
import Intro from "./components/Intro";

export default function Home() {
  return (
    <>
      {/* Opening animation — position:fixed overlay, first-visit only.
          Renders client-side only (ssr:false) so sessionStorage is safe. */}
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
