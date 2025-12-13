"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
  Search,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Shield,
  ShieldAlert,
  Smartphone,
  Monitor,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ArticleSource } from './SourcePanel';

// Check status types
type CheckStatus = 'pass' | 'warning' | 'fail' | 'loading';

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  suggestion?: string;
  severity: 'critical' | 'important' | 'optional';
}

interface CheckSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  checks: CheckItem[];
  isOpen: boolean;
}

// Article data structure
interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
  categoryId: string | null;
}

interface PrePublishChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  article: ArticleData;
  sources: ArticleSource[];
  focusKeyword?: string;
  isPublishing?: boolean;
  onUpdateArticle: (updates: Partial<ArticleData>) => void;
  onFocusKeywordChange?: (keyword: string) => void;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Helper to count words
function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// Helper to extract images from HTML content
function extractImages(html: string): Array<{ src: string; alt: string }> {
  const images: Array<{ src: string; alt: string }> = [];
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    images.push({ src: match[1], alt: match[2] || '' });
  }
  return images;
}

// Helper to check for intro hook patterns
function hasIntroHook(content: string): boolean {
  const plainText = stripHtml(content);
  const firstParagraph = plainText.substring(0, 500);
  
  // Check for hook patterns: questions, statistics, quotes, stories
  const hookPatterns = [
    /\?/, // Questions
    /\d+%/, // Statistics/percentages
    /"\w+/, // Quotes
    /imagine|picture this|have you ever/i, // Story/scenario starters
    /according to|research shows|studies show/i, // Authority appeals
  ];
  
  return hookPatterns.some(pattern => pattern.test(firstParagraph));
}

