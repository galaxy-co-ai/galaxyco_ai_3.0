"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Lightbulb, 
  MessageSquare, 
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopicGenerator, BrainstormChat } from '@/components/admin/ArticleStudio';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
interface GeneratedTopic {
  title: string;
  description: string;
  whyItWorks: string;
  suggestedLayout: 'standard' | 'how-to' | 'listicle' | 'case-study' | 'tool-review' | 'news' | 'opinion';
  category: string;
}

interface OutlineData {
  title: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    type: 'intro' | 'body' | 'conclusion' | 'cta';
    bullets?: string[];
    wordCount?: number;
  }>;
  suggestedAngle: string;
  targetAudience: string;
  layout: string;
  topicId?: string;
}

type StudioMode = 'select' | 'topic' | 'brainstorm';

export function ArticleStudioClient() {
  const router = useRouter();
  const [mode, setMode] = useState<StudioMode>('select');
  const [selectedTopic, setSelectedTopic] = useState<GeneratedTopic | null>(null);
  const [generatedOutline, setGeneratedOutline] = useState<OutlineData | null>(null);

  // Handle topic selection from generator
  const handleSelectTopic = (topic: GeneratedTopic) => {
    setSelectedTopic(topic);
    toast.success('Topic selected! Choose to brainstorm further or start writing.');
  };

  // Handle starting to write from topic generator
  const handleStartWriting = (topic: GeneratedTopic) => {
    // Save topic selection and redirect to editor
    // In the future, this will go to the outline editor (Phase 3)
    router.push(`/admin/content/new?title=${encodeURIComponent(topic.title)}&layout=${topic.suggestedLayout}`);
  };

  // Handle outline generation from brainstorm
  const handleGenerateOutline = (outline: OutlineData) => {
    setGeneratedOutline(outline);
    toast.success('Outline generated! Review and start writing.');
  };

  // Start writing from outline
  const handleWriteFromOutline = () => {
    if (!generatedOutline) return;
    
    // In Phase 3, this will go to the outline editor
    // For now, go directly to the post editor with the title
    router.push(
      `/admin/content/new?title=${encodeURIComponent(generatedOutline.title)}&layout=${generatedOutline.layout}`
    );
  };

  return (
    <div className="min-h-full bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin/content">
              <Button variant="ghost" size="icon" aria-label="Back to Content Studio">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Article Studio
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-assisted article creation
              </p>
            </div>
          </div>
          {selectedTopic && (
            <Badge variant="secondary" className="text-xs">
              Topic: {selectedTopic.title.slice(0, 30)}...
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {mode === 'select' ? (
          // Mode Selection
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">How would you like to start?</h2>
              <p className="text-muted-foreground">
                Choose your path to create a compelling article
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Topic Generator Option */}
              <button
                onClick={() => setMode('topic')}
                className="text-left"
                aria-label="Start with topic generator"
              >
                <Card className="h-full hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-amber-50 w-fit mb-2 group-hover:bg-amber-100 transition-colors">
                      <Lightbulb className="h-6 w-6 text-amber-600" />
                    </div>
                    <CardTitle>Topic Generator</CardTitle>
                    <CardDescription>
                      Already have a rough idea? Let AI suggest compelling angles and titles.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Get 5 unique topic ideas
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        See why each topic works
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Suggested layouts for each
                      </li>
                    </ul>
                    <div className="mt-4 flex items-center text-sm font-medium text-amber-600 group-hover:text-amber-700">
                      Start generating
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </button>

              {/* Brainstorm Option */}
              <button
                onClick={() => setMode('brainstorm')}
                className="text-left"
                aria-label="Start brainstorming"
              >
                <Card className="h-full hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-blue-50 w-fit mb-2 group-hover:bg-blue-100 transition-colors">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Brainstorm Mode</CardTitle>
                    <CardDescription>
                      Have scattered thoughts? Chat with AI to find your strongest angle.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Conversational exploration
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        AI asks clarifying questions
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Generate outline from chat
                      </li>
                    </ul>
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      Start brainstorming
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            </div>

            {/* Quick Action */}
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-2">
                Already know what to write?
              </p>
              <Link href="/admin/content/new">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Go straight to editor
                </Button>
              </Link>
            </div>
          </div>
        ) : mode === 'topic' ? (
          // Topic Generator Mode
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('select')}
                aria-label="Back to mode selection"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <span className="text-muted-foreground">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('brainstorm')}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Switch to Brainstorm
              </Button>
            </div>
            
            <TopicGenerator
              onSelectTopic={handleSelectTopic}
              onStartWriting={handleStartWriting}
            />
          </div>
        ) : (
          // Brainstorm Mode
          <div className="max-w-4xl mx-auto h-[calc(100vh-160px)]">
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('select')}
                aria-label="Back to mode selection"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <span className="text-muted-foreground">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('topic')}
              >
                <Lightbulb className="h-4 w-4 mr-1" />
                Switch to Topic Generator
              </Button>
            </div>
            
            <div className="h-[calc(100%-48px)]">
              <BrainstormChat onGenerateOutline={handleGenerateOutline} />
            </div>
          </div>
        )}

        {/* Outline Preview (when generated) */}
        {generatedOutline && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Generated Outline
                </CardTitle>
                <CardDescription>
                  Review your article structure before writing
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{generatedOutline.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generatedOutline.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Sections</h4>
                  {generatedOutline.sections.map((section, index) => (
                    <div 
                      key={section.id} 
                      className="p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {section.type}
                        </Badge>
                        <span className="font-medium text-sm">{section.title}</span>
                      </div>
                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="text-xs text-muted-foreground pl-4 mt-1 space-y-0.5">
                          {section.bullets.map((bullet, i) => (
                            <li key={i}>• {bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {generatedOutline.suggestedAngle && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <h4 className="font-medium text-sm text-amber-800 mb-1">
                      Angle
                    </h4>
                    <p className="text-sm text-amber-700">
                      {generatedOutline.suggestedAngle}
                    </p>
                  </div>
                )}

                {generatedOutline.targetAudience && (
                  <div className="text-sm">
                    <span className="font-medium">Target audience: </span>
                    <span className="text-muted-foreground">
                      {generatedOutline.targetAudience}
                    </span>
                  </div>
                )}
              </CardContent>
              <div className="flex-shrink-0 p-4 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedOutline(null)}
                >
                  Back to Brainstorm
                </Button>
                <Button onClick={handleWriteFromOutline}>
                  <FileText className="h-4 w-4 mr-2" />
                  Start Writing
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

