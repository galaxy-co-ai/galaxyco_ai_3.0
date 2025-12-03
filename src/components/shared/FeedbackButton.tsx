"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  MessageSquarePlus,
  X,
  Bug,
  Lightbulb,
  MessageCircle,
  Send,
  Loader2,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FeedbackType = 'bug' | 'suggestion' | 'general';
type Sentiment = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

const FEEDBACK_TYPES = [
  { id: 'bug' as FeedbackType, icon: Bug, label: "Something's broken", color: 'text-red-500' },
  { id: 'suggestion' as FeedbackType, icon: Lightbulb, label: 'I have a suggestion', color: 'text-amber-500' },
  { id: 'general' as FeedbackType, icon: MessageCircle, label: 'General feedback', color: 'text-blue-500' },
];

const SENTIMENTS = [
  { id: 'very_negative' as Sentiment, emoji: '😟', label: 'Very Negative' },
  { id: 'negative' as Sentiment, emoji: '😕', label: 'Negative' },
  { id: 'neutral' as Sentiment, emoji: '😐', label: 'Neutral' },
  { id: 'positive' as Sentiment, emoji: '🙂', label: 'Positive' },
  { id: 'very_positive' as Sentiment, emoji: '🤩', label: 'Very Positive' },
];

// Map URL paths to feature areas
function getFeatureArea(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/activity')) return 'My Agents';
  if (pathname.startsWith('/creator')) return 'Creator';
  if (pathname.startsWith('/library')) return 'Library';
  if (pathname.startsWith('/crm')) return 'CRM';
  if (pathname.startsWith('/conversations')) return 'Conversations';
  if (pathname.startsWith('/finance')) return 'Finance HQ';
  if (pathname.startsWith('/marketing')) return 'Marketing';
  if (pathname.startsWith('/launchpad')) return 'Launchpad';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/assistant')) return 'Neptune';
  if (pathname.startsWith('/connected-apps')) return 'Connected Apps';
  return 'General';
}

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const pathname = usePathname();
  const { userId } = useAuth();
  const featureArea = getFeatureArea(pathname);

  const resetForm = () => {
    setStep('type');
    setFeedbackType(null);
    setSentiment(null);
    setTitle('');
    setContent('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  const handleTypeSelect = (type: FeedbackType) => {
    setFeedbackType(type);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!feedbackType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          sentiment,
          title: title || undefined,
          content: content || undefined,
          pageUrl: pathname,
          featureArea,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Thank you for your feedback!');
      handleClose();
    } catch (error) {
      toast.error('Could not submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show on admin pages or landing page
  if (pathname.startsWith('/admin') || pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
          "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
          "transition-all hover:scale-110",
          isOpen && "scale-0 opacity-0"
        )}
        size="icon"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </Button>

      {/* Feedback Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 animate-in slide-in-from-bottom-4 fade-in-0">
          <Card className="shadow-2xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Send Feedback</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {step === 'type' 
                  ? "What's on your mind?" 
                  : `Feedback about ${featureArea}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'type' ? (
                <div className="space-y-2">
                  {FEEDBACK_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeSelect(type.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border",
                          "hover:bg-muted transition-colors text-left"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", type.color)} />
                        <span className="font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sentiment (not for bugs) */}
                  {feedbackType !== 'bug' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        How do you feel about this?
                      </Label>
                      <div className="flex justify-between">
                        {SENTIMENTS.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSentiment(s.id)}
                            className={cn(
                              "p-2 text-2xl rounded-lg transition-all",
                              sentiment === s.id 
                                ? "bg-primary/10 scale-110" 
                                : "hover:bg-muted opacity-60 hover:opacity-100"
                            )}
                            title={s.label}
                          >
                            {s.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback-title" className="text-xs">
                      {feedbackType === 'bug' ? 'What happened?' : 'Summary'} 
                      <span className="text-muted-foreground"> (optional)</span>
                    </Label>
                    <Input
                      id="feedback-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        feedbackType === 'bug' 
                          ? "e.g., Button doesn't work" 
                          : "Brief summary..."
                      }
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback-content" className="text-xs">
                      Tell us more
                      <span className="text-muted-foreground"> (optional)</span>
                    </Label>
                    <textarea
                      id="feedback-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Any additional details..."
                      className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                    />
                  </div>

                  {/* Context Info */}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <p>📍 Page: {pathname}</p>
                    <p>🏷️ Feature: {featureArea}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep('type')}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Feedback
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
