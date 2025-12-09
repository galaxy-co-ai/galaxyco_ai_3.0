"use client";

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Clock, 
  Send,
  Loader2,
  Image as ImageIcon,
  Settings2,
  Sparkles,
  Upload,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TiptapEditor, InsertImageFunction, CitationData } from './TiptapEditor';
import { AIImageModal } from './ArticleStudio/AIImageModal';
import { toast } from 'sonner';
import readingTime from 'reading-time';
import slugify from 'slugify';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostEditorClientProps {
  categories: Category[];
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    categoryId: string | null;
    status: string;
    featured: boolean;
    featuredImage: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };
}

export function PostEditorClient({ categories, mode, initialData }: PostEditorClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '');
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  
  // AI Image Modal state
  const [isAIImageModalOpen, setIsAIImageModalOpen] = useState(false);
  const [aiImageContext, setAIImageContext] = useState('');
  const [aiImageInitialPrompt, setAIImageInitialPrompt] = useState('');
  const [aiImageMode, setAIImageMode] = useState<'featured' | 'inline'>('featured');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  // Editor insert function ref (will be set by TiptapEditor)
  const insertImageRef = useRef<((url: string, alt?: string) => void) | null>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-generate slug from title
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (!initialData?.slug) {
      // Only auto-generate slug for new posts
      setSlug(slugify(newTitle, { lower: true, strict: true }));
    }
  }, [initialData?.slug]);

  // Calculate reading time
  const stats = readingTime(content.replace(/<[^>]*>/g, '')); // Strip HTML
  const readingTimeMinutes = Math.ceil(stats.minutes);

  // Handle AI image selection (for featured image or inline)
  const handleAIImageSelect = useCallback((url: string, altText?: string) => {
    if (aiImageMode === 'featured') {
      setFeaturedImage(url);
    } else if (aiImageMode === 'inline' && insertImageRef.current) {
      // Insert image into editor at cursor position
      insertImageRef.current(url, altText);
    }
    setIsAIImageModalOpen(false);
    setAIImageInitialPrompt('');
  }, [aiImageMode]);

  // Open AI Image modal with context from article (for featured image)
  const handleOpenAIImageModal = useCallback(() => {
    // Build context from title, excerpt, and content
    const context = [
      title ? `Title: ${title}` : '',
      excerpt ? `Excerpt: ${excerpt}` : '',
      content ? `Content: ${content.replace(/<[^>]*>/g, '').substring(0, 2000)}` : '',
    ].filter(Boolean).join('\n\n');
    
    setAIImageContext(context);
    setAIImageMode('featured');
    setAIImageInitialPrompt('');
    setIsAIImageModalOpen(true);
  }, [title, excerpt, content]);

  // Handle in-article image suggestion from TiptapEditor
  const handleSuggestImage = useCallback((sectionContext: string) => {
    setAIImageContext(sectionContext);
    setAIImageMode('inline');
    setAIImageInitialPrompt('');
    setIsAIImageModalOpen(true);
  }, []);

  // Handle editor ready callback to get insert functions
  const handleEditorReady = useCallback((insertCitation: (citation: CitationData) => void, insertImage: InsertImageFunction) => {
    insertImageRef.current = insertImage;
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      setFeaturedImage(data.url);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  // Handle URL paste
  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    // Basic URL validation
    try {
      new URL(urlInput);
      setFeaturedImage(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
      toast.success('Image URL added!');
    } catch {
      toast.error('Please enter a valid URL');
    }
  }, [urlInput]);

  // Save as draft
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const endpoint = mode === 'create' 
        ? '/api/admin/posts' 
        : `/api/admin/posts/${initialData?.id}`;
      
      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title, { lower: true, strict: true }),
          excerpt,
          content,
          categoryId: categoryId || null,
          featured,
          featuredImage: featuredImage || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          readingTimeMinutes,
          status: 'draft',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }

      const data = await response.json();
      toast.success('Draft saved');
      
      if (mode === 'create') {
        router.push(`/admin/content/${data.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish post
  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please add some content');
      return;
    }

    setIsPublishing(true);
    try {
      const endpoint = mode === 'create' 
        ? '/api/admin/posts' 
        : `/api/admin/posts/${initialData?.id}`;
      
      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title, { lower: true, strict: true }),
          excerpt,
          content,
          categoryId: categoryId || null,
          featured,
          featuredImage: featuredImage || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          readingTimeMinutes,
          status: 'published',
          publishedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish');
      }

      toast.success('Post published!');
      router.push('/admin/content');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin/content">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">
                {mode === 'create' ? 'New Post' : 'Edit Post'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {readingTimeMinutes > 0 ? `${readingTimeMinutes} min read` : 'Start writing...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {initialData?.status || 'Draft'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isPublishing}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button 
              size="sm"
              onClick={handlePublish}
              disabled={isSaving || isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Main Editor */}
        <div className="flex-1 p-6">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title..."
            className="text-3xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 mb-4"
          />

          {/* Excerpt */}
          <Input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a brief excerpt for the post card..."
            className="text-base border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 text-muted-foreground mb-6"
          />

          {/* Editor */}
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your article... Use the toolbar above or markdown shortcuts."
            enableAI={true}
            articleContext={{
              title,
              targetAudience: 'general',
            }}
            onSuggestImage={handleSuggestImage}
            onEditorReady={handleEditorReady}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l p-6 space-y-6">
          {/* Post Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Post Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                  className="text-sm"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs">Category</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-center justify-between">
                <Label htmlFor="featured" className="text-xs">Featured Post</Label>
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Featured Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              {featuredImage ? (
                <div className="relative group">
                  <img 
                    src={featuredImage} 
                    alt="Featured" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setFeaturedImage('')}
                    aria-label="Remove featured image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenAIImageModal}
                      className="flex items-center gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50 hover:border-violet-300"
                      aria-label="Generate image with AI"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-xs">AI Generate</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="flex items-center gap-1.5"
                      aria-label="Upload image from computer"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span className="text-xs">Upload</span>
                    </Button>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Select image file"
                  />
                  
                  {/* URL input toggle */}
                  {showUrlInput ? (
                    <div className="flex gap-1">
                      <Input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste image URL..."
                        className="text-xs h-8"
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        aria-label="Image URL"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUrlSubmit}
                        className="h-8 px-2"
                        aria-label="Add URL"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowUrlInput(false);
                          setUrlInput('');
                        }}
                        className="h-8 px-2"
                        aria-label="Cancel URL input"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowUrlInput(true)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      aria-label="Enter image URL instead"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Or paste URL
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                SEO Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Optimize for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle" className="text-xs">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "SEO title..."}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {metaTitle.length}/60 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription" className="text-xs">Meta Description</Label>
                <textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief description for search results..."
                  className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Image Modal */}
      <AIImageModal
        isOpen={isAIImageModalOpen}
        onClose={() => {
          setIsAIImageModalOpen(false);
          setAIImageInitialPrompt('');
        }}
        onSelectImage={handleAIImageSelect}
        initialPrompt={aiImageInitialPrompt}
        context={aiImageContext}
      />
    </div>
  );
}
