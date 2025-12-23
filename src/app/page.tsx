"use client";

import { useRouter } from "next/navigation";
import { Landing } from "@/components/landing/LandingPage";

export default function Home() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  return <Landing onEnterApp={handleEnterApp} />;
}
