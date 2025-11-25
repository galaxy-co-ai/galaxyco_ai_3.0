"use client";
import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { 
  Mail, 
  Calendar, 
  MessageSquare, 
  Database, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Users,
  FileText,
  Rocket
} from "lucide-react";
import { IntegrationCard } from "./IntegrationCard";
import { QuickIntegrationCard } from "./QuickIntegrationCard";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  category: "essential" | "recommended" | "optional";
  features: string[];
}

const integrations: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Auto-organize emails and extract action items",
    icon: <Mail className="h-7 w-7 text-white" />,
    gradient: "from-red-500 to-red-600",
    category: "essential",
    features: [
      "Auto-categorize emails by priority",
      "Extract action items and deadlines",
      "Smart email summaries"
    ]
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync meetings and auto-transcribe calls",
    icon: <Calendar className="h-7 w-7 text-white" />,
    gradient: "from-blue-500 to-blue-600",
    category: "essential",
    features: [
      "Auto-transcribe meetings",
      "Extract meeting notes and action items",
      "Smart scheduling suggestions"
    ]
  },
  {
    id: "slack",
    name: "Slack",
    description: "Sync messages and organize conversations",
    icon: <MessageSquare className="h-7 w-7 text-white" />,
    gradient: "from-purple-500 to-purple-600",
    category: "recommended",
    features: [
      "Auto-summarize channel discussions",
      "Track mentions and action items",
      "Smart notifications"
    ]
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync your company knowledge base",
    icon: <FileText className="h-7 w-7 text-white" />,
    gradient: "from-gray-700 to-gray-800",
    category: "recommended",
    features: [
      "Import existing documentation",
      "AI-powered search across all docs",
      "Auto-update knowledge base"
    ]
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync CRM data and contacts",
    icon: <Users className="h-7 w-7 text-white" />,
    gradient: "from-cyan-500 to-cyan-600",
    category: "optional",
    features: [
      "Import contacts and deals",
      "Auto-update CRM from calls/emails",
      "Smart lead scoring"
    ]
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync marketing and sales data",
    icon: <Database className="h-7 w-7 text-white" />,
    gradient: "from-orange-500 to-orange-600",
    category: "optional",
    features: [
      "Import contacts and campaigns",
      "Track engagement automatically",
      "AI-powered insights"
    ]
  }
];

