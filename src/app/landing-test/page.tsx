"use client";

import { useRouter } from "next/navigation";
import { GuidedSystemsLanding } from "@/components/landing/GuidedSystemsLanding";

export default function LandingTest() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  return <GuidedSystemsLanding onEnterApp={handleEnterApp} />;
}
