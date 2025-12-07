"use client";

import { useState } from "react";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, MessageSquare, HelpCircle, Building2, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setIsSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "General Inquiries",
      description: "Questions about GalaxyCo.ai",
      contact: "hello@galaxyco.ai",
      href: "mailto:hello@galaxyco.ai",
    },
    {
      icon: HelpCircle,
      title: "Technical Support",
      description: "Help with your account",
      contact: "hello@galaxyco.ai",
      href: "mailto:hello@galaxyco.ai?subject=Support%20Request",
    },
    {
      icon: Building2,
      title: "Enterprise Sales",
      description: "Custom plans and pricing",
      contact: "hello@galaxyco.ai",
      href: "mailto:hello@galaxyco.ai?subject=Enterprise%20Inquiry",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <CosmicBackground />
      </div>

      <main className="relative z-10 flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-16 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
              Contact Us
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              We&apos;d Love to Hear From You
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have a question, feedback, or want to learn more about GalaxyCo.ai? Get in touch and we&apos;ll respond as soon as possible.
            </p>
          </motion.div>
        </section>

        {/* Contact Methods */}
        <section className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.title}
                  href={method.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="text-center">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <method.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <span className="text-primary font-medium">{method.contact}</span>
                    </CardContent>
                  </Card>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                    </p>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          aria-label="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          aria-label="Your email address"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          placeholder="Your company"
                          value={formData.company}
                          onChange={handleChange}
                          aria-label="Your company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="How can we help?"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          aria-label="Message subject"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more about your inquiry..."
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        aria-label="Your message"
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      By submitting this form, you agree to our{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* FAQ CTA */}
        <section className="py-16 px-6 bg-muted/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <h2 className="text-2xl font-bold">Looking for Quick Answers?</h2>
            <p className="text-muted-foreground">
              Check out our documentation and FAQ section for immediate help with common questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push("/docs")}>
                View Documentation
              </Button>
              <Button variant="outline" onClick={() => router.push("/launchpad")}>
                Read Our Blog
              </Button>
            </div>
          </motion.div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
