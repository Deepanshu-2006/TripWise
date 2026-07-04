import Destination from "./components/Destination";
import FeaturesSelection from "./components/FeaturesSelection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RealTimeAdjuster from "./components/RealTimeAdjuster";
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
