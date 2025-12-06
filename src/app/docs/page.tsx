"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Search, Book, Code, FileText, Terminal, GraduationCap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DocsPage() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const categories = [
    {
      title: "Getting Started",
      icon: Book,
      description: "Quick start guides and core concepts.",
      links: ["Installation", "First Agent", "Workspace Setup"]
    },
    {
      title: "API Reference",
      icon: Code,
      description: "Detailed API endpoints and schemas.",
      links: ["Authentication", "Agents API", "Workflows API"]
    },
    {
      title: "Guides",
      icon: GraduationCap,
      description: "Step-by-step tutorials for common use cases.",
      links: ["Building a CRM Agent", "Custom Integrations", "Webhooks"]
    },
    {
      title: "Platform",
      icon: Terminal,
      description: "Deep dive into platform architecture.",
      links: ["Security", "Rate Limits", "Data Privacy"]
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <CosmicBackground />
      </div>

      <main className="relative z-10 flex-1 pt-24">
        {/* Search Hero */}
        <section className="py-20 px-6 text-center bg-gradient-to-b from-background to-muted/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <Badge className="px-4 py-2 bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-sm">
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              How can we help you build?
            </h1>
            <div className="relative max-w-xl mx-auto mt-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search guides, API reference, and more..." 
                className="pl-12 py-6 text-lg rounded-full shadow-lg border-primary/20 bg-background/80 backdrop-blur-xl focus-visible:ring-primary"
              />
            </div>
          </motion.div>
        </section>

        {/* Categories Grid */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <category.icon className="h-6 w-6" />
                      </div>
                      <CardTitle>{category.title}</CardTitle>
                    </div>
                    <p className="text-muted-foreground">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.links.map((link) => (
                        <li key={link} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                          <FileText className="h-4 w-4 opacity-50" />
                          {link}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Developer CTA */}
        <section className="py-20 px-6">
           <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-1">
             <div className="bg-background rounded-[22px] p-8 md:p-12 text-center space-y-6">
                <h2 className="text-3xl font-bold">Ready to start building?</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Join thousands of developers building the future of AI automation with GalaxyCo.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                   <Button size="lg" onClick={handleEnterApp} className="rounded-full px-8">
                     Get API Keys
                   </Button>
                   <Button size="lg" variant="outline" className="rounded-full px-8">
                     View Examples
                   </Button>
                </div>
             </div>
           </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}





































