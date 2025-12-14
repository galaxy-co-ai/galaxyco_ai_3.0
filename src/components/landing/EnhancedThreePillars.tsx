import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BookOpen, Users, Brain, CheckCircle2, ArrowRight } from "lucide-react";
import { useState, useRef } from "react";

const pillars = [
  {
    id: "01",
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Centralized company documentation that's always up-to-date",
    gradient: "from-accent-cyan to-primary",
    bgGradient: "from-accent-cyan-soft to-card",
    glowColor: "rgba(0, 229, 255, 0.22)",
    stats: ["Smart Search", "AI Organization", "Version Control"],
    link: "#knowledge",
  },
  {
    id: "02",
    icon: Users,
    title: "AI-Native CRM",
    description: "Auto-transcribe calls, meetings, and emails into actionable data",
    gradient: "from-warm to-primary",
    bgGradient: "from-warm-soft to-card",
    glowColor: "rgba(255, 179, 117, 0.22)",
    stats: ["Auto Transcription", "Smart Insights", "Pipeline Tracking"],
    link: "#crm",
  },
  {
    id: "03",
    icon: Brain,
    title: "AI Assistant Hub",
    description: "Orchestrate specialized agents for every workflow",
    gradient: "from-accent-cyan to-warm",
    bgGradient: "from-accent-cyan-soft via-card to-warm-soft",
    glowColor: "rgba(0, 229, 255, 0.18)",
    stats: ["24/7 Automation", "Multi-Agent", "Custom Workflows"],
    link: "#assistant",
  },
];

interface PillarCardProps {
  pillar: typeof pillars[0];
  index: number;
}

function PillarCard({ pillar, index }: PillarCardProps) {
  const [isChecked, setIsChecked] = useState<boolean[]>([false, false, false]);
  const hasAnimated = useRef(false);

  const Icon = pillar.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      onViewportEnter={() => {
        // Only animate once
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        
        // Animate checkmarks when card comes into view
        pillar.stats.forEach((_, i) => {
          setTimeout(() => {
            setIsChecked(prev => {
              const newChecked = [...prev];
              newChecked[i] = true;
              return newChecked;
            });
          }, 300 + i * 150);
        });
      }}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className={`relative p-8 border border-border shadow-[0_20px_70px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_90px_rgba(0,0,0,0.15)] transition-shadow duration-500 cursor-pointer group h-full overflow-hidden bg-gradient-to-br ${pillar.bgGradient}`}>
          {/* Numbered Badge */}
          <div className="absolute top-6 right-6">
            <Badge 
              className={`px-3 py-1 bg-gradient-to-r ${pillar.gradient} text-white border-0 text-xs`}
            >
              {pillar.id}
            </Badge>
          </div>

          {/* Glow Effect on Hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${pillar.glowColor}, transparent 70%)`,
            }}
          />

          {/* Icon */}
          <motion.div
            className={`relative h-16 w-16 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-6 shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Icon className="h-8 w-8 text-white" />
            
            {/* Icon Glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, ${pillar.glowColor}, transparent)`,
              }}
            />
          </motion.div>

          {/* Title */}
          <h3 className="mb-3 text-2xl group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-cyan group-hover:to-warm transition-all duration-300">
            {pillar.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed text-base">
            {pillar.description}
          </p>

          {/* Stats with Animated Checkmarks */}
          <div className="space-y-3 mb-6 p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/60">
            {pillar.stats.map((stat, statIdx) => (
              <motion.div
                key={statIdx}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={isChecked[statIdx] ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isChecked[statIdx] ? { scale: 1 } : {}}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${pillar.gradient} flex items-center justify-center flex-shrink-0`}>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </motion.div>
                <span className="text-sm">{stat}</span>
              </motion.div>
            ))}
          </div>

          {/* Learn More CTA */}
          <Button
            variant="ghost"
            className="w-full justify-between group/btn hover:bg-gradient-to-r hover:from-accent-cyan-soft hover:to-warm-soft transition-all duration-300"
            asChild
          >
            <a href={pillar.link}>
              <span className="text-sm">Learn More</span>
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </a>
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function EnhancedThreePillars() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent-cyan-soft/20 to-background" />
      
      {/* Decorative Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Subtle Floating Orbs - Reduced */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.45) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,179,117,0.45) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4 px-4 py-2 bg-primary text-primary-foreground border border-accent-cyan/25 shadow-soft">
            Three Pillars of AI-Native Productivity
          </Badge>
          <h2 className="mb-4 text-3xl lg:text-4xl">
            Everything you need to transform your company
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Our platform integrates seamlessly into your workflow, delivering measurable results from day one
          </p>
        </motion.div>

        {/* Pillar Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <PillarCard key={pillar.id} pillar={pillar} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
