import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Clock, Target, TrendingUp, Shield } from "lucide-react";

const benefits = [
  {
    number: "01",
    icon: Clock,
    title: "Save 10+ Hours Weekly",
    description: "Automate repetitive tasks and focus on what matters",
    metric: "10+",
    metricLabel: "Hours Saved",
    gradient: "from-blue-500 to-cyan-500",
    proof: "Average across 1,000+ teams",
    link: "#time-savings"
  },
  {
    number: "02",
    icon: Target,
    title: "Increase Accuracy",
    description: "AI-powered insights reduce human error by 85%",
    metric: "85%",
    metricLabel: "Error Reduction",
    gradient: "from-purple-500 to-pink-500",
    proof: "Validated by third-party audit",
    link: "#accuracy"
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Boost Productivity",
    description: "Teams report 3x faster task completion",
    metric: "3x",
    metricLabel: "Faster Tasks",
    gradient: "from-orange-500 to-red-500",
    proof: "Based on user surveys",
    link: "#productivity"
  },
  {
    number: "04",
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance",
    metric: "100%",
    metricLabel: "SOC 2 Compliant",
    gradient: "from-green-500 to-emerald-500",
    proof: "Audited annually",
    link: "#security"
  }
];

interface BenefitCardProps {
  benefit: typeof benefits[0];
  index: number;
}

function BenefitCard({ benefit, index }: BenefitCardProps) {
  const Icon = benefit.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-full"
      >
        <Card className="relative border-0 shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-500 h-full overflow-hidden group flex flex-col">
          {/* Colored Accent Bar */}
          <div className={`h-1 bg-gradient-to-r ${benefit.gradient}`} />
          
          {/* Glass morphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-xl" />
          
          {/* Subtle gradient overlay matching card theme */}
          <div 
            className="absolute inset-0 opacity-[0.03] bg-gradient-to-br"
            style={{
              backgroundImage: `linear-gradient(135deg, var(--gradient-start), var(--gradient-end))`,
            }}
          />

          {/* Large watermark number */}
          <div 
            className="absolute top-0 right-0 text-[140px] leading-none opacity-[0.03] pointer-events-none select-none"
            style={{ fontWeight: 800 }}
          >
            {benefit.number}
          </div>

          {/* Content */}
          <div className="relative p-6 flex flex-col flex-1">
            {/* Icon */}
            <motion.div
              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 shadow-md`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>

            {/* Title & Description */}
            <h3 className="text-lg mb-2">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {benefit.description}
            </p>

            {/* Metric - More prominent with matching gradient */}
            <div className="mt-auto">
              <div className={`text-4xl bg-clip-text text-transparent bg-gradient-to-br ${benefit.gradient} mb-1`}>
                {benefit.metric}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {benefit.metricLabel}
              </p>

              {/* Proof Statement - More compact */}
              <div className="flex items-center gap-2 py-3 border-t border-border/30">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {benefit.proof}
                </p>
              </div>
            </div>
          </div>

          {/* Gradient Glow on Hover */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05), transparent 70%)`,
            }}
          />
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function EnhancedBenefits() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
      
      {/* Decorative Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #6366f1 1px, transparent 1px),
            linear-gradient(to bottom, #6366f1 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative Gradient Orbs */}
      <motion.div
        className="absolute top-20 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
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
          <Badge className="mb-4 px-4 py-2 bg-white/90 backdrop-blur-xl text-primary border border-primary/20 shadow-lg">
            Proven Results
          </Badge>
          <h2 className="mb-4 text-3xl lg:text-4xl">
            Why Teams Choose GalaxyCo.ai
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Built for teams that want measurable results, not complexity
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <BenefitCard key={benefit.number} benefit={benefit} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground">
            Join 1,000+ teams already transforming their workflows with AI
          </p>
        </motion.div>
      </div>
    </section>
  );
}
