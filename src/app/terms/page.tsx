"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

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
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 6, 2025</p>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using GalaxyCo.ai (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. We reserve the right to modify these terms at any time, and your continued use of the Service constitutes acceptance of any changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  GalaxyCo.ai is an AI-native workspace platform that provides AI agents, workflow automation, CRM functionality, and related services. We offer various subscription tiers with different features and usage limits as described on our pricing page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To use certain features of the Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Transmit malware, viruses, or other harmful code</li>
                  <li>Harass, abuse, or harm another person or entity</li>
                  <li>Send unsolicited communications (spam)</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Generate or distribute content that is harmful, abusive, or violates our AI usage policies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Subscription and Payments</h2>
                
                <h3 className="text-xl font-medium mb-3 mt-6">5.1 Billing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as explicitly stated in these terms.
                </p>

                <h3 className="text-xl font-medium mb-3 mt-6">5.2 Free Trial</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may offer free trials of paid features. At the end of the trial period, you will be automatically charged unless you cancel before the trial ends.
                </p>

                <h3 className="text-xl font-medium mb-3 mt-6">5.3 Cancellation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You may cancel your subscription at any time. Upon cancellation, you will retain access to paid features until the end of your current billing period.
                </p>

                <h3 className="text-xl font-medium mb-3 mt-6">5.4 Price Changes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to change our prices. Price changes will take effect at the start of your next billing cycle after we provide you with at least 30 days&apos; notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
                
                <h3 className="text-xl font-medium mb-3 mt-6">6.1 Our Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The Service, including all content, features, and functionality, is owned by GalaxyCo.ai and is protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-medium mb-3 mt-6">6.2 Your Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You retain all rights to content you upload, create, or share through the Service. By using the Service, you grant us a limited license to use, store, and process your content solely to provide the Service to you.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. AI Usage and Limitations</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our AI features, including Neptune assistant, are provided for productivity assistance. You understand and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>AI-generated content should be reviewed before use</li>
                  <li>AI responses may not always be accurate or complete</li>
                  <li>You are responsible for how you use AI-generated content</li>
                  <li>AI features should not be used for critical decisions without human review</li>
                  <li>We may use aggregated, anonymized data to improve our AI models</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, GALAXYCO.AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may terminate or suspend your account and access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease. You may request a copy of your data within 30 days of termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms of Service, please contact us:
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
