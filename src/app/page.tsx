
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import AuthRedirect from "@/components/shared/AuthRedirect";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AIReviewSection from "@/components/landing/AIReviewSection";
import GamificationSection from "@/components/landing/GamificationSection";
import MarketplaceSection from "@/components/landing/MarketplaceSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <AuthRedirect />
      <Navbar />
      <main className="flex flex-col">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AIReviewSection />
        <GamificationSection />
        <MarketplaceSection />
        {/* <TestimonialsSection /> */}
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
