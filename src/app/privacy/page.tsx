"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 6, 2025</p>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  GalaxyCo.ai (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-native workspace platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium mb-3 mt-6">2.1 Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Account information (name, email address, password)</li>
                  <li>Profile information (company name, job title, profile picture)</li>
                  <li>Content you create (documents, messages, files)</li>
                  <li>Communications with us (support requests, feedback)</li>
                  <li>Payment information (processed securely by Stripe)</li>
                </ul>

                <h3 className="text-xl font-medium mb-3 mt-6">2.2 Information Collected Automatically</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Device information (browser type, operating system)</li>
                  <li>Usage data (features used, pages visited, actions taken)</li>
                  <li>Log data (IP address, access times, error logs)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>To provide and maintain our services</li>
                  <li>To process your transactions and send related information</li>
                  <li>To send you technical notices, updates, and support messages</li>
                  <li>To respond to your comments, questions, and requests</li>
                  <li>To analyze usage and improve our services</li>
                  <li>To detect, prevent, and address technical issues and fraud</li>
                  <li>To train and improve our AI models (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the following third-party services to operate our platform:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Clerk</strong> - Authentication and user management</li>
                  <li><strong>OpenAI</strong> - AI processing for Neptune assistant</li>
                  <li><strong>Stripe</strong> - Payment processing</li>
                  <li><strong>Vercel</strong> - Hosting and file storage</li>
                  <li><strong>Neon</strong> - Database hosting</li>
                  <li><strong>Twilio</strong> - Communication services (SMS, voice)</li>
                  <li><strong>Resend</strong> - Email delivery</li>
                  <li><strong>Sentry</strong> - Error monitoring</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Each of these services has their own privacy policy governing how they handle your data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Access</strong> - Request a copy of your personal data</li>
                  <li><strong>Rectification</strong> - Request correction of inaccurate data</li>
                  <li><strong>Erasure</strong> - Request deletion of your personal data</li>
                  <li><strong>Portability</strong> - Receive your data in a structured format</li>
                  <li><strong>Objection</strong> - Object to certain processing of your data</li>
                  <li><strong>Restriction</strong> - Request restriction of processing</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  To exercise these rights, please contact us at hello@galaxyco.ai.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit (TLS) and at rest, regular security audits, and access controls.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If you become aware that a child has provided us with personal information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us:
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
