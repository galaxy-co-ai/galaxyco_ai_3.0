"use client";

import { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NewsletterSignupProps {
  variant?: 'default' | 'compact' | 'card';
  className?: string;
}

// Star field for the card variant
function CardStarField() {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3
    }));
    setStars(generatedStars);
  }, []);

  if (stars.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
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

export function NewsletterSignup({ variant = 'default', className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setIsSubscribed(true);
      toast.success(data.message);
      setEmail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2",
        variant === 'card' && "relative p-8 rounded-2xl overflow-hidden",
        className
      )}>
        {variant === 'card' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
            <CardStarField />
          </>
        )}
        <div className={cn(
          "relative z-10 flex items-center gap-2",
          variant === 'card' ? "text-green-400" : "text-green-600"
        )}>
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">You&apos;re subscribed!</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "relative p-10 rounded-2xl overflow-hidden text-center",
        className
      )}>
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-0 right-1/4 w-48 h-48 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(129,140,248,0.5) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        {/* Star field */}
        <CardStarField />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-5">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-white">Stay Updated</h3>
          <p className="text-indigo-200/70 mb-7 max-w-md mx-auto">
            Get practical AI tips delivered to your inbox. No spam, just value.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-11 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-indigo-400/50"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-11 rounded-full px-6 bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg shadow-white/20 hover:shadow-white/30 transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-indigo-300/50 mt-5">
            Unsubscribe anytime. We respect your inbox.
          </p>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Subscribe
        </Button>
      </div>
    </form>
  );
}
