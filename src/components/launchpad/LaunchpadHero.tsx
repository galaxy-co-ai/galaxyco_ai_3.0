"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
}

interface LaunchpadHeroProps {
  categories: Category[];
  hasContent: boolean;
}

// Animated star field - matching footer aesthetic
function StarField({ count = 40 }: { count?: number }) {
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
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 5 + 3,
      delay: Math.random() * 4
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
            opacity: [0.1, 0.7, 0.1],
            scale: [1, 1.4, 1],
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

// Small star field for the sticky nav
function NavStarField() {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3
    }));
    setStars(generatedStars);
  }, []);

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
            opacity: [0.05, 0.4, 0.05],
            scale: [1, 1.2, 1],
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

export function LaunchpadHero({ categories, hasContent }: LaunchpadHeroProps) {
  const pathname = usePathname();
  
  // Determine active tab based on current route
  const getActiveTab = () => {
    if (pathname === '/launchpad/learn') return 'learn';
    if (pathname === '/launchpad/bookmarks') return 'saved';
    if (pathname.startsWith('/launchpad/')) return 'discover';
    return 'discover'; // default to discover
  };
  
  const activeTab = getActiveTab();
  
  const tabs = [
    { id: 'discover', label: 'Discover', href: '/launchpad' },
    { id: 'learn', label: 'Learn', href: '/launchpad/learn' },
    { id: 'docs', label: 'Docs', href: '/docs', external: true },
    { id: 'saved', label: 'Saved', href: '/launchpad/bookmarks' },
  ];
  
  return (
    <>
      {/* Hero Section - with overflow hidden for orbs */}
      <section className="relative overflow-hidden">
        {/* Dark Gradient Background - matching footer */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
        
        {/* Animated Gradient Orbs - matching footer */}
        <motion.div
          className="absolute top-0 right-1/4 w-[500px] h-[400px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(129,140,248,0.5) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-[400px] h-[350px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        
        {/* Star Field - matching footer */}
        <StarField count={45} />
        
        {/* Grid Pattern - matching footer */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Hero Content - pt-24 accounts for fixed header (h-16) + extra spacing */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-12">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-indigo-200 text-sm font-medium mb-6 backdrop-blur-sm border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="h-3.5 w-3.5" />
              AI for Business Owners
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-wide text-white"
              style={{ letterSpacing: '0.04em' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              AI Made Simple
            </motion.h1>
          </div>
        </div>
      </section>

      {/* Sticky Category Navigation - OUTSIDE the overflow-hidden section */}
      <div className="sticky top-16 z-40 relative overflow-hidden">
        {/* Match hero gradient - positioned to continue seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-purple-950" />
        
        {/* Subtle star particles */}
        <NavStarField />
        
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-4">
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-1 p-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const TabButton = (
                  <button 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-lg hover:bg-indigo-50' 
                        : 'text-indigo-200/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
                
                if (tab.external) {
                  return (
                    <Link key={tab.id} href={tab.href} target="_blank" rel="noopener noreferrer">
                      {TabButton}
                    </Link>
                  );
                }
                
                return (
                  <Link key={tab.id} href={tab.href}>
                    {TabButton}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
