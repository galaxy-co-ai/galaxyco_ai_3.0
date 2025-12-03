"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Search, ArrowLeft, Twitter, Github, Linkedin, Mail, ArrowUp, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

// Animated star field for footer
function StarField({ count = 25 }: { count?: number }) {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3
    }));
    setStars(generatedStars);
  }, [count]);

  if (stars.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Launchpad Layout
 * 
 * Public blog layout with polished navigation and premium footer.
 */
export default function LaunchpadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    setIsSubscribing(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      toast.success(data.message);
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setIsSubscribing(false);
    }
  };

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/galaxycoai", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/galaxyco-ai", label: "LinkedIn" },
    { icon: Github, href: "https://github.com/galaxyco-ai", label: "GitHub" },
    { icon: Mail, href: "mailto:hello@galaxyco.ai", label: "Email" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Always dark to match hero and sticky nav */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 backdrop-blur-xl"
      >
        
        <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {isLoaded && user && (
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 rounded-full text-indigo-200/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to App</span>
                </Button>
              </Link>
            )}
            <Link href="/launchpad" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-white">
                Launchpad
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/launchpad/search">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-indigo-200/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </Link>
            {isLoaded && !user && (
              <Link href="/sign-in">
                <Button 
                  size="sm" 
                  className="rounded-full px-5 bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg shadow-white/20 hover:shadow-white/30 transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}

      {/* Footer - Premium with animated background */}
      <footer className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(129,140,248,0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-[350px] h-[350px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        {/* Star Field */}
        <StarField count={30} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-indigo-500/30">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-xl text-white">Launchpad</span>
              </div>
              <p className="text-sm text-indigo-200/70 leading-relaxed mb-6 max-w-xs">
                Practical AI guidance for small business owners. Learn how to leverage AI 
                without the technical complexity.
              </p>
              
              {/* Newsletter Signup */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-white/90">Stay updated with our newsletter</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-full bg-white/10 border-white/20 h-10 text-sm text-white placeholder:text-white/40 focus:bg-white/15 focus:border-indigo-400/50"
                    disabled={isSubscribing}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  />
                  <Button
                    size="sm"
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="rounded-full bg-white text-indigo-600 hover:bg-indigo-50 px-4 h-10 flex-shrink-0 shadow-lg shadow-white/20 hover:shadow-white/30 transition-all duration-300"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Explore Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white">Explore</h4>
              <ul className="space-y-2.5">
                {['All Articles', 'Getting Started', 'Tutorials', 'Use Cases', 'Industry News'].map((item) => (
                  <li key={item}>
                    <Link 
                      href={`/launchpad${item === 'All Articles' ? '' : `/category/${item.toLowerCase().replace(' ', '-')}`}`}
                      className="text-sm text-indigo-200/60 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white">Resources</h4>
              <ul className="space-y-2.5">
                {['Documentation', 'Saved Articles', 'API Reference', 'Community'].map((item, i) => (
                  <li key={item}>
                    <Link 
                      href={i === 1 ? '/launchpad/bookmarks' : i === 0 ? '/docs' : '#'}
                      className="text-sm text-indigo-200/60 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* GalaxyCo.ai */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white">GalaxyCo.ai</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Features', href: '/features' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Get Started', href: '/sign-up' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-indigo-200/60 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white">Legal</h4>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-indigo-200/60 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-sm text-indigo-200/50 text-center md:text-left">
                © {new Date().getFullYear()} GalaxyCo.ai. All rights reserved.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-indigo-400 hover:to-purple-500 flex items-center justify-center transition-all duration-300 group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="h-4 w-4 text-indigo-200/70 group-hover:text-white transition-colors" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
