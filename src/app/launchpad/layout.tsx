"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Rocket, Search, ArrowLeft, Twitter, Github, Linkedin, Mail, ArrowUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

/**
 * Launchpad Layout
 * 
 * Public blog layout with polished navigation matching the landing page.
 * Users can access without authentication.
 */
export default function LaunchpadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Show back to top button after scrolling
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
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
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {isLoaded && user && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to App</span>
                </Button>
              </Link>
            )}
            <Link href="/launchpad" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md group-hover:shadow-lg transition-shadow">
                <Rocket className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-semibold text-lg">Launchpad</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/launchpad/search">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </Link>
            {isLoaded && !user && (
              <Link href="/sign-in">
                <Button 
                  size="sm" 
                  className="rounded-full px-5 shadow-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
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
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-background via-muted/30 to-muted/50 border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-xl">Launchpad</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
                Practical AI guidance for small business owners. Learn how to leverage AI 
                without the technical complexity.
              </p>
              
              {/* Newsletter Signup */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Stay updated with our newsletter</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-full bg-white border-border/50 h-10 text-sm"
                    disabled={isSubscribing}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  />
                  <Button
                    size="sm"
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-4 h-10 flex-shrink-0 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Explore Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Explore</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/launchpad" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    All Articles
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/category/getting-started" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/category/tutorials" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/category/use-cases" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Use Cases
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/category/industry-news" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Industry News
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/bookmarks" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Saved Articles
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            
            {/* GalaxyCo.ai */}
            <div>
              <h4 className="font-semibold text-sm mb-4">GalaxyCo.ai</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © {new Date().getFullYear()} GalaxyCo.ai. All rights reserved.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-muted to-muted/80 hover:from-indigo-500 hover:to-purple-600 flex items-center justify-center transition-all duration-300 group hover:scale-105 hover:shadow-md"
                  >
                    <social.icon className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
