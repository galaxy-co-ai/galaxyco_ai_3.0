"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Scale, Shield, Globe, FileCheck, CheckCircle } from "lucide-react";

export default function CompliancePage() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const frameworks = [
    {
      name: "GDPR",
      status: "Compliant",
      description: "General Data Protection Regulation compliance for EU users",
      details: [
        "Right to access, rectify, and delete personal data",
        "Data portability upon request",
        "72-hour breach notification",
        "Privacy by design principles",
        "Data Processing Agreements available",
      ],
    },
    {
      name: "CCPA",
      status: "Compliant",
      description: "California Consumer Privacy Act compliance",
      details: [
        "Right to know what data is collected",
        "Right to delete personal information",
        "Right to opt-out of data sale (we don't sell data)",
        "Non-discrimination for exercising rights",
      ],
    },
    {
      name: "SOC 2 Type II",
      status: "Via Infrastructure",
      description: "Security, Availability, and Confidentiality controls",
      details: [
        "Vercel (Hosting) - SOC 2 Type II certified",
        "Neon (Database) - SOC 2 Type II certified",
        "Clerk (Auth) - SOC 2 Type II certified",
        "Stripe (Payments) - PCI-DSS Level 1",
      ],
    },
  ];

  const dataHandling = [
    {
      icon: Shield,
      title: "Data Encryption",
      items: [
        "TLS 1.3 for data in transit",
        "AES-256 for data at rest",
        "Encrypted backups",
      ],
    },
    {
      icon: Globe,
      title: "Data Residency",
      items: [
        "Primary data center: United States",
        "Edge caching: Global (Vercel Edge Network)",
        "EU data residency available for Enterprise",
      ],
    },
    {
      icon: FileCheck,
      title: "Data Retention",
      items: [
        "User data retained while account is active",
        "30-day grace period after account deletion",
        "Backup retention: 30 days",
      ],
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
              Compliance
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              Trust & Compliance
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We take data protection seriously. Learn about our commitment to security, privacy, and regulatory compliance.
            </p>
          </motion.div>
        </section>

        {/* Compliance Frameworks */}
        <section className="py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">Regulatory Compliance</h2>
              </div>
              <p className="text-lg text-muted-foreground">
                Our platform is designed to meet the requirements of major data protection regulations.
              </p>
            </motion.div>

            <div className="space-y-6">
              {frameworks.map((framework, index) => (
                <motion.div
                  key={framework.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-3">
                            {framework.name}
                            <Badge
                              variant="outline"
                              className={
                                framework.status === "Compliant"
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              }
                            >
                              {framework.status}
                            </Badge>
                          </CardTitle>
                          <p className="text-muted-foreground mt-1">{framework.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {framework.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-3 text-muted-foreground">
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Handling */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold mb-4">Data Handling Practices</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                How we protect and manage your data throughout its lifecycle.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {dataHandling.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.items.map((item) => (
                          <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sub-Processors */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold mb-6">Sub-Processors</h2>
              <p className="text-muted-foreground mb-6">
                We use the following third-party services to provide our platform. Each maintains their own compliance certifications:
              </p>
              <div className="bg-muted/30 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Service</th>
                      <th className="text-left py-3 px-4 font-medium">Purpose</th>
                      <th className="text-left py-3 px-4 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Vercel</td>
                      <td className="py-3 px-4">Hosting & CDN</td>
                      <td className="py-3 px-4">Global</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Neon</td>
                      <td className="py-3 px-4">Database</td>
                      <td className="py-3 px-4">US / EU</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Clerk</td>
                      <td className="py-3 px-4">Authentication</td>
                      <td className="py-3 px-4">US</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">OpenAI</td>
                      <td className="py-3 px-4">AI Processing</td>
                      <td className="py-3 px-4">US</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Stripe</td>
                      <td className="py-3 px-4">Payments</td>
                      <td className="py-3 px-4">US</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Twilio</td>
                      <td className="py-3 px-4">Communications</td>
                      <td className="py-3 px-4">US</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Resend</td>
                      <td className="py-3 px-4">Email Delivery</td>
                      <td className="py-3 px-4">US</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Sentry</td>
                      <td className="py-3 px-4">Error Monitoring</td>
                      <td className="py-3 px-4">US</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* DPA Section */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Data Processing Agreement</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Enterprise customers can request a Data Processing Agreement (DPA) that outlines our obligations regarding the processing of personal data on your behalf.
              </p>
              <p className="text-muted-foreground">
                Contact us at <a href="mailto:hello@galaxyco.ai?subject=DPA%20Request" className="text-primary hover:underline">hello@galaxyco.ai</a> to request a DPA.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold mb-4">Questions?</h2>
              <p className="text-muted-foreground">
                For compliance inquiries, please contact us:
              </p>
              <ul className="list-none mt-4 space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> <a href="mailto:hello@galaxyco.ai" className="text-primary hover:underline">hello@galaxyco.ai</a></li>
                <li><strong>Contact Form:</strong> <a href="/contact" className="text-primary hover:underline">galaxyco.ai/contact</a></li>
              </ul>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
