"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Rocket, Clock, Share2, Sparkles, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { motion } from "framer-motion";

interface Feature {
  title: string;
  description: string;
  icon?: React.ElementType;
}

interface ProductUpdateTemplateProps {
  title: string;
  version?: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  publishedAt: string;
  readTime: number;
  category: "Major Update" | "Minor Update" | "Bug Fix" | "New Feature";
  heroImage?: string;
  features: Feature[];
  whatChanged?: string;
  whyItMatters?: string;
  howToUse?: string;
  children?: React.ReactNode;
}

export function ProductUpdateTemplate({
  title,
  version,
  description,
  author,
  publishedAt,
  readTime,
  category,
  heroImage,
  features,
  whatChanged,
  whyItMatters,
  howToUse,
  children
}: ProductUpdateTemplateProps) {
  const categoryConfig = {
    "Major Update": { color: "bg-electric-cyan text-void-black", icon: Rocket },
    "Minor Update": { color: "bg-electric-cyan/10 text-electric-cyan border-electric-cyan/30", icon: Sparkles },
    "Bug Fix": { color: "bg-green-500/10 text-green-700", icon: CheckCircle2 },
    "New Feature": { color: "bg-creamsicle/10 text-creamsicle border-creamsicle/30", icon: Sparkles }
  };

  const config = categoryConfig[category];
  const CategoryIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-electric-cyan/5 to-transparent py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <Badge className={config.color}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {category}
              </Badge>
              {version && (
                <Badge variant="outline">
                  Version {version}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
            <p className="text-xl text-muted-foreground">{description}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
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

        {/* Key Features */}
        <div className="mb-12 space-y-4">
          <h2 className="text-2xl font-bold">What's New</h2>
          <div className="grid gap-4">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon || CheckCircle2;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-lg bg-electric-cyan/10 flex items-center justify-center shrink-0">
                          <FeatureIcon className="h-5 w-5 text-electric-cyan" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* What Changed */}
        {whatChanged && (
          <>
            <Separator className="my-12" />
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">What Changed</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">{whatChanged}</p>
              </div>
            </section>
          </>
        )}

        {/* Why It Matters */}
        {whyItMatters && (
          <>
            <Separator className="my-12" />
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Why It Matters</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">{whyItMatters}</p>
              </div>
            </section>
          </>
        )}

        {/* How To Use */}
        {howToUse && (
          <>
            <Separator className="my-12" />
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">How to Use It</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">{howToUse}</p>
              </div>
            </section>
          </>
        )}

        {children && (
          <>
            <Separator className="my-12" />
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {children}
            </div>
          </>
        )}

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-br from-electric-cyan/10 to-transparent border-electric-cyan/30">
          <CardContent className="p-8 text-center space-y-4">
            <Rocket className="h-12 w-12 mx-auto text-electric-cyan" />
            <h3 className="text-2xl font-bold">Try It Now</h3>
            <p className="text-muted-foreground">Experience these new features in your dashboard.</p>
            <Button size="lg" className="bg-electric-cyan text-void-black hover:bg-electric-cyan/90">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
