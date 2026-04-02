import { TopBar } from "@/components/home/top-bar";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { AISection } from "@/components/home/ai-section";
import { PricingSection } from "@/components/home/pricing-section";
import { Footer } from "@/components/home/footer";

export default function HomePage() {
  return (
    <main className="homepage-accent min-h-screen bg-background">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>

      <TopBar />

      <div id="main-content">
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <PricingSection />
      </div>

      <Footer />
    </main>
  );
}
