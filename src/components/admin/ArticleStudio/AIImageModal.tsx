"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  Image as ImageIcon,
  Wand2,
  Camera,
  Palette,
  Layers,
  Eye,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  AlertCircle,
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Image style options
export type ImageStyle = 'professional' | 'illustrative' | 'minimalist' | 'abstract' | 'photorealistic';

export interface ImageStyleOption {
  id: ImageStyle;
  label: string;
  description: string;
  icon: React.ReactNode;
  prompt: string; // Style-specific prompt enhancement
}

export const IMAGE_STYLES: ImageStyleOption[] = [
  {
    id: 'professional',
    label: 'Professional',
    description: 'Clean, corporate, business-ready',
    icon: <Camera className="h-4 w-4" />,
    prompt: 'Professional corporate photography style, clean composition, high production value, business-appropriate',
  },
  {
    id: 'illustrative',
    label: 'Illustrative',
    description: 'Hand-drawn, artistic, creative',
    icon: <Palette className="h-4 w-4" />,
    prompt: 'Digital illustration style, vibrant colors, creative artistic interpretation, stylized design',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Simple, clean, modern',
    icon: <Layers className="h-4 w-4" />,
    prompt: 'Minimalist design, simple shapes, clean lines, modern aesthetic, lots of white space',
  },
  {
    id: 'abstract',
    label: 'Abstract',
    description: 'Conceptual, artistic, unique',
    icon: <Wand2 className="h-4 w-4" />,
    prompt: 'Abstract conceptual art, creative interpretation, artistic expression, unique visual metaphor',
  },
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    description: 'Realistic, detailed, lifelike',
    icon: <Eye className="h-4 w-4" />,
    prompt: 'Photorealistic, highly detailed, lifelike quality, professional photography',
  },
];

// Size options
export type ImageSize = 'square' | 'landscape' | 'portrait';

export interface ImageSizeOption {
  id: ImageSize;
  label: string;
  dimensions: string;
  icon: React.ReactNode;
  apiSize: '1024x1024' | '1792x1024' | '1024x1792';
}

export const IMAGE_SIZES: ImageSizeOption[] = [
  {
    id: 'square',
    label: 'Square',
    dimensions: '1024×1024',
    icon: <Square className="h-4 w-4" />,
    apiSize: '1024x1024',
  },
  {
    id: 'landscape',
    label: 'Landscape',
    dimensions: '1792×1024',
    icon: <RectangleHorizontal className="h-4 w-4" />,
    apiSize: '1792x1024',
  },
  {
    id: 'portrait',
    label: 'Portrait',
    dimensions: '1024×1792',
    icon: <RectangleVertical className="h-4 w-4" />,
    apiSize: '1024x1792',
  },
];

// Generated image result
export interface GeneratedImage {
  id: string;
  url: string;
  revisedPrompt: string;
  selected: boolean;
}

interface AIImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string, altText?: string) => void;
  initialPrompt?: string;
  context?: string; // Article context for better suggestions
}

