"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Lock, Server, Eye, Key, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const securityFeatures = [
    {
      icon: Lock,
      title: "Encryption",
      description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
    },
    {
      icon: Server,
      title: "Infrastructure Security",
      description: "Hosted on Vercel's secure, SOC 2 compliant infrastructure with automatic DDoS protection.",
    },
    {
      icon: Eye,
      title: "Access Controls",
      description: "Role-based access control (RBAC) with multi-factor authentication support via Clerk.",
    },
    {
      icon: Key,
      title: "API Security",
      description: "Secure API keys, rate limiting, and request validation on all endpoints.",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <CosmicBackground />
      </div>

      <main className="relative z-10 flex-1 pt-24">
        <section className="py-12 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold">Security</h1>
            </div>
            <p className="text-muted-foreground mb-12 text-lg">
              Your data security is our top priority. Learn about the measures we take to protect your information.
            </p>

            {/* Security Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">Our Security Practices</h2>
                
                <h3 className="text-xl font-medium mb-3 mt-6">Data Encryption</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>TLS 1.3 encryption for all data in transit</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Secure key management with regular rotation</li>
                  <li>Encrypted database backups</li>
                </ul>

                <h3 className="text-xl font-medium mb-3 mt-6">Authentication & Authorization</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Secure authentication powered by Clerk</li>
                  <li>Multi-factor authentication (MFA) support</li>
                  <li>Single sign-on (SSO) for Enterprise customers</li>
                  <li>Session management with automatic timeout</li>
                  <li>Role-based access control (RBAC)</li>
                </ul>

                <h3 className="text-xl font-medium mb-3 mt-6">Infrastructure Security</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Hosted on Vercel&apos;s global edge network</li>
                  <li>Automatic DDoS protection and mitigation</li>
                  <li>Regular security patches and updates</li>
                  <li>Isolated compute environments</li>
                  <li>Geographic redundancy for high availability</li>
                </ul>

                <h3 className="text-xl font-medium mb-3 mt-6">Application Security</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Input validation and sanitization</li>
                  <li>Protection against SQL injection and XSS attacks</li>
                  <li>Rate limiting on all API endpoints</li>
                  <li>Secure headers (HSTS, CSP, etc.)</li>
                  <li>Regular dependency vulnerability scanning</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Compliance</h2>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {["GDPR Ready", "CCPA Compliant", "SOC 2 Type II*"].map((item) => (
                    <div key={item} className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  *Our infrastructure providers (Vercel, Neon, Clerk) are SOC 2 Type II certified.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Data Handling</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Data is processed only for its intended purpose</li>
                  <li>We do not sell your data to third parties</li>
                  <li>AI model training uses anonymized, aggregated data only (with consent)</li>
                  <li>Data retention policies align with your subscription tier</li>
                  <li>You can export or delete your data at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Incident Response</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We have established incident response procedures to quickly address any security issues. In the unlikely event of a data breach, we will notify affected users within 72 hours as required by GDPR and other applicable regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Responsible Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We welcome reports from security researchers. If you discover a vulnerability, please report it responsibly:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground">
                  <li><strong>Email:</strong> hello@galaxyco.ai (subject: Security Report)</li>
                  <li><strong>Response Time:</strong> We will acknowledge receipt within 48 hours</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Please do not publicly disclose the issue until we have had a chance to address it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about our security practices, please contact us:
                </p>
                <ul className="list-none mt-4 space-y-2 text-muted-foreground">
                  <li><strong>Email:</strong> hello@galaxyco.ai</li>
                  <li><strong>Website:</strong> https://www.galaxyco.ai/contact</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
