"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Users, Clock, Share2, Building2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: string;
  change?: string;
}

interface CaseStudyTemplateProps {
  title: string;
  subtitle: string;
  customer: {
    name: string;
    logo?: string;
    industry: string;
    size: string;
  };
  publishedAt: string;
  readTime: number;
  heroImage?: string;
  metrics: Metric[];
  challenge: string;
  solution: string;
  results: string;
  quote?: {
    text: string;
    author: string;
    role: string;
  };
  relatedCaseStudies?: Array<{
    title: string;
    slug: string;
    customer: string;
  }>;
  children?: React.ReactNode;
}

export function CaseStudyTemplate({
  title,
  subtitle,
  customer,
  publishedAt,
  readTime,
  heroImage,
  metrics,
  challenge,
  solution,
  results,
  quote,
  relatedCaseStudies = [],
  children
}: CaseStudyTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-electric-cyan/5 to-transparent py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <Badge className="bg-electric-cyan/10 text-electric-cyan border-electric-cyan/30">
              Case Study
            </Badge>
            
            {/* Customer Info */}
            <div className="flex items-center gap-4">
              {customer.logo && (
                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-white">
                  <Image src={customer.logo} alt={customer.name} fill className="object-contain p-2" />
                </div>
              )}
              <div>
                <div className="text-2xl font-bold">{customer.name}</div>
                <div className="text-muted-foreground">{customer.industry} • {customer.size}</div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
            <p className="text-xl text-muted-foreground">{subtitle}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{new Date(publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-electric-cyan/5 to-transparent border-electric-cyan/20">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-electric-cyan mb-1">{metric.value}</div>
                  {metric.change && (
                    <div className="text-sm text-green-600 flex items-center justify-center gap-1 mb-2">
                      <TrendingUp className="h-3 w-3" />
                      {metric.change}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {heroImage && (
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
            <Image src={heroImage} alt={title} fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Challenge */}
        <section>
          <h2 className="text-3xl font-bold mb-4">The Challenge</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{challenge}</p>
        </section>

        <Separator />

        {/* Solution */}
        <section>
          <h2 className="text-3xl font-bold mb-4">The Solution</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{solution}</p>
          {children}
        </section>

        {/* Quote */}
        {quote && (
          <>
            <Separator />
            <Card className="bg-gradient-to-br from-electric-cyan/5 to-transparent border-electric-cyan/20">
              <CardContent className="p-8">
                <blockquote className="text-xl italic mb-4">&ldquo;{quote.text}&rdquo;</blockquote>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-semibold">{quote.author}</div>
                    <div className="text-sm text-muted-foreground">{quote.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Separator />

        {/* Results */}
        <section>
          <h2 className="text-3xl font-bold mb-4">The Results</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{results}</p>
        </section>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-electric-cyan/10 to-transparent border-electric-cyan/30">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Ready for Similar Results?</h3>
            <p className="text-muted-foreground">See how GalaxyCo.ai can transform your business operations.</p>
            <Button size="lg" className="bg-electric-cyan text-void-black hover:bg-electric-cyan/90">
              Get Started Free
            </Button>
          </CardContent>
        </Card>

        {/* Related Case Studies */}
        {relatedCaseStudies.length > 0 && (
          <>
            <Separator />
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">More Success Stories</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedCaseStudies.map((study) => (
                  <Card key={study.slug} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="text-sm text-electric-cyan mb-2">{study.customer}</div>
                      <h3 className="font-semibold line-clamp-2">{study.title}</h3>
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
