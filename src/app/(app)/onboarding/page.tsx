import { OnboardingFlow } from "@/components/galaxy/onboarding-flow";

export default function OnboardingPage() {
  return <OnboardingFlow onComplete={() => window.location.href = "/dashboard"} />;
}

