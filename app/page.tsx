import { ResultsSlideshow } from "@/components/results-slideshow";
import { IntroAnimation } from "@/components/intro-animation";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-orange-50">
      <IntroAnimation />
      
      <div className="w-full">
        <h1 className="text-3xl font-bold text-center text-orange-600 mb-4 pt-2">
          +2 results 2025 Eduport.
        </h1>
        
        <ResultsSlideshow />
      </div>
    </div>
  );
}
