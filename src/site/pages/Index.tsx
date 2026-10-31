import Layout from "@/site/components/Layout";
import HeroSection from "@/site/components/home/HeroSection";
import TrustStrip from "@/site/components/home/TrustStrip";
import SolutionSection from "@/site/components/home/SolutionSection";
import FeaturesOverviewSection from "@/site/components/home/FeaturesOverviewSection";
import AnalyzeSection from "@/site/components/home/AnalyzeSection";
import HowItWorksSection from "@/site/components/home/HowItWorksSection";
import CollaborateSection from "@/site/components/home/CollaborateSection";
import TestimonialsSection from "@/site/components/home/TestimonialsSection";
import FAQSection from "@/site/components/home/FAQSection";
import CTASection from "@/site/components/home/CTASection";
import DashboardShowcaseSection from "@/site/components/home/DashboardShowcaseSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <TrustStrip />
      <SolutionSection />
      <FeaturesOverviewSection />
      <DashboardShowcaseSection />
      <AnalyzeSection />
      <HowItWorksSection />
      <CollaborateSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
