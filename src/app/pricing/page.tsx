"use client";

import { useState } from "react";
import { CosmicBackground } from "@/components/shared/CosmicBackground";
import { SmartNavigation } from "@/components/shared/SmartNavigation";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// TODO: Replace these with your actual Stripe Price IDs from your Stripe Dashboard
// Go to Products > Select Product > Copy the Price ID (starts with price_)
const STRIPE_PRICE_IDS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
};

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Check for checkout cancellation
  const checkoutCancelled = searchParams.get('checkout') === 'cancelled';
  if (checkoutCancelled) {
    toast.info('Checkout cancelled. Feel free to try again when you\'re ready.');
  }

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

  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/mo",
      priceId: STRIPE_PRICE_IDS.starter,
      description: "Perfect for individuals and hobbyists exploring AI.",
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
        "30-day Data Retention",
        "5 Team Members",
        "Custom Integrations"
      ],
      limitations: [
        "No SSO / SAML",
        "Shared Compute Resources"
      ],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      priceId: undefined, // Contact sales
      description: "For large organizations requiring security and control.",
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
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4 mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
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
                      className="w-full" 
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
                 { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately." },
                 { q: "Is there a free trial for Pro?", a: "Absolutely! We offer a 14-day free trial of our Pro plan so you can experience the full power of GalaxyCo." },
                 { q: "What happens to my data if I cancel?", a: "We retain your data for 30 days after cancellation, giving you time to export it before it's permanently deleted." }
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
