import Destination from "./components/Difference Slider";
import FeaturesSelection from "./components/FeaturesSelection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RealTimeAdjuster from "./components/Live Demo";
import PassportGrid from "./components/PassportGrid";
import FAQAndMarqueeCTA from "./components/FAQAndMarqueeCTA";
import FigmaReveal from "./components/FigmaReveal";
import FigmaPinnedSlide from "./components/FigmaPinnedSlide";

export default function Home() {
  return (
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
  );
}