// Helper to check for actionable takeaways
function hasActionableTakeaways(content: string): boolean {
  const plainText = stripHtml(content);
  const lowerText = plainText.toLowerCase();
  
  // Check for action-oriented language
  const actionPatterns = [
    /here('s| are| is) (what|how)/i,
    /step \d+/i,
    /\d+\.\s+\w+/i, // Numbered lists
    /you (can|should|must|need to)/i,
    /tip:|takeaway:|action:/i,
    /next step|get started|try this/i,
    /key (points?|takeaways?)/i,
  ];
  
  return actionPatterns.some(pattern => pattern.test(lowerText));
}

// Helper to calculate title score (0-100)
function calculateTitleScore(title: string): number {
  let score = 0;
  const words = title.split(/\s+/);
  
  // Length (optimal: 6-12 words)
  if (words.length >= 6 && words.length <= 12) score += 30;
  else if (words.length >= 4 && words.length <= 15) score += 20;
  else score += 10;
  
  // Contains number
  if (/\d+/.test(title)) score += 15;
  
  // Contains power words
  const powerWords = ['ultimate', 'essential', 'complete', 'proven', 'best', 'top', 'how', 'why', 'what', 'guide', 'tips', 'secrets'];
  if (powerWords.some(word => title.toLowerCase().includes(word))) score += 20;
  
  // Contains emotional triggers
  const emotionalWords = ['amazing', 'incredible', 'powerful', 'easy', 'simple', 'fast', 'free', 'new', 'exclusive'];
  if (emotionalWords.some(word => title.toLowerCase().includes(word))) score += 15;
  
  // First word is capitalized/proper
  if (/^[A-Z]/.test(title)) score += 10;
  
  // Character length (optimal: 55-65)
  if (title.length >= 55 && title.length <= 65) score += 10;
  else if (title.length >= 40 && title.length <= 80) score += 5;
  
  return Math.min(score, 100);
}

export function PrePublishChecklist({
  isOpen,
  onClose,
  onPublish,
  article,
  sources,
  focusKeyword = '',
  isPublishing = false,
  onUpdateArticle,
  onFocusKeywordChange,
}: PrePublishChecklistProps) {
  const [keyword, setKeyword] = useState(focusKeyword);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop' | null>(null);
  const [acknowledgedCritical, setAcknowledgedCritical] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['content', 'seo', 'sources', 'visual']));

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setKeyword(focusKeyword);
      setAcknowledgedCritical(new Set());
    }
  }, [isOpen, focusKeyword]);

  // Calculate all checks
  const sections = useMemo<CheckSection[]>(() => {
    const plainContent = stripHtml(article.content);
    const wordCount = countWords(plainContent);
    const images = extractImages(article.content);
    const titleScore = calculateTitleScore(article.title);
    
    // Verified source count
    const verifiedSources = sources.filter(s => s.verificationStatus === 'verified').length;
    const unverifiedSources = sources.filter(s => s.verificationStatus === 'unverified').length;
    const failedSources = sources.filter(s => s.verificationStatus === 'failed').length;

    return [
      {
        id: 'content',
        title: 'Content Quality',
        icon: <FileText className="h-4 w-4" />,
        isOpen: openSections.has('content'),
        checks: [
          {
            id: 'title-score',
            label: `Title Score (${titleScore}/100)`,
            status: titleScore >= 70 ? 'pass' : titleScore >= 50 ? 'warning' : 'fail',
            message: titleScore >= 70 
              ? 'Great title! Compelling and optimized.' 
              : titleScore >= 50 
              ? 'Title is okay but could be more engaging.'
              : 'Title needs improvement for better engagement.',
            suggestion: titleScore < 70 
              ? 'Try adding numbers, power words (Ultimate, Essential, Guide), or making it more specific.'
              : undefined,
            severity: 'important',
          },
          {
            id: 'intro-hook',
            label: 'Introduction Hook',
            status: hasIntroHook(article.content) ? 'pass' : 'warning',
            message: hasIntroHook(article.content)
              ? 'Introduction has an engaging hook.'
              : 'Introduction could use a stronger hook.',
            suggestion: !hasIntroHook(article.content)
              ? 'Start with a question, statistic, quote, or compelling scenario.'
              : undefined,
            severity: 'optional',
          },
          {
            id: 'word-count',
            label: `Word Count (${wordCount})`,
            status: wordCount >= 300 ? 'pass' : wordCount >= 150 ? 'warning' : 'fail',
            message: wordCount >= 300 
              ? 'Article has sufficient content.' 
              : wordCount >= 150 
              ? 'Article is a bit short.'
              : 'Article is too short.',
            suggestion: wordCount < 300 
              ? 'Aim for at least 300 words for better SEO and reader engagement.'
              : undefined,
            severity: wordCount < 150 ? 'critical' : 'optional',
          },
          {
            id: 'actionable-takeaways',
            label: 'Actionable Takeaways',
            status: hasActionableTakeaways(article.content) ? 'pass' : 'warning',
            message: hasActionableTakeaways(article.content)
              ? 'Content includes actionable advice.'
              : 'Content could benefit from actionable takeaways.',
            suggestion: !hasActionableTakeaways(article.content)
              ? 'Add numbered steps, tips, or clear calls-to-action.'
              : undefined,
            severity: 'optional',
          },
        ],
      },
      {
        id: 'seo',
        title: 'SEO',
        icon: <Search className="h-4 w-4" />,
        isOpen: openSections.has('seo'),
        checks: [
          {
            id: 'meta-title',
            label: `Meta Title (${article.metaTitle.length}/60 chars)`,
            status: article.metaTitle.length > 0 && article.metaTitle.length <= 60 
              ? 'pass' 
              : article.metaTitle.length > 60 
              ? 'warning' 
              : 'fail',
            message: article.metaTitle.length > 0 && article.metaTitle.length <= 60
              ? 'Meta title is properly set.'
              : article.metaTitle.length > 60
              ? 'Meta title is too long and may be truncated.'
              : 'Meta title is missing.',
            suggestion: article.metaTitle.length === 0 
              ? 'Click "Generate SEO" to auto-fill from content.'
              : article.metaTitle.length > 60
              ? 'Keep meta title under 60 characters.'
              : undefined,
            severity: 'important',
          },
          {
            id: 'meta-description',
            label: `Meta Description (${article.metaDescription.length}/160 chars)`,
            status: article.metaDescription.length >= 120 && article.metaDescription.length <= 160 
              ? 'pass' 
              : article.metaDescription.length > 0 && article.metaDescription.length < 120
              ? 'warning'
              : article.metaDescription.length > 160
              ? 'warning'
              : 'fail',
            message: article.metaDescription.length >= 120 && article.metaDescription.length <= 160
              ? 'Meta description is ideal length.'
              : article.metaDescription.length > 160
              ? 'Meta description is too long and may be truncated.'
              : article.metaDescription.length > 0
              ? 'Meta description could be longer for better SEO.'
              : 'Meta description is missing.',
            suggestion: article.metaDescription.length === 0 
              ? 'Click "Generate SEO" to auto-fill from content.'
              : article.metaDescription.length < 120
              ? 'Aim for 120-160 characters for optimal display.'
              : undefined,
            severity: 'important',
          },
          {
            id: 'slug',
            label: 'URL Slug',
            status: article.slug && /^[a-z0-9-]+$/.test(article.slug) 
              ? 'pass' 
              : article.slug 
              ? 'warning' 
              : 'fail',
            message: article.slug && /^[a-z0-9-]+$/.test(article.slug)
              ? 'URL slug is valid and SEO-friendly.'
              : article.slug
              ? 'Slug contains special characters.'
              : 'URL slug is missing.',
            suggestion: !article.slug 
              ? 'A slug will be auto-generated from the title.'
              : !/^[a-z0-9-]+$/.test(article.slug)
              ? 'Use only lowercase letters, numbers, and hyphens.'
              : undefined,
            severity: 'critical',
          },
          {
            id: 'focus-keyword',
            label: 'Focus Keyword',
            status: keyword.trim().length > 0 
              ? plainContent.toLowerCase().includes(keyword.toLowerCase())
                ? 'pass'
                : 'warning'
              : 'warning',
            message: keyword.trim().length > 0
              ? plainContent.toLowerCase().includes(keyword.toLowerCase())
                ? `Focus keyword "${keyword}" appears in content.`
                : `Focus keyword "${keyword}" not found in content.`
              : 'No focus keyword set.',
            suggestion: keyword.trim().length === 0 
              ? 'Enter a focus keyword to optimize for.'
              : !plainContent.toLowerCase().includes(keyword.toLowerCase())
              ? 'Include the focus keyword naturally in your content.'
              : undefined,
            severity: 'optional',
          },
        ],
      },
      {
        id: 'sources',
        title: 'Sources & Citations',
        icon: <BookOpen className="h-4 w-4" />,
        isOpen: openSections.has('sources'),
        checks: [
          {
            id: 'sources-count',
            label: `Total Sources (${sources.length})`,
            status: sources.length >= 2 ? 'pass' : sources.length >= 1 ? 'warning' : 'pass',
            message: sources.length >= 2
              ? 'Article has multiple sources.'
              : sources.length === 1
              ? 'Consider adding more sources.'
              : 'No sources added (optional for some content types).',
            severity: 'optional',
          },
          {
            id: 'verified-sources',
            label: `Verified (${verifiedSources}/${sources.length})`,
            status: sources.length === 0 
              ? 'pass' 
              : verifiedSources === sources.length 
              ? 'pass' 
              : verifiedSources > 0 
              ? 'warning' 
              : 'fail',
            message: sources.length === 0
              ? 'No sources to verify.'
              : verifiedSources === sources.length
              ? 'All sources verified!'
              : `${unverifiedSources} unverified, ${failedSources} failed.`,
            suggestion: unverifiedSources > 0 || failedSources > 0
              ? 'Review and verify sources before publishing.'
              : undefined,
            severity: failedSources > 0 ? 'critical' : unverifiedSources > 0 ? 'important' : 'optional',
          },
          {
            id: 'source-urls',
            label: 'Source URLs',
            status: sources.every(s => s.url) || sources.length === 0 
              ? 'pass' 
              : sources.some(s => s.url) 
              ? 'warning' 
              : sources.length > 0 ? 'warning' : 'pass',
            message: sources.length === 0
              ? 'No sources added.'
              : sources.every(s => s.url)
              ? 'All sources have URLs.'
              : `${sources.filter(s => !s.url).length} sources missing URLs.`,
            suggestion: sources.some(s => !s.url)
              ? 'Add URLs to sources for reader verification.'
              : undefined,
            severity: 'optional',
          },
        ],
      },
      {
        id: 'visual',
        title: 'Visual Elements',
        icon: <ImageIcon className="h-4 w-4" />,
        isOpen: openSections.has('visual'),
        checks: [
          {
            id: 'featured-image',
            label: 'Featured Image',
            status: article.featuredImage ? 'pass' : 'fail',
            message: article.featuredImage
              ? 'Featured image is set.'
              : 'No featured image set.',
            suggestion: !article.featuredImage
              ? 'Add a featured image for better social sharing and visual appeal.'
              : undefined,
            severity: 'important',
          },
          {
            id: 'content-images',
            label: `Content Images (${images.length})`,
            status: images.length > 0 || wordCount < 500 ? 'pass' : 'warning',
            message: images.length > 0
              ? `Article contains ${images.length} image(s).`
              : wordCount < 500
              ? 'Short article - images optional.'
              : 'No images in content.',
            suggestion: images.length === 0 && wordCount >= 500
              ? 'Consider adding images to break up text and improve engagement.'
              : undefined,
            severity: 'optional',
          },
          {
            id: 'alt-text',
            label: 'Image Alt Text',
            status: images.length === 0 
              ? 'pass' 
              : images.every(img => img.alt && img.alt.length > 0)
              ? 'pass'
              : images.some(img => img.alt && img.alt.length > 0)
              ? 'warning'
              : 'fail',
            message: images.length === 0
              ? 'No images to check.'
              : images.every(img => img.alt && img.alt.length > 0)
              ? 'All images have alt text.'
              : `${images.filter(img => !img.alt || img.alt.length === 0).length} images missing alt text.`,
            suggestion: images.some(img => !img.alt || img.alt.length === 0)
              ? 'Add descriptive alt text to all images for accessibility and SEO.'
              : undefined,
            severity: 'important',
          },
        ],
      },
    ];
  }, [article, sources, keyword, openSections]);

  // Count issues
  const criticalIssues = sections.flatMap(s => s.checks).filter(c => c.status === 'fail' && c.severity === 'critical');
  const importantIssues = sections.flatMap(s => s.checks).filter(c => c.status === 'fail' && c.severity === 'important');
  const warnings = sections.flatMap(s => s.checks).filter(c => c.status === 'warning');
  const passed = sections.flatMap(s => s.checks).filter(c => c.status === 'pass');

  const allCriticalAcknowledged = criticalIssues.every(issue => acknowledgedCritical.has(issue.id));
  const canPublish = criticalIssues.length === 0 || allCriticalAcknowledged;

  // Toggle section
  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  // Generate SEO from content
  const handleGenerateSEO = useCallback(async () => {
    setIsGeneratingSEO(true);
    try {
      const response = await fetch('/api/admin/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate SEO');
      }

      const data = await response.json();
      
      onUpdateArticle({
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        slug: data.slug || article.slug,
      });

      if (data.suggestedKeyword && onFocusKeywordChange) {
        setKeyword(data.suggestedKeyword);
        onFocusKeywordChange(data.suggestedKeyword);
      }

      toast.success('SEO data generated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate SEO');
    } finally {
      setIsGeneratingSEO(false);
    }
  }, [article, onUpdateArticle, onFocusKeywordChange]);

  // Handle publish with validation
  const handlePublish = () => {
    if (!canPublish) {
      toast.error('Please acknowledge critical issues before publishing');
      return;
    }
    onPublish();
  };

  // Get status icon
  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
  };

  // Launchpad preview URL
  const launchpadPreviewUrl = article.slug 
    ? `/launchpad/blog/${article.slug}?preview=true`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            Pre-Publish Checklist
          </DialogTitle>
          <DialogDescription>
            Review your article before publishing
          </DialogDescription>
        </DialogHeader>

        {/* Summary Badges */}
        <div className="flex flex-wrap gap-2 py-2 border-b">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {passed.length} passed
          </Badge>
          {warnings.length > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warnings.length} warnings
            </Badge>
          )}
          {importantIssues.length > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <XCircle className="h-3 w-3 mr-1" />
              {importantIssues.length} important
            </Badge>
          )}
          {criticalIssues.length > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <XCircle className="h-3 w-3 mr-1" />
              {criticalIssues.length} critical
            </Badge>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* SEO Quick Actions */}
          <Card className="border-violet-200 bg-violet-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span className="font-medium text-sm">Auto-Generate SEO</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Generate meta title, description, and slug from your content using AI.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateSEO}
                    disabled={isGeneratingSEO}
                    className="border-violet-300 text-violet-700 hover:bg-violet-100"
                  >
                    {isGeneratingSEO ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Generate SEO
                      </>
                    )}
                  </Button>
                </div>
                <div className="w-48">
                  <Label htmlFor="focus-keyword" className="text-xs font-medium mb-1.5 block">
                    Focus Keyword
                  </Label>
                  <Input
                    id="focus-keyword"
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      onFocusKeywordChange?.(e.target.value);
                    }}
                    placeholder="e.g., content marketing"
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check Sections */}
          {sections.map((section) => (
            <Collapsible
              key={section.id}
              open={section.isOpen}
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-violet-600">{section.icon}</span>
                        {section.title}
                        <Badge variant="outline" className="text-[10px] ml-2">
                          {section.checks.filter(c => c.status === 'pass').length}/{section.checks.length}
                        </Badge>
                      </div>
                      {section.isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2">
                      {section.checks.map((check) => (
                        <div
                          key={check.id}
                          className={cn(
                            "flex items-start gap-3 p-2 rounded-lg transition-colors",
                            check.status === 'fail' && check.severity === 'critical' && "bg-red-50",
                            check.status === 'fail' && check.severity === 'important' && "bg-orange-50",
                            check.status === 'warning' && "bg-amber-50/50",
                          )}
                        >
                          <div className="pt-0.5">{getStatusIcon(check.status)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{check.label}</span>
                              {check.severity === 'critical' && check.status === 'fail' && (
                                <Badge variant="outline" className="text-[9px] bg-red-100 text-red-700 border-red-200">
                                  Critical
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{check.message}</p>
                            {check.suggestion && (
                              <p className="text-xs text-violet-600 mt-1">{check.suggestion}</p>
                            )}
                            {check.severity === 'critical' && check.status === 'fail' && (
                              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={acknowledgedCritical.has(check.id)}
                                  onChange={(e) => {
                                    const newSet = new Set(acknowledgedCritical);
                                    if (e.target.checked) {
                                      newSet.add(check.id);
                                    } else {
                                      newSet.delete(check.id);
                                    }
                                    setAcknowledgedCritical(newSet);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-red-300"
                                />
                                <span className="text-xs text-red-700">
                                  I acknowledge this issue and want to proceed anyway
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}

          {/* Preview Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-violet-600" />
                Preview Modes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode(previewMode === 'mobile' ? null : 'mobile')}
                  aria-label="Toggle mobile preview"
                >
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                  Mobile
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode(previewMode === 'desktop' ? null : 'desktop')}
                  aria-label="Toggle desktop preview"
                >
                  <Monitor className="h-3.5 w-3.5 mr-1.5" />
                  Desktop
                </Button>
                {launchpadPreviewUrl && (
                  <a
                    href={launchpadPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="Open Launchpad preview in new tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Launchpad Preview
                    </Button>
                  </a>
                )}
              </div>

              {/* Preview Frame */}
              {previewMode && (
                <div className="mt-4">
                  <div
                    className={cn(
                      "mx-auto border-2 border-gray-200 rounded-lg overflow-hidden bg-white transition-all",
                      previewMode === 'mobile' && "w-[375px]",
                      previewMode === 'desktop' && "w-full max-w-[600px]",
                    )}
                  >
                    {/* Google SERP Preview */}
                    <div className="p-4 bg-gray-50 border-b">
                      <p className="text-xs text-gray-500 mb-2">Google Search Preview</p>
                      <div className="space-y-1">
                        <p className="text-blue-700 text-base hover:underline cursor-pointer truncate">
                          {article.metaTitle || article.title || 'Page Title'}
                        </p>
                        <p className="text-xs text-green-700">
                          galaxyco.ai/launchpad/blog/{article.slug || 'page-url'}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {article.metaDescription || article.excerpt || 'Meta description will appear here...'}
                        </p>
                      </div>
                    </div>

                    {/* Social Card Preview */}
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-2">Social Share Preview</p>
                      <div className="border rounded-lg overflow-hidden">
                        {article.featuredImage ? (
                          <img
                            src={article.featuredImage}
                            alt="Featured"
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-sm truncate">
                            {article.title || 'Article Title'}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {article.excerpt || article.metaDescription || 'Article description...'}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">galaxyco.ai</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm">
              {criticalIssues.length > 0 && !allCriticalAcknowledged ? (
                <span className="text-red-600 flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4" />
                  {criticalIssues.length} critical issue{criticalIssues.length !== 1 ? 's' : ''} must be acknowledged
                </span>
              ) : criticalIssues.length > 0 ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Publishing with acknowledged issues
                </span>
              ) : importantIssues.length > 0 || warnings.length > 0 ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {importantIssues.length + warnings.length} non-critical issue{importantIssues.length + warnings.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  All checks passed!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !canPublish}
                aria-label={!canPublish ? "Acknowledge critical issues to enable publishing" : "Publish article"}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Publish Article
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PrePublishChecklist;

