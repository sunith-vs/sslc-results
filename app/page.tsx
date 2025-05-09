import { ResultsSlideshow } from "@/components/results-slideshow";
import { IntroAnimation } from "@/components/intro-animation";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <IntroAnimation />
      
      <div className="w-full max-w-6xl mx-auto pt-4 px-4">
        <h1 className="text-3xl font-bold text-center text-orange-600 mb-6">
          SSLC Results 2025
        </h1>
        
        <ResultsSlideshow />
      </div>
    </div>
  );
}
