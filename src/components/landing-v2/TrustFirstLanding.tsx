"use client";

import { useRef, useCallback } from "react";
import { MinimalNav } from "./MinimalNav";
import { HeroSection } from "./HeroSection";
import { ValueSection } from "./ValueSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { FinalCTA } from "./FinalCTA";
import { LandingFooter } from "./LandingFooter";

export function TrustFirstLanding() {
  const valueSectionRef = useRef<HTMLDivElement>(null);

  const handleHeroComplete = useCallback(() => {
    // Smooth scroll to value section after pull-up bar completion
    valueSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Minimal navigation */}
      <MinimalNav />

      {/* Hero with Pull-Up Bar */}
      <HeroSection onComplete={handleHeroComplete} />

      {/* Value demonstration */}
      <div ref={valueSectionRef}>
        <ValueSection />
      </div>

      {/* How it works */}
      <HowItWorksSection />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
