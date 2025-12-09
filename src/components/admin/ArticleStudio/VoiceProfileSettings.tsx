"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Loader2,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Save,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Type for voice profile from API
interface VoiceProfile {
  id?: string;
  workspaceId?: string;
  toneDescriptors: string[];
  examplePhrases: string[];
  avoidPhrases: string[];
  avgSentenceLength: number | null;
  structurePreferences: {
    preferredIntroStyle?: string | null;
    preferredConclusionStyle?: string | null;
    usesSubheadings?: boolean;
    usesBulletPoints?: boolean;
    includesCallToAction?: boolean;
  } | null;
  analyzedPostCount?: number | null;
  lastAnalyzedAt?: string | null;
}

// Type for comparison data
interface ProfileComparison {
  before: {
    toneDescriptors: string[];
    examplePhrases: string[];
    avoidPhrases: string[];
    avgSentenceLength: number | null;
  };
  after: {
    toneDescriptors: string[];
    examplePhrases: string[];
    avoidPhrases: string[];
    avgSentenceLength: number | null;
  };
}

interface VoiceProfileSettingsProps {
  onProfileUpdated?: (profile: VoiceProfile) => void;
}

// Tag input component for managing string arrays
function TagInput({
  tags,
  onTagsChange,
  placeholder,
  label,
  description,
  maxLength = 200,
  maxTags = 10,
  disabled = false,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  label: string;
  description: string;
  maxLength?: number;
  maxTags?: number;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (tags.length >= maxTags) {
        toast.error(`Maximum ${maxTags} items allowed`);
        return;
      }
      if (inputValue.trim().length > maxLength) {
        toast.error(`Maximum ${maxLength} characters per item`);
        return;
      }
      if (!tags.includes(inputValue.trim())) {
        onTagsChange([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">{tags.length}/{maxTags}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-background">
        {tags.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
          >
            <span className="max-w-[200px] truncate">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="ml-1 hover:bg-muted rounded-full p-0.5 disabled:opacity-50"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          disabled={disabled || tags.length >= maxTags}
          className="flex-1 min-w-[150px] border-0 shadow-none focus-visible:ring-0 h-8 px-1"
          aria-label={`Add ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

export function VoiceProfileSettings({ onProfileUpdated }: VoiceProfileSettingsProps) {
  const [profile, setProfile] = useState<VoiceProfile>({
    toneDescriptors: [],
    examplePhrases: [],
    avoidPhrases: [],
    avgSentenceLength: null,
    structurePreferences: {
      usesSubheadings: true,
      usesBulletPoints: true,
      includesCallToAction: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [comparison, setComparison] = useState<ProfileComparison | null>(null);
  const [profileExists, setProfileExists] = useState(false);

  // Load existing profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/blog-profile');
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      
      if (data.exists && data.profile) {
        setProfile({
          ...data.profile,
          toneDescriptors: data.profile.toneDescriptors || [],
          examplePhrases: data.profile.examplePhrases || [],
          avoidPhrases: data.profile.avoidPhrases || [],
          structurePreferences: data.profile.structurePreferences || {
            usesSubheadings: true,
            usesBulletPoints: true,
            includesCallToAction: true,
          },
        });
        setProfileExists(true);
      } else {
        setProfile(data.profile);
        setProfileExists(false);
      }
    } catch (error) {
      toast.error('Failed to load voice profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze blog posts to extract voice profile
  const analyzeProfile = async () => {
    setIsAnalyzing(true);
    setComparison(null);
    
    try {
      const response = await fetch('/api/admin/blog-profile/analyze', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze blog');
      }

      const data = await response.json();
      setProfile({
        ...data.profile,
        toneDescriptors: data.profile.toneDescriptors || [],
        examplePhrases: data.profile.examplePhrases || [],
        avoidPhrases: data.profile.avoidPhrases || [],
        structurePreferences: data.profile.structurePreferences || {
          usesSubheadings: true,
          usesBulletPoints: true,
          includesCallToAction: true,
        },
      });
      setProfileExists(true);
      setComparison(data.comparison);
      setHasChanges(false);
      
      toast.success(`Analyzed ${data.postsAnalyzed} posts - voice profile updated!`);
      
      if (onProfileUpdated) {
        onProfileUpdated(data.profile);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze blog');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save manual changes to profile
  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/blog-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toneDescriptors: profile.toneDescriptors,
          examplePhrases: profile.examplePhrases,
          avoidPhrases: profile.avoidPhrases,
          avgSentenceLength: profile.avgSentenceLength,
          structurePreferences: profile.structurePreferences,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      const data = await response.json();
      setProfile({
        ...data.profile,
        toneDescriptors: data.profile.toneDescriptors || [],
        examplePhrases: data.profile.examplePhrases || [],
        avoidPhrases: data.profile.avoidPhrases || [],
      });
      setProfileExists(true);
      setHasChanges(false);
      
      toast.success('Voice profile saved');
      
      if (onProfileUpdated) {
        onProfileUpdated(data.profile);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Update profile field
  const updateProfile = useCallback((updates: Partial<VoiceProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            Voice Profile
          </CardTitle>
          <CardDescription>
            AI learns your writing style to generate content that matches your voice.
            Analyze your published posts or manually configure your preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Analyze Button */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-violet-50 border border-violet-100">
            <div className="flex-1">
              <h3 className="font-medium text-violet-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Auto-Analyze Your Blog
              </h3>
              <p className="text-sm text-violet-700 mt-1">
                AI will analyze your published posts to extract your writing patterns, tone, and style.
              </p>
              {profile.lastAnalyzedAt && (
                <p className="text-xs text-violet-600 mt-2">
                  Last analyzed: {new Date(profile.lastAnalyzedAt).toLocaleDateString()} 
                  ({profile.analyzedPostCount || 0} posts)
                </p>
              )}
            </div>
            <Button
              onClick={analyzeProfile}
              disabled={isAnalyzing}
              className="bg-violet-600 hover:bg-violet-700 text-white"
              aria-label={isAnalyzing ? 'Analyzing blog...' : 'Analyze my blog'}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyze My Blog
                </>
              )}
            </Button>
          </div>

          {/* Comparison Display */}
          {comparison && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-900 flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4" />
                Profile Updated
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Before:</span>
                  <ul className="text-green-800 mt-1 space-y-1">
                    <li>{comparison.before.toneDescriptors.length} tone descriptors</li>
                    <li>{comparison.before.examplePhrases.length} example phrases</li>
                    <li>{comparison.before.avgSentenceLength || 'N/A'} avg sentence length</li>
                  </ul>
                </div>
                <div>
                  <span className="text-green-700 font-medium">After:</span>
                  <ul className="text-green-800 mt-1 space-y-1">
                    <li>{comparison.after.toneDescriptors.length} tone descriptors</li>
                    <li>{comparison.after.examplePhrases.length} example phrases</li>
                    <li>{comparison.after.avgSentenceLength || 'N/A'} avg sentence length</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Not analyzed info */}
          {!profileExists && !comparison && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">No Voice Profile Yet</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Click &quot;Analyze My Blog&quot; to automatically extract your writing style from published posts,
                  or manually configure the settings below.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voice Settings</CardTitle>
          <CardDescription>
            Fine-tune your writing voice. These settings are used when AI generates content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tone Descriptors */}
          <TagInput
            tags={profile.toneDescriptors}
            onTagsChange={(tags) => updateProfile({ toneDescriptors: tags })}
            label="Tone Descriptors"
            description="Adjectives that describe your writing voice (press Enter to add)"
            placeholder="e.g., friendly, professional, witty"
            maxLength={50}
            maxTags={10}
            disabled={isAnalyzing}
          />

          {/* Example Phrases */}
          <TagInput
            tags={profile.examplePhrases}
            onTagsChange={(tags) => updateProfile({ examplePhrases: tags })}
            label="Example Phrases"
            description="Short phrases that exemplify your writing style"
            placeholder="e.g., Let's dive in, Here's the thing"
            maxLength={200}
            maxTags={20}
            disabled={isAnalyzing}
          />

          {/* Avoid Phrases */}
          <TagInput
            tags={profile.avoidPhrases}
            onTagsChange={(tags) => updateProfile({ avoidPhrases: tags })}
            label="Phrases to Avoid"
            description="Common phrases you don't want AI to use"
            placeholder="e.g., At the end of the day, It goes without saying"
            maxLength={200}
            maxTags={20}
            disabled={isAnalyzing}
          />

          {/* Sentence Length */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Average Sentence Length</Label>
            <p className="text-xs text-muted-foreground">
              Target number of words per sentence (typically 10-25)
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={5}
                max={50}
                value={profile.avgSentenceLength || ''}
                onChange={(e) => updateProfile({ 
                  avgSentenceLength: e.target.value ? parseInt(e.target.value, 10) : null 
                })}
                placeholder="e.g., 15"
                className="w-24"
                disabled={isAnalyzing}
                aria-label="Average sentence length"
              />
              <span className="text-sm text-muted-foreground">words per sentence</span>
            </div>
          </div>

          {/* Structure Preferences */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Structure Preferences</Label>
            <div className="flex flex-wrap gap-3">
              <ToggleButton
                active={profile.structurePreferences?.usesSubheadings ?? true}
                onClick={() => updateProfile({
                  structurePreferences: {
                    ...profile.structurePreferences,
                    usesSubheadings: !profile.structurePreferences?.usesSubheadings,
                  },
                })}
                disabled={isAnalyzing}
              >
                Uses Subheadings
              </ToggleButton>
              <ToggleButton
                active={profile.structurePreferences?.usesBulletPoints ?? true}
                onClick={() => updateProfile({
                  structurePreferences: {
                    ...profile.structurePreferences,
                    usesBulletPoints: !profile.structurePreferences?.usesBulletPoints,
                  },
                })}
                disabled={isAnalyzing}
              >
                Uses Bullet Points
              </ToggleButton>
              <ToggleButton
                active={profile.structurePreferences?.includesCallToAction ?? true}
                onClick={() => updateProfile({
                  structurePreferences: {
                    ...profile.structurePreferences,
                    includesCallToAction: !profile.structurePreferences?.includesCallToAction,
                  },
                })}
                disabled={isAnalyzing}
              >
                Includes CTA
              </ToggleButton>
            </div>
          </div>

          {/* Intro/Conclusion Styles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred Intro Style</Label>
              <Input
                value={profile.structurePreferences?.preferredIntroStyle || ''}
                onChange={(e) => updateProfile({
                  structurePreferences: {
                    ...profile.structurePreferences,
                    preferredIntroStyle: e.target.value || null,
                  },
                })}
                placeholder="e.g., Question hook, Bold statement"
                disabled={isAnalyzing}
                aria-label="Preferred introduction style"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred Conclusion Style</Label>
              <Input
                value={profile.structurePreferences?.preferredConclusionStyle || ''}
                onChange={(e) => updateProfile({
                  structurePreferences: {
                    ...profile.structurePreferences,
                    preferredConclusionStyle: e.target.value || null,
                  },
                })}
                placeholder="e.g., Call to action, Summary recap"
                disabled={isAnalyzing}
                aria-label="Preferred conclusion style"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Changes are applied to AI generation immediately after saving.
            </p>
            <Button
              onClick={saveProfile}
              disabled={isSaving || !hasChanges}
              aria-label={isSaving ? 'Saving...' : 'Save voice profile'}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Toggle button component
function ToggleButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 py-1.5 text-sm rounded-full border transition-colors",
        active
          ? "bg-violet-100 border-violet-300 text-violet-800"
          : "bg-muted border-muted-foreground/20 text-muted-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-pressed={active}
      aria-label={`Toggle ${children}`}
    >
      {children}
    </button>
  );
}

