"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import { landingTokens } from "./config";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="py-12 px-4 border-t"
      style={{
        backgroundColor: landingTokens.sections.background,
        borderColor: `${landingTokens.sections.text}10`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: landingTokens.sections.surface }}
            >
              <Rocket
                className="h-4 w-4"
                style={{ color: landingTokens.sections.accent }}
              />
            </div>
            <span
              className="font-semibold"
              style={{ color: landingTokens.sections.text }}
            >
              GalaxyCo
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: landingTokens.sections.textSecondary }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: landingTokens.sections.textSecondary }}
            >
              Terms
            </Link>
          </div>

          {/* Copyright */}
          <p
            className="text-sm"
            style={{ color: landingTokens.sections.textSecondary }}
          >
            © {currentYear} GalaxyCo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
