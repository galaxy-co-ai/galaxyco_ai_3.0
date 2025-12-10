import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "../ui/button";
import { Sparkles, LogIn, Menu, X } from "lucide-react";

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
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "#docs" }
  ];

  // Detect active section
  useEffect(() => {
    const handleScroll = () => {
      // Detect active section
      const sections = ["features", "pricing", "docs"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (href: string) => {
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50"
        initial={{ y: 0 }}
      >
        {/* Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
          style={{ width: progressWidth }}
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">GalaxyCo.ai</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className={`rounded-full transition-all duration-300 ${
                    activeSection === link.href.replace("#", "")
                      ? "bg-gradient-to-r from-blue-100 to-purple-100 text-primary"
                      : ""
                  }`}
                  onClick={() => scrollToSection(link.href)}
                >
                  {link.label}
                </Button>
              ))}
              {onEnterApp && (
                <Button
                  onClick={onEnterApp}
                  className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
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
              className={`w-full justify-start rounded-full ${
                activeSection === link.href.replace("#", "")
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 text-primary"
                  : ""
              }`}
              onClick={() => scrollToSection(link.href)}
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
              className="w-full rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
