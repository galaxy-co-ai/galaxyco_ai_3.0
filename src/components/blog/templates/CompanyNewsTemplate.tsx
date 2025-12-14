"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Clock, Share2, Users, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { motion } from "framer-motion";

interface CompanyNewsTemplateProps {
  title: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  publishedAt: string;
  readTime: number;
  category: "Company Update" | "Team News" | "Milestone" | "Behind the Scenes";
  heroImage?: string;
  relatedNews?: Array<{
    title: string;
    slug: string;
    category: string;
  }>;
  children: React.ReactNode;
}

export function CompanyNewsTemplate({
  title,
  description,
  author,
  publishedAt,
  readTime,
  category,
  heroImage,
  relatedNews = [],
  children
}: CompanyNewsTemplateProps) {
  const categoryConfig = {
    "Company Update": { color: "bg-electric-cyan/10 text-electric-cyan border-electric-cyan/30", icon: Building2 },
    "Team News": { color: "bg-creamsicle/10 text-creamsicle border-creamsicle/30", icon: Users },
    "Milestone": { color: "bg-green-500/10 text-green-700", icon: TrendingUp },
    "Behind the Scenes": { color: "bg-purple-500/10 text-purple-700", icon: Users }
  };

  const config = categoryConfig[category];
  const CategoryIcon = config.icon;

  const handleShare = (platform: "twitter" | "linkedin") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${title} - ${description}`;
    
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    } else {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
    }
  };

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
            <Badge className={config.color}>
              <CategoryIcon className="h-3 w-3 mr-1" />
              {category}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
            <p className="text-xl text-muted-foreground">{description}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{new Date(publishedAt).toLocaleDateString()}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleShare("twitter")}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
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

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          {children}
        </article>

        <Separator className="my-12" />

        {/* Share Section */}
        <div className="flex items-center justify-between py-6">
          <div className="text-sm text-muted-foreground">
            Share this news with your network
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleShare("twitter")}>
              Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("linkedin")}>
              LinkedIn
            </Button>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-electric-cyan/10 to-transparent border-electric-cyan/30">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Be Part of Our Journey</h3>
            <p className="text-muted-foreground">
              Join us as we build the future of AI-powered work
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-electric-cyan text-void-black hover:bg-electric-cyan/90">
                Join Beta
              </Button>
              <Button size="lg" variant="outline">
                Follow Our Journey
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <>
            <Separator className="my-12" />
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Related News</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedNews.map((news) => {
                  const newsConfig = categoryConfig[news.category as keyof typeof categoryConfig] || categoryConfig["Company Update"];
                  const NewsIcon = newsConfig.icon;
                  
                  return (
                    <Card key={news.slug} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-electric-cyan/10 flex items-center justify-center shrink-0">
                            <NewsIcon className="h-5 w-5 text-electric-cyan" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-electric-cyan mb-1">{news.category}</div>
                            <h3 className="font-semibold line-clamp-2">{news.title}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
