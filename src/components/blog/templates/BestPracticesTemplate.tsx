"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, Clock, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { motion } from "framer-motion";

interface BestPracticesTemplateProps {
  title: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  publishedAt: string;
  readTime: number;
  category: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  heroImage?: string;
  tldr?: string[];
  relatedPractices?: Array<{
    title: string;
    slug: string;
  }>;
  children: React.ReactNode;
}

export function BestPracticesTemplate({
  title,
  description,
  author,
  publishedAt,
  readTime,
  category,
  difficulty = "Beginner",
  heroImage,
  tldr,
  relatedPractices = [],
  children
}: BestPracticesTemplateProps) {
  const difficultyConfig = {
    Beginner: { color: "bg-green-500/10 text-green-700", icon: Info },
    Intermediate: {
      color: "bg-accent-cyan-soft text-accent-cyan-ink border-accent-cyan-border",
      icon: Lightbulb,
    },
    Advanced: { color: "bg-warm-soft text-warm-ink border-warm-border", icon: AlertTriangle },
  };

  const config = difficultyConfig[difficulty];
  const DifficultyIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-accent-cyan/5 to-transparent py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <Badge className="bg-accent-cyan-soft text-accent-cyan-ink border-accent-cyan-border">
                {category}
              </Badge>
              <Badge className={config.color}>
                <DifficultyIcon className="h-3 w-3 mr-1" />
                {difficulty}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
            <p className="text-xl text-muted-foreground">{description}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>{new Date(publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {heroImage && (
        <div className="max-w-6xl mx-auto px-6 -mt-8 mb-12">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
            <Image src={heroImage} alt={title} fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Author Card */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{author.name}</div>
                <div className="text-sm text-muted-foreground">{author.role}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TL;DR Section */}
        {tldr && tldr.length > 0 && (
          <Card className="mb-8 bg-gradient-to-br from-accent-cyan-soft to-transparent border-accent-cyan-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-accent-cyan-ink" />
                <h3 className="font-semibold">TL;DR — Key Takeaways</h3>
              </div>
              <ul className="space-y-2">
                {tldr.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-accent-cyan-ink shrink-0 mt-1" />
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          {children}
        </article>

        <Separator className="my-12" />

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-br from-accent-cyan-soft to-transparent border-accent-cyan-border">
          <CardContent className="p-8 text-center space-y-4">
            <Lightbulb className="h-12 w-12 mx-auto text-accent-cyan-ink" />
            <h3 className="text-2xl font-bold">Ready to Apply These Practices?</h3>
            <p className="text-muted-foreground">Put these tips into action with GalaxyCo.ai.</p>
            <Button size="lg" variant="cta">
              Try in Your Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Related Practices */}
        {relatedPractices.length > 0 && (
          <>
            <Separator className="my-12" />
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Related Best Practices</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedPractices.map((practice) => (
                  <Card key={practice.slug} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent-cyan-soft flex items-center justify-center shrink-0">
                        <Lightbulb className="h-5 w-5 text-accent-cyan-ink" />
                      </div>
                      <h3 className="font-semibold line-clamp-2">{practice.title}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
