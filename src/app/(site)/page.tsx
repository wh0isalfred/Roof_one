import { AdvisorSection } from "@/components/home/AdvisorSection";
import { BeforeAfterSection } from "@/components/home/BeforeAfterSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { ServicesSection } from "@/components/home/ServicesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AdvisorSection />
      <ServicesSection />
      <HowItWorksSection />
      <ReviewsSection />
      <BeforeAfterSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
