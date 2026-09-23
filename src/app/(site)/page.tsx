import { AdvisorIntroSection } from "@/components/home/AdvisorIntroSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { IssueSelectorSection } from "@/components/home/IssueSelectorSection";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { ServicesSection } from "@/components/home/ServicesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <IssueSelectorSection />
      <AdvisorIntroSection />
      <HowItWorksSection />
      <ServicesSection />
      <ProjectsSection />
      <ReviewsSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
