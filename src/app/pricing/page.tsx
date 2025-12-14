"use client";

import { Suspense, useState, useEffect } from "react";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, X, Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// TODO: Replace these with your actual Stripe Price IDs from your Stripe Dashboard
// Go to Products > Select Product > Copy the Price ID (starts with price_)
const STRIPE_PRICE_IDS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
};

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    priceId: STRIPE_PRICE_IDS.starter,
    description: "Perfect for individuals and hobbyists exploring AI.",
    betaAccess: false,
    features: [
      "1 AI Agent",
      "500 Monthly Tasks",
      "Basic Workflow Builder",
      "Community Support",
      "7-day Data Retention"
    ],
    limitations: [
      "No Custom Integrations",
      "No Team Collaboration",
      "No API Access"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    price: "$99",
    period: "/mo",
    priceId: STRIPE_PRICE_IDS.pro,
    description: "For professionals and small teams scaling operations.",
    features: [
      "Unlimited AI Agents",
      "10,000 Monthly Tasks",
      "Advanced Workflows",
      "Priority Email Support",
      "Unlimited Data Retention",
      "5 Team Members",
      "Custom Integrations"
    ],
    limitations: [
      "No SSO / SAML",
      "Shared Compute Resources"
    ],
    cta: "Start Free Beta",
    popular: true,
    betaAccess: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceId: undefined, // Contact sales
    description: "For large organizations requiring security and control.",
    betaAccess: false,
    features: [
      "Unlimited Everything",
      "Dedicated Compute",
      "SSO & Advanced Security",
      "Dedicated Success Manager",
      "Custom Data Retention",
      "Audit Logs",
      "SLA Guarantee"
    ],
    limitations: [],
    cta: "Contact Sales",
    popular: false
  }
];

/**
 * Component that handles checkout cancellation via search params
 * Wrapped in Suspense to allow static generation
 */
function CheckoutCancelledHandler() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const checkoutCancelled = searchParams.get('checkout') === 'cancelled';
    if (checkoutCancelled) {
      toast.info('Checkout cancelled. Feel free to try again when you\'re ready.');
    }
  }, [searchParams]);

  return null;
}

function PricingContent() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleEnterApp = () => {
    router.push("/dashboard");
  };

  const handleSubscribe = async (planName: string, priceId: string | undefined) => {
    // Enterprise = Contact Sales
    if (planName === 'Enterprise') {
      router.push('/contact?subject=Enterprise%20Inquiry');
      return;
    }

    // If no price ID configured, go to dashboard (free access for now)
    if (!priceId) {
      toast.info('Subscription not configured yet. Enjoy free access!');
      router.push('/dashboard');
      return;
    }

    setLoadingPlan(planName);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <SmartNavigation onEnterApp={handleEnterApp} />
      
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <CosmicBackground />
      </div>

      <main className="relative z-10 flex-1 pt-24">
        <section className="py-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
              Flexible Pricing
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold">
              Choose the Plan That Fits Your Growth
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transparent pricing with no hidden fees. Start for free and scale as you grow.
            </p>
          </motion.div>
        </section>

        {/* Beta Launch Banner */}
        <section className="py-6 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-blue-500/10 border-2 border-violet-400/30 backdrop-blur-md shadow-xl">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-blue-500/5 animate-pulse" />
              
              <div className="relative p-8 md:p-10 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
                  <Badge className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 text-sm font-semibold">
                    Beta Launch Special
                  </Badge>
                  <Sparkles className="h-6 w-6 text-fuchsia-500 animate-pulse" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600">
                  All Pro Features Free Until January 1, 2026
                </h2>
                
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  We're actively building and your feedback shapes our roadmap. Join now, unlock everything, 
                  and help us create the AI platform you've always wanted.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Your data is yours, forever</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Cancel anytime, keep your data</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`h-full flex flex-col relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                      {plan.betaAccess && (
                        <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1">Free Beta</Badge>
                      )}
                    </div>
                  )}
                  {!plan.popular && plan.betaAccess && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1">Free Beta</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4 mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                      {plan.betaAccess && (
                        <div className="mt-1">
                          <span className="text-xs text-muted-foreground">Full pricing begins Jan 1, 2026</span>
                        </div>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      {plan.limitations.map((limitation) => (
                        <div key={limitation} className="flex items-start gap-3 text-muted-foreground opacity-70">
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <X className="h-3 w-3" />
                          </div>
                          <span className="text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-electric-cyan text-void-black hover:bg-electric-cyan/90' : ''}` }
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.name, plan.priceId)}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === plan.name ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <div className="space-y-6 text-left">
               {[
                 { q: "What does Beta mean for me?", a: "You get full access to all Pro features completely free until January 1, 2026. We're actively building and your feedback directly shapes our roadmap. Think of it as being a founding member of our community." },
                 { q: "Will I lose my data when Beta ends?", a: "Never. Your data is yours, forever. Whether you're on a free plan, paid plan, or cancelled account, we never delete your data without explicit permission. Export anytime, keep everything." },
                 { q: "What features are coming next?", a: "Check out our public roadmap on the Features page. We're building advanced automation workflows, expanded integrations, and enterprise security features. Vote on what you want to see first!" },
                 { q: "How long is free access available?", a: "All Pro features are free until January 1, 2026. After that, you can choose a plan that fits your needs. Early beta users will receive special pricing and exclusive perks as a thank you." },
                 { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges fairly." },
                 { q: "Do I need a credit card to join?", a: "No credit card required during beta. Just sign up and start building. We'll give you plenty of notice before any billing begins." }
               ].map((faq, i) => (
                 <Card key={i} className="bg-background/50 backdrop-blur-sm">
                   <CardHeader>
                     <CardTitle className="text-lg">{faq.q}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-muted-foreground">{faq.a}</p>
                   </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      {/* Wrap useSearchParams in Suspense for static generation */}
      <Suspense fallback={null}>
        <CheckoutCancelledHandler />
      </Suspense>
      <PricingContent />
    </>
  );
}
