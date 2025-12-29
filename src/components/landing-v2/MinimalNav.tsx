"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import { landingTokens } from "./config";

export function MinimalNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div
        className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: `${landingTokens.hero.background}ee`,
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ backgroundColor: landingTokens.hero.chipBg }}
          >
            <Rocket
              className="h-5 w-5 transition-colors duration-200"
              style={{ color: landingTokens.hero.text }}
            />
          </div>
          <span
            className="font-semibold text-lg"
            style={{ color: landingTokens.hero.text }}
          >
            GalaxyCo
          </span>
        </Link>

        {/* Sign In — subtle */}
        <Link
          href="/sign-in"
          className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
          style={{ color: landingTokens.hero.textSecondary }}
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
}
