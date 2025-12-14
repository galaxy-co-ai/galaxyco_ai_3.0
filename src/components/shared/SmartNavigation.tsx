"use client";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "../ui/button";
import { LogIn, Menu, X } from "lucide-react";

interface SmartNavigationProps {
  onEnterApp?: () => void;
}

export function SmartNavigation({ onEnterApp }: SmartNavigationProps) {
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Navigation links
  const navLinks = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
    { label: "Docs", href: "/docs" }
  ];

  // Detect active section (Removed as we are now using pages)
  /*
  useEffect(() => {
    const handleScroll = () => {
      // ... removed legacy scroll detection ...
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  */

  // Smooth scroll to section (Updated to simple navigation)
  const handleNavigation = (href: string) => {
    window.location.href = href;
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50"
        initial={{ y: 0 }}
      >
        {/* Progress Bar - Removed as it's less relevant for multi-page nav */}
        
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              onClick={() => window.location.href = "/"}
            >
              {/* Rocket Logo - Show on larger screens */}
              <div className="hidden sm:block relative">
                <BrandLogo
                  size="nav"
                  tone="onLight"
                  className="group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>
              {/* Mobile - Just text */}
              <span className="text-lg font-semibold sm:hidden">GalaxyCo.ai</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className="rounded-full transition-all duration-300 hover:bg-gray-100"
                  onClick={() => handleNavigation(link.href)}
                >
                  {link.label}
                </Button>
              ))}
              {onEnterApp && (
                <Button
                  onClick={onEnterApp}
                  className="rounded-full shadow-lg bg-deep-space text-ice-white hover:bg-deep-space/90 transition-all duration-300"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Enter App
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        className="fixed top-[73px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-border/50 md:hidden overflow-hidden"
        initial={false}
        animate={{
          height: mobileMenuOpen ? "auto" : 0,
          opacity: mobileMenuOpen ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 py-6 space-y-3">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className="w-full justify-start rounded-full"
              onClick={() => handleNavigation(link.href)}
            >
              {link.label}
            </Button>
          ))}
          {onEnterApp && (
            <Button
              onClick={() => {
                onEnterApp();
                setMobileMenuOpen(false);
              }}
              className="w-full rounded-full shadow-lg bg-deep-space text-ice-white hover:bg-deep-space/90"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Enter App
            </Button>
          )}
        </div>
      </motion.div>

      {/* Spacer to prevent content jump */}
      <div className="h-[73px]" />
    </>
  );
}

