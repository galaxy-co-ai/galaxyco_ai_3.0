"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Share2, BookOpen, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { motion } from "framer-motion";

interface TutorialSection {
  id: string;
  title: string;
  level: number;
}

interface TutorialTemplateProps {
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
  heroImage?: string;
  sections: TutorialSection[];
  relatedPosts?: Array<{
    title: string;
    slug: string;
    image?: string;
  }>;
  children: React.ReactNode;
}

export function TutorialTemplate({
  title,
  description,
  author,
  publishedAt,
  readTime,
  category,
  heroImage,
  sections,
  relatedPosts = [],
  children
}: TutorialTemplateProps) {
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
      <div className="bg-gradient-to-b from-accent-cyan/5 to-transparent py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <Badge className="bg-accent-cyan-soft text-accent-cyan-ink border-accent-cyan-border">
              {category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
            <p className="text-xl text-muted-foreground">{description}</p>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
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

      {/* Hero Image */}
      {heroImage && (
        <div className="max-w-6xl mx-auto px-6 -mt-8 mb-12">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-lg">
            <Image
              src={heroImage}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_280px] gap-12">
          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
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

            {/* Article Body */}
            <div className="space-y-6">
              {children}
            </div>

            <Separator className="my-12" />

            {/* Share Section */}
            <div className="flex items-center justify-between py-6">
              <div className="text-sm text-muted-foreground">
                Found this helpful? Share it with your team!
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

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <>
                <Separator className="my-12" />
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Related Tutorials</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {relatedPosts.map((post) => (
                      <Card key={post.slug} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4 space-y-3">
                          {post.image && (
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                              <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto font-normal text-accent-cyan-ink hover:underline underline-offset-4"
                          >
                            Read more <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </article>

          {/* Table of Contents Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-accent-cyan-ink" />
                  <h3 className="font-semibold">Table of Contents</h3>
                </div>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block text-sm hover:text-accent-cyan transition-colors ${
                        section.level === 2 ? "pl-0" : "pl-4"
                      }`}
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Share Card */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Share this tutorial</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleShare("twitter")}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handleShare("linkedin")}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
