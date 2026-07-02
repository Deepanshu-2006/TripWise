import Destination from "./components/Destination";
import FeaturesSelection from "./components/FeaturesSelection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RealTimeAdjuster from "./components/RealTimeAdjuster";

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <FeaturesSelection />
      <RealTimeAdjuster />
      <Destination />
    </div>
  );
}
