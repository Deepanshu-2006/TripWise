import Destination from "./components/Difference Slider";
import FeaturesSelection from "./components/FeaturesSelection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RealTimeAdjuster from "./components/Live Demo";
import PassportGrid from "./components/PassportGrid";
import FAQAndMarqueeCTA from "./components/FAQAndMarqueeCTA";
import FigmaReveal from "./components/FigmaReveal";

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <FeaturesSelection />
      <FigmaReveal id="section-live-demo" index={0}>
        <RealTimeAdjuster />
      </FigmaReveal>
      <FigmaReveal id="section-slider" index={1}>
        <Destination />
      </FigmaReveal>
      <PassportGrid />
      <FAQAndMarqueeCTA />
    </div>
  );
}
