"use client";

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  FileText,
  LayoutGrid,
  ListChecks,
  PenTool,
  Check,
  Loader2,
  Lightbulb,
  ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LayoutPicker, OutlineEditor, type OutlineData } from '@/components/admin/ArticleStudio';
import { type LayoutTemplate } from '@/lib/ai/article-layouts';
import { useHitListProgress } from '@/lib/hooks';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface NewPostWizardProps {
  categories: Category[];
}

type WizardStep = 'topic' | 'layout' | 'outline' | 'editor';

// Step configuration
const steps: { id: WizardStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'topic', label: 'Topic', icon: Lightbulb },
  { id: 'layout', label: 'Layout', icon: LayoutGrid },
  { id: 'outline', label: 'Outline', icon: ListChecks },
  { id: 'editor', label: 'Editor', icon: PenTool },
];

export function NewPostWizard({ categories }: NewPostWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize from URL params if coming from Article Studio
  const initialTitle = searchParams.get('title') || '';
  const initialLayout = (searchParams.get('layout') as LayoutTemplate['id']) || undefined;
  const topicIdFromUrl = searchParams.get('topicId');
  
  // Progress tracking for Hit List integration
  const { updateProgress, isTracking } = useHitListProgress({
    topicId: topicIdFromUrl,
    onError: (error) => {
      console.error('Progress tracking error:', error);
    },
  });
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    initialTitle && initialLayout ? 'outline' : (initialTitle ? 'layout' : 'topic')
  );
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplate['id'] | undefined>(initialLayout);
  const [outline, setOutline] = useState<OutlineData | null>(null);
  
  // Loading states
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Navigation
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goBack = () => {
    switch (currentStep) {
      case 'layout':
        goToStep('topic');
        break;
      case 'outline':
        goToStep('layout');
        break;
      case 'editor':
        goToStep('outline');
        break;
    }
  };

  // Step: Topic - Continue to layout
  const handleTopicContinue = () => {
    if (!title.trim()) {
      toast.error('Please enter a topic or title');
      return;
    }
    
    // Track progress for Hit List items
    if (isTracking) {
      updateProgress('topic_selected');
    }
    
    goToStep('layout');
  };

  // Step: Layout - Generate outline
  const handleLayoutContinue = async () => {
    if (!selectedLayout) {
      toast.error('Please select a layout');
      return;
    }
    
    setIsGeneratingOutline(true);
    try {
      const response = await fetch('/api/admin/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          layoutId: selectedLayout,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate outline');
      }

      const data = await response.json();
      setOutline(data.outline);
      goToStep('outline');
      
      // Track progress for Hit List items
      if (isTracking) {
        updateProgress('outline_created');
      }
      
      toast.success('Outline generated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate outline');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Step: Outline - Generate full draft
  const handleGenerateDraft = async () => {
    if (!outline || outline.sections.length === 0) {
      toast.error('Please add at least one section to the outline');
      return;
    }

    setIsGeneratingDraft(true);
    try {
      // Track progress for Hit List items
      if (isTracking) {
        updateProgress('writing_started');
      }
      
      // Create the post with outline, then redirect to editor
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: outline.title,
          slug: '', // Will be auto-generated
          excerpt: outline.description,
          content: '', // Editor will generate content
          outline: {
            sections: outline.sections,
            layoutId: outline.layoutId,
            targetAudience: outline.targetAudience,
            suggestedAngle: outline.suggestedAngle,
          },
          layoutTemplate: outline.layoutId,
          status: 'draft',
          // Link to Hit List topic if present
          topicId: topicIdFromUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to create post');
      }

      const post = await response.json();
      toast.success('Post created! Opening editor...');
      
      // Redirect to editor with the post ID (and topicId for continued tracking)
      const editorUrl = topicIdFromUrl 
        ? `/admin/content/${post.id}?topicId=${topicIdFromUrl}`
        : `/admin/content/${post.id}`;
      router.push(editorUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Handle outline changes
  const handleOutlineChange = useCallback((newOutline: OutlineData) => {
    setOutline(newOutline);
  }, []);

  // Skip to editor without AI
  const handleSkipToEditor = () => {
    router.push('/admin/content/new/editor');
  };

  return (
    <div className="min-h-full bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href={topicIdFromUrl ? "/admin/content/hit-list" : "/admin/content"}>
              <Button variant="ghost" size="icon" aria-label={topicIdFromUrl ? "Back to Hit List" : "Back to Content Studio"}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  New Article
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI-assisted article creation
                </p>
              </div>
              {/* Hit List badge */}
              {topicIdFromUrl && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  <ListOrdered className="h-3 w-3 mr-1" aria-hidden="true" />
                  From Hit List
                </Badge>
              )}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden md:flex items-center gap-1">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const stepIndex = steps.findIndex(s => s.id === currentStep);
              const isActive = step.id === currentStep;
              const isCompleted = index < stepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (isCompleted) goToStep(step.id);
                    }}
                    disabled={!isCompleted}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                    aria-label={`${step.label} step${isCompleted ? ' - completed' : ''}${isActive ? ' - current' : ''}`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden lg:inline">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-8 h-px mx-1",
                      index < stepIndex ? "bg-green-300" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipToEditor}
            className="text-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Skip to Editor
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* Step: Topic */}
        {currentStep === 'topic' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">What do you want to write about?</h2>
              <p className="text-muted-foreground">
                Enter your topic or article title to get started
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Topic or Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., How AI is Transforming Small Business Operations"
                    className="text-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTopicContinue();
                    }}
                    aria-label="Article topic or title"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Brief Description <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What angle or key points do you want to cover?"
                    aria-label="Article description"
                  />
                </div>

                {/* Quick suggestions */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '10 Ways to Boost Productivity',
                      'Complete Guide to Marketing Automation',
                      'Why [Product] is Essential for [Industry]',
                      'How We Achieved [Result]',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setTitle(suggestion)}
                        className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        aria-label={`Use suggestion: ${suggestion}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Link href="/admin/content/article-studio">
                <Button variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Need Ideas? Use Article Studio
                </Button>
              </Link>
              <Button onClick={handleTopicContinue} disabled={!title.trim()}>
                Choose Layout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Layout */}
        {currentStep === 'layout' && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="mb-4"
              aria-label="Go back to topic"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                  <CardDescription>{description}</CardDescription>
                )}
              </CardHeader>
            </Card>

            <LayoutPicker
              selectedLayout={selectedLayout}
              onSelect={setSelectedLayout}
              onContinue={handleLayoutContinue}
              showContinueButton={false}
            />

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleLayoutContinue}
                disabled={!selectedLayout || isGeneratingOutline}
                size="lg"
              >
                {isGeneratingOutline ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Outline...
                  </>
                ) : (
                  <>
                    Generate Outline
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Outline */}
        {currentStep === 'outline' && outline && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="mb-4"
              aria-label="Go back to layout selection"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <OutlineEditor
              outline={outline}
              onChange={handleOutlineChange}
              onGenerateDraft={handleGenerateDraft}
              isGeneratingDraft={isGeneratingDraft}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default NewPostWizard;

