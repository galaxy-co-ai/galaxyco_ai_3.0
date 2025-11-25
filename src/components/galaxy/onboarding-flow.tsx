"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, CheckCircle2, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const totalSteps = 4;

  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step 1: Welcome
  const step1Content = (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Welcome to the Future of Work</h2>
        <p className="text-muted-foreground">
          We'll connect your essential work tools so AI can start saving you hours each week
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              2 min setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quick and easy setup process
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Instant AI insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get started immediately
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Save 5+ hours/week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automate repetitive tasks
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 2: Connect Essential Apps
  const step2Content = (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">📧</span>
                  </div>
                  Gmail
                </CardTitle>
                <CardDescription className="mt-2">
                  Connect your email for smart automation
                </CardDescription>
              </div>
              <Badge variant="default">Essential</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Show features</Button>
              <Button size="sm">Connect</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">📅</span>
                  </div>
                  Google Calendar
                </CardTitle>
                <CardDescription className="mt-2">
                  Sync your calendar for meeting insights
                </CardDescription>
              </div>
              <Badge variant="default">Essential</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Show features</Button>
              <Button size="sm">Connect</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 3: Add Additional Apps
  const step3Content = (
    <div className="space-y-6">
      <p className="text-center text-muted-foreground">
        Connect your email and calendar to unlock smart automation
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {["Slack", "Notion", "Salesforce", "HubSpot"].map((app) => (
          <Card key={app} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-lg">🔗</span>
                </div>
                {app}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Step 4: Completion
  const step4Content = (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">You're Ready to Go!</h2>
        <p className="text-muted-foreground">
          Your AI assistant is processing your data. You'll start seeing insights in minutes.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Apps Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Setup Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">~2m</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Additional Apps to Connect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: "Slack", desc: "Sync messages and organize conversations" },
            { name: "Notion", desc: "Sync your company knowledge base" },
            { name: "Salesforce", desc: "Sync CRM data and contacts" },
            { name: "HubSpot", desc: "Sync marketing and sales data" },
          ].map((app) => (
            <div key={app.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
              <div>
                <p className="font-medium">{app.name}</p>
                <p className="text-sm text-muted-foreground">{app.desc}</p>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const steps: Record<number, { title: string; subtitle: string; content: React.ReactNode }> = {
    1: {
      title: "Welcome to GalaxyCo.ai",
      subtitle: "Let's get you set up in minutes",
      content: step1Content,
    },
    2: {
      title: "Connect Essential Apps",
      subtitle: "These power your AI assistant",
      content: step2Content,
    },
    3: {
      title: "Add Additional Apps",
      subtitle: "Quick connect - tap any app to add",
      content: step3Content,
    },
    4: {
      title: "You're All Set!",
      subtitle: "AI is now learning your workflow",
      content: step4Content,
    },
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <CardDescription className="mt-1">
                  {currentStepData.subtitle}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStepData.content}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              {currentStep < totalSteps && (
                <Button variant="ghost" onClick={handleNext}>
                  Skip for now
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === totalSteps ? "Go to Dashboard" : "Continue"}
                {currentStep < totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

