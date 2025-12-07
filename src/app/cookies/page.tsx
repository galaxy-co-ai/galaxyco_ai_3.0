"use client";

import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CookiesPage() {
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
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 6, 2025</p>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences and provide a better user experience. We use cookies and similar technologies to make GalaxyCo.ai work properly, improve performance, and provide personalized features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
                
                <h3 className="text-xl font-medium mb-3 mt-6">2.1 Essential Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These cookies are necessary for the website to function properly. They cannot be disabled.
                </p>
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium">Cookie</th>
                        <th className="text-left py-2 font-medium">Purpose</th>
                        <th className="text-left py-2 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2">__clerk_db_jwt</td>
                        <td className="py-2">Authentication session</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2">__client_uat</td>
                        <td className="py-2">User authentication token</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr>
                        <td className="py-2">__session</td>
                        <td className="py-2">Session management</td>
                        <td className="py-2">Session</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-medium mb-3 mt-6">2.2 Functional Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These cookies enable enhanced functionality and personalization.
                </p>
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium">Cookie</th>
                        <th className="text-left py-2 font-medium">Purpose</th>
                        <th className="text-left py-2 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2">theme</td>
                        <td className="py-2">Remember dark/light mode preference</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr>
                        <td className="py-2">sidebar_collapsed</td>
                        <td className="py-2">Remember sidebar state</td>
                        <td className="py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-medium mb-3 mt-6">2.3 Analytics Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These cookies help us understand how visitors interact with our website.
                </p>
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium">Cookie</th>
                        <th className="text-left py-2 font-medium">Purpose</th>
                        <th className="text-left py-2 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="py-2">_ga, _gid</td>
                        <td className="py-2">Google Analytics (if enabled)</td>
                        <td className="py-2">2 years / 24 hours</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Some cookies are placed by third-party services that appear on our pages:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Clerk</strong> - Authentication and session management</li>
                  <li><strong>Stripe</strong> - Payment processing (when making purchases)</li>
                  <li><strong>Sentry</strong> - Error tracking and performance monitoring</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You can control and manage cookies in several ways:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Browser Settings</strong> - Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites.</li>
                  <li><strong>Opt-Out Links</strong> - You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Please note that disabling certain cookies may impact the functionality of our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Updates to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about our use of cookies, please contact us:
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
