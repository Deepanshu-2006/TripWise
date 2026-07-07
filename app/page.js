import Destination from "./components/Difference Slider";
import FeaturesSelection from "./components/FeaturesSelection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RealTimeAdjuster from "./components/Live Demo";
import PassportGrid from "./components/PassportGrid";
import FAQAndMarqueeCTA from "./components/FAQAndMarqueeCTA";

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <FeaturesSelection />
      <RealTimeAdjuster />
      <Destination />
      <PassportGrid />
      <FAQAndMarqueeCTA />
    </div>
  );
}
