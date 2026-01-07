'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Brain, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassAccentCard } from '@/design-system/primitives/glass';

// ============================================================================
// ANIMATED STAR FIELD
// ============================================================================

function Star({ delay, duration, size, left, top }: { 
  delay: number; 
  duration: number; 
  size: number; 
  left: string; 
  top: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left,
        top,
        background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
      }}
      animate={{
        opacity: [0.2, 0.8, 0.2],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Generate star positions deterministically
const stars = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  size: (i % 3) + 1,
  delay: (i * 0.2) % 5,
  duration: 3 + (i % 4),
}));

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-nebula-void" />

      {/* Gradient mesh */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 138, 138, 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 100% 50%, rgba(124, 107, 158, 0.2), transparent),
            radial-gradient(ellipse 50% 30% at 0% 80%, rgba(91, 138, 138, 0.15), transparent)
          `
        }}
      />

      {/* Floating Stars */}
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}

      {/* Animated orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(91, 138, 138, 0.15) 0%, transparent 70%)',
          left: '10%',
          top: '20%',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124, 107, 158, 0.12) 0%, transparent 70%)',
          right: '5%',
          top: '40%',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(158, 123, 138, 0.1) 0%, transparent 70%)',
          left: '60%',
          bottom: '10%',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ============================================================================
// FEATURE PREVIEW CARDS
// ============================================================================

const features = [
  {
    icon: Brain,
    title: 'Neptune AI',
    description: 'Your intelligent CRM co-pilot that understands context and takes action.',
    gradientStyle: 'linear-gradient(135deg, #6aabab, #5B8A8A)',
    shadowColor: 'rgba(91, 138, 138, 0.5)',
    hoverGlow: 'rgba(91, 138, 138, 0.3)',
    borderHover: 'rgba(106, 171, 171, 0.5)',
  },
  {
    icon: Zap,
    title: 'AI Agents',
    description: 'Autonomous agents that handle research, outreach, and follow-ups 24/7.',
    gradientStyle: 'linear-gradient(135deg, #9a84be, #7C6B9E)',
    shadowColor: 'rgba(124, 107, 158, 0.5)',
    hoverGlow: 'rgba(124, 107, 158, 0.3)',
    borderHover: 'rgba(154, 132, 190, 0.5)',
  },
  {
    icon: Shield,
    title: 'Enterprise Ready',
    description: 'SOC 2 compliant with fine-grained permissions and audit logging.',
    gradientStyle: 'linear-gradient(135deg, #8193b3, #5A6B8A)',
    shadowColor: 'rgba(90, 107, 138, 0.5)',
    hoverGlow: 'rgba(90, 107, 138, 0.3)',
    borderHover: 'rgba(129, 147, 179, 0.5)',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const Icon = feature.icon;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.6 + index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        className={cn(
          'h-full group p-6 rounded-2xl relative overflow-hidden',
          'bg-white/[0.03] backdrop-blur-md backdrop-saturate-150',
          'transition-all duration-300',
        )}
        style={{
          border: `1px solid ${isHovered ? feature.borderHover : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isHovered 
            ? `0 20px 60px ${feature.hoverGlow}, 0 0 40px ${feature.hoverGlow}`
            : '0 8px 32px rgba(0,0,0,0.3)',
        }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            opacity: isHovered ? 0.15 : 0,
          }}
          style={{
            background: `radial-gradient(circle at 50% 0%, ${feature.hoverGlow}, transparent 70%)`,
          }}
        />
        
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
          style={{
            background: feature.gradientStyle,
            boxShadow: `0 10px 25px ${feature.shadowColor}`,
          }}
        >
          <Icon className="w-6 h-6 text-white drop-shadow-sm" />
        </div>
        <h3 className="font-semibold text-lg text-white mb-2 relative z-10">
          {feature.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed relative z-10">
          {feature.description}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// WAITLIST FORM
// ============================================================================

function WaitlistForm() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [position, setPosition] = React.useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setPosition(data.position);
      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center"
          >
            <GlassAccentCard hoverable>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-nebula-teal-400 to-nebula-teal-500 shadow-lg shadow-nebula-teal-500/40 flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">
                You&apos;re on the list!
              </h3>
              {position && (
                <p className="text-2xl font-bold text-nebula-teal-300 mb-2">
                  #{position}
                </p>
              )}
              <p className="text-gray-400 text-sm">
                We&apos;ll notify you when Galaxy is ready for launch.
              </p>
            </GlassAccentCard>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                className={cn(
                  'flex-1 h-12 px-4',
                  'bg-white/10 border-white/20',
                  'text-white placeholder:text-gray-400',
                  'focus-visible:border-nebula-teal-400',
                  'focus-visible:ring-nebula-teal-400/30',
                  'rounded-xl'
                )}
              />
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(91, 138, 138, 0.4)',
                    '0 0 40px rgba(91, 138, 138, 0.6)',
                    '0 0 20px rgba(91, 138, 138, 0.4)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="rounded-xl"
              >
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className={cn(
                    'h-12 px-6 rounded-xl',
                    'bg-gradient-to-r from-nebula-teal-600 to-nebula-teal-500',
                    'hover:from-nebula-teal-500 hover:to-nebula-teal-400',
                    'border border-nebula-teal-500/50',
                    'hover:scale-105',
                    'transition-all duration-300',
                    'text-white font-medium',
                    'disabled:opacity-50'
                  )}
                >
                  {status === 'loading' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {status === 'error' && errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center"
              >
                {errorMessage}
              </motion.p>
            )}

            <p className="text-center text-gray-500 text-xs">
              Be among the first to experience the future of CRM
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComingSoonPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Image
            src="/assets/brand/logos/neptune_ai_assistant_logo.svg"
            alt="Galaxy"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="text-xl font-bold text-white tracking-tight">
            Galaxy
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm text-gray-400 font-medium">
            Launching 2025
          </span>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            <span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: 'rgba(91, 138, 138, 0.25)',
                border: '1px solid rgba(106, 171, 171, 0.5)',
                color: '#b5dddd',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: '#8ac5c5' }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: '#6aabab' }}
                />
              </span>
              Now accepting early access signups
            </span>
          </motion.div>

          {/* Headline with glow effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            {/* Hero glow behind text */}
            <div 
              className="absolute inset-0 blur-3xl opacity-60 -z-10"
              style={{
                background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(138, 197, 197, 0.4), transparent 70%)',
              }}
            />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              The AI-Native CRM
              <br />
              <span 
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(to right, #8ac5c5, #b9aad4, #d6b7c1)'
                }}
              >
                Built for Revenue Teams
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Stop managing your CRM. Let Neptune AI handle the busywork while
            autonomous agents research, engage, and nurture your pipeline 24/7.
          </motion.p>

          {/* Waitlist Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.35,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            <WaitlistForm />
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="w-full max-w-5xl mx-auto mt-20 lg:mt-28">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="text-center text-sm font-medium text-gray-500 uppercase tracking-widest mb-8"
          >
            What&apos;s Coming
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} GalaxyCo. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Terms
            </a>
            <a href="/contact" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ComingSoonPage;
