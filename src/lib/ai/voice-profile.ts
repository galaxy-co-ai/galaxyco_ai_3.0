/**
 * Voice Profile Utilities for Article Studio
 * 
 * This module provides helpers for building voice-aware AI prompts
 * based on the workspace's blog voice profile.
 */

import { db } from '@/lib/db';
import { blogVoiceProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Type for voice profile structure
export interface VoiceProfile {
  id: string;
  workspaceId: string;
  toneDescriptors: string[] | null;
  examplePhrases: string[] | null;
  avoidPhrases: string[] | null;
  avgSentenceLength: number | null;
  structurePreferences: {
    preferredIntroStyle?: string;
    preferredConclusionStyle?: string;
    usesSubheadings?: boolean;
    usesBulletPoints?: boolean;
    includesCallToAction?: boolean;
  } | null;
  analyzedPostCount: number | null;
  lastAnalyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Options for customizing the voice prompt section
export interface VoicePromptOptions {
  /** Include tone descriptors in the prompt */
  includeTone?: boolean;
  /** Include example phrases in the prompt */
  includeExamples?: boolean;
  /** Include phrases to avoid in the prompt */
  includeAvoid?: boolean;
  /** Include sentence length target */
  includeSentenceLength?: boolean;
  /** Include structure preferences */
  includeStructure?: boolean;
  /** Maximum number of example phrases to include */
  maxExamples?: number;
  /** Maximum number of avoid phrases to include */
  maxAvoidPhrases?: number;
}

const DEFAULT_OPTIONS: VoicePromptOptions = {
  includeTone: true,
  includeExamples: true,
  includeAvoid: true,
  includeSentenceLength: true,
  includeStructure: false,
  maxExamples: 5,
  maxAvoidPhrases: 5,
};

/**
 * Get a voice profile for a workspace from the database
 */
export async function getWorkspaceVoiceProfile(workspaceId: string): Promise<VoiceProfile | null> {
  try {
    const profile = await db.query.blogVoiceProfiles.findFirst({
      where: eq(blogVoiceProfiles.workspaceId, workspaceId),
    });
    return profile as VoiceProfile | null;
  } catch {
    return null;
  }
}

/**
 * Build a voice profile prompt section for AI generation
 * 
 * @param profile - The voice profile to use (or null if none exists)
 * @param options - Options to customize what's included in the prompt
 * @returns A formatted string to include in AI system prompts, or empty string if no profile
 */
export function getVoicePromptSection(
  profile: VoiceProfile | null,
  options: VoicePromptOptions = {}
): string {
  if (!profile) {
    return '';
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sections: string[] = [];

  // Tone descriptors
  if (opts.includeTone) {
    const toneDescriptors = profile.toneDescriptors || [];
    if (toneDescriptors.length > 0) {
      sections.push(`- Writing Tone: ${toneDescriptors.join(', ')}`);
    }
  }

  // Example phrases
  if (opts.includeExamples) {
    const examplePhrases = profile.examplePhrases || [];
    if (examplePhrases.length > 0) {
      const examples = examplePhrases.slice(0, opts.maxExamples || 5);
      sections.push(`- Example Phrases to Emulate: "${examples.join('" | "')}"`);
    }
  }

  // Phrases to avoid
  if (opts.includeAvoid) {
    const avoidPhrases = profile.avoidPhrases || [];
    if (avoidPhrases.length > 0) {
      const avoid = avoidPhrases.slice(0, opts.maxAvoidPhrases || 5);
      sections.push(`- Phrases to Avoid: ${avoid.join(', ')}`);
    }
  }

  // Sentence length
  if (opts.includeSentenceLength && profile.avgSentenceLength) {
    sections.push(`- Target Sentence Length: ~${profile.avgSentenceLength} words per sentence`);
  }

  // Structure preferences
  if (opts.includeStructure && profile.structurePreferences) {
    const prefs = profile.structurePreferences;
    const structureParts: string[] = [];
    
    if (prefs.preferredIntroStyle) {
      structureParts.push(`Introduction style: ${prefs.preferredIntroStyle}`);
    }
    if (prefs.preferredConclusionStyle) {
      structureParts.push(`Conclusion style: ${prefs.preferredConclusionStyle}`);
    }
    if (prefs.usesSubheadings !== undefined) {
      structureParts.push(prefs.usesSubheadings ? 'Uses subheadings' : 'Minimal subheadings');
    }
    if (prefs.usesBulletPoints !== undefined) {
      structureParts.push(prefs.usesBulletPoints ? 'Uses bullet points' : 'Prose preferred over bullets');
    }
    if (prefs.includesCallToAction !== undefined) {
      structureParts.push(prefs.includesCallToAction ? 'Include call-to-action' : 'Soft endings preferred');
    }
    
    if (structureParts.length > 0) {
      sections.push(`- Structure Preferences: ${structureParts.join('; ')}`);
    }
  }

  // Return formatted section
  if (sections.length === 0) {
    return '';
  }

  return `\n\nVOICE PROFILE (match this writing style):
${sections.join('\n')}`;
}

/**
 * Build a voice profile prompt section with full context
 * Fetches the profile from the database and builds the prompt
 * 
 * @param workspaceId - The workspace ID to get the profile for
 * @param options - Options to customize what's included in the prompt
 * @returns A formatted string to include in AI system prompts
 */
export async function getVoicePromptSectionForWorkspace(
  workspaceId: string,
  options: VoicePromptOptions = {}
): Promise<string> {
  const profile = await getWorkspaceVoiceProfile(workspaceId);
  return getVoicePromptSection(profile, options);
}

/**
 * Check if a voice profile has meaningful content
 * (useful for UI to show whether analysis is needed)
 */
export function hasVoiceProfileContent(profile: VoiceProfile | null): boolean {
  if (!profile) return false;
  
  const hasTone = (profile.toneDescriptors?.length || 0) > 0;
  const hasExamples = (profile.examplePhrases?.length || 0) > 0;
  const hasAvoid = (profile.avoidPhrases?.length || 0) > 0;
  const hasSentenceLength = profile.avgSentenceLength !== null;
  
  return hasTone || hasExamples || hasAvoid || hasSentenceLength;
}

/**
 * Format a voice profile for display in the UI
 */
export function formatVoiceProfileSummary(profile: VoiceProfile | null): string {
  if (!profile) {
    return 'No voice profile configured';
  }

  const parts: string[] = [];
  
  const toneCount = profile.toneDescriptors?.length || 0;
  if (toneCount > 0) {
    parts.push(`${toneCount} tone descriptor${toneCount !== 1 ? 's' : ''}`);
  }
  
  const exampleCount = profile.examplePhrases?.length || 0;
  if (exampleCount > 0) {
    parts.push(`${exampleCount} example phrase${exampleCount !== 1 ? 's' : ''}`);
  }
  
  const avoidCount = profile.avoidPhrases?.length || 0;
  if (avoidCount > 0) {
    parts.push(`${avoidCount} phrase${avoidCount !== 1 ? 's' : ''} to avoid`);
  }
  
  if (profile.avgSentenceLength) {
    parts.push(`~${profile.avgSentenceLength} words/sentence`);
  }
  
  if (parts.length === 0) {
    return 'Voice profile exists but has no content';
  }
  
  return parts.join(' • ');
}

