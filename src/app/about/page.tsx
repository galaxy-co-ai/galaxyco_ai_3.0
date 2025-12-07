"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Rocket, Target, Heart, Zap, Users, Globe, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const values = [
    {
      icon: Zap,
      title: "Innovation First",
      description: "We push the boundaries of what's possible with AI, constantly evolving to bring you cutting-edge technology.",
    },
    {
      icon: Users,
      title: "Customer Obsessed",
      description: "Your success is our success. We build every feature with our users' needs at the forefront.",
    },
    {
      icon: Heart,
      title: "Transparency",
      description: "We believe in open communication, honest pricing, and being upfront about what our AI can and can't do.",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "AI should be for everyone. We're committed to making advanced technology accessible to businesses of all sizes.",
    },
  ];

  const stats = [
    { value: "10+", label: "Hours saved weekly per user" },
    { value: "1,000+", label: "Teams using GalaxyCo" },
    { value: "98%", label: "Customer satisfaction" },
    { value: "24/7", label: "AI availability" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <CosmicBackground />
      </div>

      <main className="relative z-10 flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
              About Us
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold">
              Building the Future of Work
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We&apos;re on a mission to give every business the power of AI automation, making intelligent workflows accessible to teams of all sizes.
            </p>
          </motion.div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe that AI should work for you, not the other way around. GalaxyCo.ai was founded on the principle that intelligent automation should be as easy to use as sending an email, yet powerful enough to transform how businesses operate.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our platform combines AI agents, workflow automation, and intelligent CRM into one seamless experience, helping teams save 10+ hours every week on repetitive tasks so they can focus on what truly matters—growing their business and serving their customers.
                </p>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="text-center p-6">
                        <CardContent className="p-0">
                          <div className="text-3xl font-bold text-primary">{stat.value}</div>
                          <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-purple-500" />
              </div>
              <h2 className="text-3xl font-bold">What We&apos;ve Built</h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  GalaxyCo.ai is an AI-native workspace platform that integrates intelligent agents and automated workflows into one seamless experience. We&apos;ve built three core pillars: a Knowledge Base that keeps your company documentation organized and searchable, an AI-Native CRM that auto-transcribes calls and meetings into actionable data, and an AI Assistant Hub that orchestrates specialized agents for every workflow.
                </p>
                <p>
                  Our Neptune AI assistant works 24/7—handling email triage, data entry, report generation, meeting scheduling, and more. It learns your preferences, executes tasks autonomously, and thinks ahead so you don&apos;t have to.
                </p>
                <p>
                  Everything in GalaxyCo.ai is designed to be controlled through natural language. If you can describe what you want in plain English, Neptune can make it happen.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full text-center p-6">
                    <CardContent className="p-0 space-y-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-muted/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <h2 className="text-3xl font-bold">Ready to Transform Your Workflow?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of teams already saving 10+ hours every week with GalaxyCo.ai
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleEnterApp} className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/contact")}>
                Contact Us
              </Button>
            </div>
          </motion.div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
