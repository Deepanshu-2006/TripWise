import Destination from "./components/Difference Slider";
import FeaturesSelection from "./components/FeaturesSelection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RealTimeAdjuster from "./components/Live Demo";
import PassportGrid from "./components/PassportGrid";
import FAQAndMarqueeCTA from "./components/FAQAndMarqueeCTA";
import ColorMorphWrapper from "./components/ColorMorphWrapper";

export default function Home() {
  return (
    <ColorMorphWrapper>
      <Header />
      <div data-color="#FEF8F5">
        <Hero />
      </div>
      <div data-color="#F0FDFA">
        <FeaturesSelection />
      </div>
      <div data-color="#FFF1EB">
        <RealTimeAdjuster />
      </div>
      <div data-color="#F9FAFB">
        <Destination />
      </div>
      <div data-color="#FFF8F5">
        <PassportGrid />
      </div>
      <FAQAndMarqueeCTA /> {/* Already has internal data-color tags */}
    </ColorMorphWrapper>
  );
}
