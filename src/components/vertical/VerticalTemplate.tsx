"use client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Sparkles, Target, Zap, TrendingUp, Users, BarChart3, Workflow, Palette, Rocket, FileText, Calendar, Brain, Clock, Shield, FolderLock, AlertCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";

export interface VerticalPageData {
  // Hero Section
  badge: string;
  headline: string;
  subheadline: string;
  heroImage?: string;
  
  // Problems Section
  problems: {
    title: string;
    dayToDay: string;
    cost: string;
  }[];
  
  // Solutions Section
  solutions: {
    problem: string;
    solution: string;
    howItWorks: string;
    result: string;
  }[];
  
  // Hero Workflow
  workflow: {
    title: string;
    steps: string[];
    outcome: string;
  };
  
  // Features
  features: {
    icon: string;
    title: string;
    description: string;
  }[];
  
  // Social Proof
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
  
  // Metadata
  targetAudience: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

interface VerticalTemplateProps {
  data: VerticalPageData;
}

export function VerticalTemplate({ data }: VerticalTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <SmartNavigation onEnterApp={() => {}} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="soft" tone="brand" size="pill" className="mb-6 shadow-soft">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              {data.badge}
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {data.headline}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              {data.subheadline}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-accent-cyan to-primary hover:opacity-90 transition-opacity shadow-lg"
                asChild
              >
                <Link href="/sign-up">
                  {data.ctaPrimary}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
              >
                <Link href="/#features">
                  {data.ctaSecondary}
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              ✨ Free until January 2026 • No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              The Problems We Solve
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data.targetAudience}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {data.problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border hover:border-accent-cyan/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-semibold">{problem.title}</h3>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground font-medium mb-1">What it looks like:</p>
                        <p className="text-muted-foreground/90">{problem.dayToDay}</p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground font-medium mb-1">Cost of inaction:</p>
                        <p className="text-destructive/90">{problem.cost}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              How GalaxyCo Solves It
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-native solutions designed specifically for your workflow
            </p>
          </motion.div>

          <div className="space-y-8">
            {data.solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <Badge variant="outline" className="mb-4">
                          Problem #{index + 1}
                        </Badge>
                        <h3 className="text-2xl font-bold mb-2">{solution.problem}</h3>
                        <p className="text-muted-foreground">{solution.solution}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">How it works:</p>
                          <p className="text-foreground">{solution.howItWorks}</p>
                        </div>
                        
                        <div className="bg-accent-cyan/10 rounded-lg p-4 border border-accent-cyan/20">
                          <p className="text-sm font-medium text-accent-cyan mb-2">Result:</p>
                          <p className="text-foreground">{solution.result}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Workflow Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {data.workflow.title}
            </h2>
            <p className="text-lg text-muted-foreground">
              See how it works in 90 seconds
            </p>
          </motion.div>

          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                {data.workflow.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-foreground pt-1">{step}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-accent-cyan/10 to-primary/10 rounded-lg border border-accent-cyan/20">
                <p className="text-sm font-medium text-muted-foreground mb-2">What you get:</p>
                <p className="text-lg font-semibold text-foreground">{data.workflow.outcome}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Key Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need in one platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.features.map((feature, index) => {
              const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                Target, Zap, TrendingUp, Users, BarChart3, Workflow, Palette, Rocket, FileText, Calendar, Brain, Clock, Shield, FolderLock, AlertCircle, MessageSquare, CheckCircle2
              };
              const Icon = iconMap[feature.icon] || Target;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full bg-card/50 backdrop-blur-sm border-border hover:border-accent-cyan/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-accent-cyan/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-accent-cyan" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Section (if provided) */}
      {data.testimonial && (
        <section className="py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 lg:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-accent-cyan/5 to-primary/5 border-accent-cyan/20">
                <CardContent className="p-8 lg:p-12 text-center">
                  <Sparkles className="h-12 w-12 text-accent-cyan mx-auto mb-6" />
                  <blockquote className="text-2xl font-semibold mb-6">
                    "{data.testimonial.quote}"
                  </blockquote>
                  <div>
                    <p className="font-medium">{data.testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{data.testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the public beta and experience AI-powered automation built for your needs.
            </p>
            
            <Button
              size="lg"
              className="bg-gradient-to-r from-accent-cyan to-primary hover:opacity-90 transition-opacity shadow-lg text-lg px-8 py-6"
              asChild
            >
              <Link href="/sign-up">
                Start Free Until January 2026
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Full access • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
