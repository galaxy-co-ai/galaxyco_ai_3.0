"use client";

import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/galaxy/onboarding-flow";

export default function OnboardingPage() {
  const router = useRouter();
  
  const handleComplete = () => {
    router.push("/dashboard");
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