export function AIImageModal({
  isOpen,
  onClose,
  onSelectImage,
  initialPrompt = '',
  context = '',
}: AIImageModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('professional');
  const [selectedSize, setSelectedSize] = useState<ImageSize>('landscape');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestingPrompt, setIsSuggestingPrompt] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setError(null);
      // Focus input after a short delay to allow modal animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialPrompt]);

  // Generate image prompt suggestion based on context
  const handleSuggestPrompt = useCallback(async () => {
    if (!context.trim()) {
      toast.info('No article context available for suggestions');
      return;
    }

    setIsSuggestingPrompt(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest',
          context,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to suggest prompt');
      }

      const data = await response.json();
      setPrompt(data.suggestedPrompt || '');
      toast.success('Prompt suggested based on your content');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suggest prompt';
      setError(message);
      toast.error(message);
    } finally {
      setIsSuggestingPrompt(false);
    }
  }, [context]);

  // Generate images with DALL-E
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for the image');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setSelectedImageId(null);

    const styleOption = IMAGE_STYLES.find(s => s.id === selectedStyle);
    const sizeOption = IMAGE_SIZES.find(s => s.id === selectedSize);

    try {
      // Generate 4 variations
      const results: GeneratedImage[] = [];
      
      // For DALL-E 3, we generate images one at a time (API limitation)
      // Generate 4 sequential requests for variations
      for (let i = 0; i < 4; i++) {
        const response = await fetch('/api/admin/ai/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate',
            prompt: `${prompt}. ${styleOption?.prompt || ''}`,
            size: sizeOption?.apiSize || '1024x1024',
            style: selectedStyle === 'photorealistic' ? 'natural' : 'vivid',
            variation: i + 1, // Help create variations
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate image');
        }

        const data = await response.json();
        results.push({
          id: `img-${Date.now()}-${i}`,
          url: data.url,
          revisedPrompt: data.revisedPrompt || prompt,
          selected: false,
        });

        // Update UI progressively
        setGeneratedImages([...results]);
      }

      toast.success('Images generated successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate images';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedStyle, selectedSize]);

  // Select and insert image
  const handleSelectImage = useCallback(() => {
    if (!selectedImageId) {
      toast.error('Please select an image');
      return;
    }

    const selectedImage = generatedImages.find(img => img.id === selectedImageId);
    if (!selectedImage) return;

    // Use the revised prompt as alt text
    onSelectImage(selectedImage.url, selectedImage.revisedPrompt);
    onClose();
    
    // Reset state
    setGeneratedImages([]);
    setSelectedImageId(null);
    setPrompt('');
    
    toast.success('Image inserted!');
  }, [selectedImageId, generatedImages, onSelectImage, onClose]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      handleGenerate();
    }
  }, [onClose, handleGenerate]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-image-modal-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 id="ai-image-modal-title" className="text-lg font-semibold text-gray-900">
                Generate AI Image
              </h2>
              <p className="text-sm text-gray-500">
                Create images with DALL-E 3
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="image-prompt" className="text-sm font-medium text-gray-700">
                  Image Description
                </Label>
                {context && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggestPrompt}
                    disabled={isSuggestingPrompt}
                    className="text-xs text-violet-600 hover:text-violet-700"
                    aria-label="Suggest prompt based on article content"
                  >
                    {isSuggestingPrompt ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Suggest from content
                  </Button>
                )}
              </div>
              <Input
                ref={inputRef}
                id="image-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="text-base"
                aria-describedby="prompt-hint"
              />
              <p id="prompt-hint" className="text-xs text-gray-500">
                Be specific about subject, style, colors, and mood for better results
              </p>
            </div>

            {/* Style Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Style</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {IMAGE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      selectedStyle === style.id
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                    aria-pressed={selectedStyle === style.id}
                    aria-label={`${style.label} style: ${style.description}`}
                  >
                    <div className={cn(
                      "p-2 rounded-md",
                      selectedStyle === style.id ? "bg-violet-100" : "bg-gray-100"
                    )}>
                      {style.icon}
                    </div>
                    <span className="text-xs font-medium">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Size</Label>
              <div className="flex gap-2">
                {IMAGE_SIZES.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all",
                      selectedSize === size.id
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                    aria-pressed={selectedSize === size.id}
                    aria-label={`${size.label} size: ${size.dimensions}`}
                  >
                    {size.icon}
                    <div className="text-left">
                      <div className="text-sm font-medium">{size.label}</div>
                      <div className="text-xs opacity-70">{size.dimensions}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating {generatedImages.length}/4 images...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Images
                </>
              )}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Generated Images Grid */}
            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Generated Images
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    Click to select
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageId(image.id)}
                      className={cn(
                        "relative group aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        selectedImageId === image.id
                          ? "border-violet-500 ring-2 ring-violet-200"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      aria-pressed={selectedImageId === image.id}
                      aria-label={`Select image: ${image.revisedPrompt.substring(0, 50)}...`}
                    >
                      <img
                        src={image.url}
                        alt={image.revisedPrompt}
                        className="w-full h-full object-cover"
                      />
                      {selectedImageId === image.id && (
                        <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                          <div className="p-2 bg-violet-500 rounded-full text-white">
                            <Check className="h-5 w-5" />
                          </div>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <a
                            href={image.url}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                            aria-label="Download image"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected image prompt */}
                {selectedImageId && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Revised prompt:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {generatedImages.find(img => img.id === selectedImageId)?.revisedPrompt}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            Powered by DALL-E 3 • Images are permanently stored
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelectImage}
              disabled={!selectedImageId}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Insert Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIImageModal;

