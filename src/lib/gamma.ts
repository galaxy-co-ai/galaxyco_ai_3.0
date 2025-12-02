/**
 * Gamma.app API Client
 * 
 * Creates polished presentations, documents, and more using Gamma's AI.
 * API Docs: https://developers.gamma.app
 */

import { logger } from './logger';

const GAMMA_API_BASE = 'https://public-api.gamma.app/v1.0';

interface GammaGenerateRequest {
  prompt: string;
  contentType: 'presentation' | 'document' | 'webpage' | 'social';
  theme?: string;
  language?: string;
  style?: 'minimal' | 'professional' | 'creative' | 'bold';
}

interface GammaCard {
  title: string;
  content: string;
  imageUrl?: string;
  layout?: string;
}

interface GammaGenerateResponse {
  id: string;
  title: string;
  cards: GammaCard[];
  editUrl: string;
  embedUrl: string;
  exportFormats: {
    pdf?: string;
    pptx?: string;
  };
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
}

interface GammaError {
  error: string;
  message: string;
  code: string;
}

/**
 * Check if Gamma API is configured
 */
export function isGammaConfigured(): boolean {
  return !!process.env.GAMMA_API_KEY;
}

/**
 * Get Gamma API key
 */
function getApiKey(): string {
  const apiKey = process.env.GAMMA_API_KEY;
  if (!apiKey) {
    throw new Error('GAMMA_API_KEY is not configured');
  }
  return apiKey;
}

/**
 * Generate content using Gamma API
 */
export async function generateWithGamma(
  request: GammaGenerateRequest
): Promise<GammaGenerateResponse> {
  const apiKey = getApiKey();

  try {
    const response = await fetch(`${GAMMA_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        content_type: request.contentType,
        theme: request.theme || 'default',
        language: request.language || 'en',
        style: request.style || 'professional',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as GammaError;
      logger.error('Gamma API error', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(errorData.message || `Gamma API error: ${response.status}`);
    }

    const data = await response.json() as GammaGenerateResponse;
    
    logger.info('Gamma generation successful', { 
      id: data.id, 
      title: data.title,
      cardCount: data.cards?.length 
    });

    return data;
  } catch (error) {
    logger.error('Gamma generation failed', { error });
    throw error;
  }
}

/**
 * Poll for generation status (Gamma uses async generation)
 */
export async function pollGammaGeneration(
  generationId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<GammaGenerateResponse> {
  const apiKey = getApiKey();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${GAMMA_API_BASE}/generations/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check generation status: ${response.status}`);
      }

      const data = await response.json() as GammaGenerateResponse;

      if (data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        throw new Error('Gamma generation failed');
      }

      // Still processing, wait and retry
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      logger.error('Error polling Gamma generation', { generationId, attempt, error });
      throw error;
    }
  }

  throw new Error('Gamma generation timed out');
}

/**
 * Map our document types to Gamma content types
 */
export function mapDocTypeToGammaType(docTypeId: string): GammaGenerateRequest['contentType'] | null {
  const mapping: Record<string, GammaGenerateRequest['contentType']> = {
    'presentation': 'presentation',
    'document': 'document',
    'proposal': 'document',
    'newsletter': 'document',
    'blog': 'document',
    'social': 'social',
  };
  
  return mapping[docTypeId] || null;
}

/**
 * Build a prompt for Gamma from user answers
 */
export function buildGammaPrompt(
  docTypeId: string,
  docTypeName: string,
  answers: Record<string, string>
): string {
  const parts: string[] = [];
  
  // Add document type context
  parts.push(`Create a professional ${docTypeName.toLowerCase()}.`);
  
  // Add relevant answers as context
  const answerEntries = Object.entries(answers).filter(([_, value]) => value?.trim());
  
  if (answerEntries.length > 0) {
    parts.push('\nContext and requirements:');
    
    for (const [key, value] of answerEntries) {
      // Convert camelCase to readable labels
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      parts.push(`- ${label}: ${value}`);
    }
  }
  
  // Add type-specific instructions
  switch (docTypeId) {
    case 'presentation':
      parts.push('\nMake it visually engaging with clear slide structure.');
      break;
    case 'proposal':
      parts.push('\nInclude executive summary, scope, timeline, and pricing sections.');
      break;
    case 'newsletter':
      parts.push('\nMake it scannable with clear sections and a strong call-to-action.');
      break;
    case 'blog':
      parts.push('\nOptimize for readability with headers, bullet points, and a compelling intro.');
      break;
  }
  
  return parts.join('\n');
}

/**
 * Get style from user's tone preference
 */
export function mapToneToGammaStyle(tone?: string): GammaGenerateRequest['style'] {
  if (!tone) return 'professional';
  
  const toneLower = tone.toLowerCase();
  
  if (toneLower.includes('creative') || toneLower.includes('playful') || toneLower.includes('fun')) {
    return 'creative';
  }
  if (toneLower.includes('bold') || toneLower.includes('impactful') || toneLower.includes('vibrant')) {
    return 'bold';
  }
  if (toneLower.includes('minimal') || toneLower.includes('clean') || toneLower.includes('simple')) {
    return 'minimal';
  }
  
  return 'professional';
}

// Export types
export type { 
  GammaGenerateRequest, 
  GammaGenerateResponse, 
  GammaCard,
  GammaError 
};