const steps = [
  {
    id: 1,
    title: "Welcome to GalaxyCo.ai",
    subtitle: "Let's get you set up in minutes",
    description: "We'll connect your essential work tools so AI can start saving you hours each week"
  },
  {
    id: 2,
    title: "Connect Essential Apps",
    subtitle: "These power your AI assistant",
    description: "Connect your email and calendar to unlock smart automation"
  },
  {
    id: 3,
    title: "Add Additional Apps",
    subtitle: "Quick connect - tap any app to add",
    description: "Connect more apps to supercharge your AI assistant"
  },
  {
    id: 4,
    title: "You're All Set!",
    subtitle: "AI is now learning your workflow",
    description: "Your AI assistant is processing your data. You'll start seeing insights in minutes."
  }
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const essentialIntegrations = integrations.filter(i => i.category === "essential");
  const recommendedIntegrations = integrations.filter(i => i.category === "recommended");
  const optionalIntegrations = integrations.filter(i => i.category === "optional");
  const additionalIntegrations = [...recommendedIntegrations, ...optionalIntegrations];

  const essentialConnected = essentialIntegrations.every(i => connectedIntegrations.has(i.id));

  const handleConnect = (id: string) => {
    setConnectingId(id);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setConnectedIntegrations(prev => new Set(prev).add(id));
      setConnectingId(null);
      
      // Confetti on essential connections
      if (essentialIntegrations.find(i => i.id === id)) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else if (currentStep === 2) {
        // Small celebration for additional apps
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.6 },
          ticks: 50
        });
      }
    }, 1000); // Faster for additional apps
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const handleSkip = () => {
    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const canProceed = currentStep === 0 || currentStep === 1 ? essentialConnected : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl mb-1 leading-tight">
                {steps[currentStep].title}
              </h2>
              <p className="text-sm text-muted-foreground leading-tight">
                {steps[currentStep].subtitle}
              </p>
            </div>
            <Badge variant="outline" className="bg-white ml-4 shrink-0">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <Card className="p-6 md:p-8 text-center bg-white/80 backdrop-blur">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="text-lg md:text-xl mb-2 md:mb-3 leading-tight">
                  Welcome to the Future of Work
                </h3>
                <p className="text-sm text-muted-foreground mb-4 md:mb-6 max-w-lg mx-auto leading-relaxed">
                  {steps[currentStep].description}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs md:text-sm text-muted-foreground mb-6 md:mb-8">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>2 min setup</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span>Instant AI insights</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Save 5+ hours/week</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            )}

            {/* Step 1: Essential Integrations */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Card className="p-4 md:p-6 bg-white/80 backdrop-blur mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {steps[currentStep].description}
                  </p>
                </Card>
                
                {essentialIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    {...integration}
                    isConnected={connectedIntegrations.has(integration.id)}
                    isConnecting={connectingId === integration.id}
                    onConnect={() => handleConnect(integration.id)}
                  />
                ))}
              </div>
            )}

            {/* Step 2: Additional Apps Grid */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Card className="p-4 md:p-6 bg-white/80 backdrop-blur">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {steps[currentStep].description}
                    </p>
                    <Badge variant="outline" className="bg-white self-start sm:self-auto shrink-0">
                      {additionalIntegrations.filter(i => connectedIntegrations.has(i.id)).length} connected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Tap any card to connect instantly. You can always add more later.
                  </p>
                </Card>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {additionalIntegrations.map((integration, index) => (
                    <motion.div
                      key={integration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <QuickIntegrationCard
                        {...integration}
                        isConnected={connectedIntegrations.has(integration.id)}
                        isConnecting={connectingId === integration.id}
                        onConnect={() => handleConnect(integration.id)}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-muted-foreground">
                        {additionalIntegrations.filter(i => connectedIntegrations.has(i.id)).length > 0
                          ? `Great! ${additionalIntegrations.filter(i => connectedIntegrations.has(i.id)).length} more source${additionalIntegrations.filter(i => connectedIntegrations.has(i.id)).length > 1 ? 's' : ''} for your AI`
                          : 'Connect apps to give AI more context'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 3: Success */}
            {currentStep === 3 && (
              <Card className="p-6 md:p-12 text-center bg-white/80 backdrop-blur">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
                >
                  <Rocket className="h-10 w-10 md:h-12 md:w-12 text-white" />
                </motion.div>
                
                <h3 className="text-xl md:text-2xl mb-2 md:mb-3 leading-tight">
                  🎉 You're Ready to Go!
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 md:mb-6 max-w-lg mx-auto leading-relaxed">
                  {steps[currentStep].description}
                </p>

                <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-lg mx-auto mb-6 md:mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 md:p-4 rounded-lg border border-blue-200">
                    <div className="text-xl md:text-2xl mb-0.5 md:mb-1 leading-none">{connectedIntegrations.size}</div>
                    <div className="text-xs text-muted-foreground leading-tight">Apps Connected</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 md:p-4 rounded-lg border border-purple-200">
                    <div className="text-xl md:text-2xl mb-0.5 md:mb-1 leading-none">
                      <Sparkles className="h-5 w-5 md:h-6 md:w-6 mx-auto text-purple-600" />
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight">AI Active</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 md:p-4 rounded-lg border border-green-200">
                    <div className="text-xl md:text-2xl mb-0.5 md:mb-1 leading-none">~2m</div>
                    <div className="text-xs text-muted-foreground leading-tight">Setup Time</div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        {currentStep > 0 && currentStep < 3 && (
          <div className="flex items-center justify-between mt-6 gap-3">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
              {currentStep < 3 && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="rounded-full text-sm"
                >
                  <span className="hidden sm:inline">Skip for now</span>
                  <span className="sm:hidden">Skip</span>
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full text-sm whitespace-nowrap"
              >
                {currentStep === 1 && !canProceed ? (
                  <span className="hidden md:inline">Connect essentials to continue</span>
                ) : currentStep === 1 && !canProceed ? (
                  <span className="md:hidden">Connect apps</span>
                ) : currentStep === 2 ? (
                  <>
                    {additionalIntegrations.filter(i => connectedIntegrations.has(i.id)).length > 0 
                      ? <><span className="hidden sm:inline">Continue with {additionalIntegrations.filter(i => connectedIntegrations.has(i.id)).length} app{additionalIntegrations.filter(i => connectedIntegrations.has(i.id)).length > 1 ? "s" : ""}</span><span className="sm:hidden">Continue</span></>
                      : "Continue"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

