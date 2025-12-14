import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowRight, Play, CheckCircle2, Sparkles, Users, Star } from "lucide-react";

interface FooterCTAProps {
  onEnterApp: () => void;
}

interface StarData {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

// Animated stars background for CTA - generates positions only on client to avoid hydration mismatch
const CTAStarField = () => {
  const [stars, setStars] = useState<StarData[]>([]);

  useEffect(() => {
    // Generate star positions only on client side to avoid hydration mismatch
    const generatedStars = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
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
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
};

export function FooterCTA({ onEnterApp }: FooterCTAProps) {
  const benefits = [
    { icon: CheckCircle2, text: "Free until Jan 1, 2026" },
    { icon: CheckCircle2, text: "No credit card required" },
    { icon: CheckCircle2, text: "Setup in 5 minutes" },
  ];

  return (
    <div className="py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="relative p-8 lg:p-12 border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.2)] bg-gradient-to-br from-void-black via-primary to-void-black text-white overflow-hidden">
            {/* Animated Background */}
            <CTAStarField />
            
            {/* Animated Gradient Orbs */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.3, 1],
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1.3, 1, 1.3],
                x: [0, -30, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Badge */}
              <motion.div
                className="flex justify-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Badge className="px-4 py-2 bg-white/20 backdrop-blur-xl text-white border border-white/30 shadow-lg">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                  </motion.div>
                  <span className="text-sm">Beta Launch — Free Until Jan 1, 2026</span>
                </Badge>
              </motion.div>

              {/* Headline */}
              <motion.h2
                className="text-3xl lg:text-4xl text-center mb-4 text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Ready to Save 10+ Hours Weekly?
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-base lg:text-lg text-center mb-8 text-white/80 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Join hundreds of teams already using AI to automate their workflows. 
                Start your free trial today—no credit card required.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-3 lg:gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full bg-white text-primary hover:bg-white/90 shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_70px_rgba(255,255,255,0.4)] transition-all duration-300 px-8 py-6 group"
                  onClick={onEnterApp}
                >
                  Join Free Beta
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto rounded-full border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-xl px-8 py-6 transition-all duration-300 group"
                  onClick={onEnterApp}
                >
                  <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </motion.div>

              {/* Benefits */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-8 flex-wrap"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2 text-sm text-white/90"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  >
                    <benefit.icon className="h-4 w-4 text-green-300 flex-shrink-0" />
                    <span>{benefit.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Social Proof */}
              <motion.div
                className="flex items-center justify-center gap-6 mt-8 pt-8 border-t border-white/20"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[
                      "from-accent-cyan to-primary",
                      "from-warm to-primary",
                      "from-accent-cyan to-warm",
                      "from-primary to-accent-cyan",
                    ].map((gradient, i) => (
                      <div 
                        key={i} 
                        className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-white/20 flex items-center justify-center`}
                      >
                        <Users className="h-4 w-4 text-white" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs lg:text-sm text-white/80">1,000+ teams</span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-warm text-warm" />
                    ))}
                  </div>
                  <span className="text-xs lg:text-sm text-white/80">4.9/5 rating</span>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
