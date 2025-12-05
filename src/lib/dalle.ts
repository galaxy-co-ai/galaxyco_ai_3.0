/**
 * DALL-E 3 Image Generation Client
 * 
 * Generates images using OpenAI's DALL-E 3 and stores them in Vercel Blob
 */

import { getOpenAI } from '@/lib/ai-providers';
import { uploadFile, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';

export interface GenerateImageParams {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface GenerateImageResult {
  url: string;
  revisedPrompt: string;
  size: string;
  quality: string;
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const openai = getOpenAI();

  try {
    logger.info('Generating image with DALL-E 3', {
      promptLength: params.prompt.length,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
      style: params.style || 'vivid',
    });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: params.prompt,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
      style: params.style || 'vivid',
      n: 1,
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt || params.prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    logger.debug('DALL-E image generated, uploading to Blob', { imageUrl });

    if (!isStorageConfigured()) {
      logger.warn('Blob storage not configured, returning temporary URL');
      return {
        url: imageUrl,
        revisedPrompt,
        size: params.size || '1024x1024',
        quality: params.quality || 'standard',
      };
    }

    // Download image and upload to Vercel Blob for persistence
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    const timestamp = Date.now();
    const filename = `dalle/${timestamp}.png`;
    
    const blobResult = await uploadFile(
      new File([imageBlob], 'dalle-image.png', { type: 'image/png' }),
      filename,
      {
        contentType: 'image/png',
        access: 'public',
      }
    );

    logger.info('DALL-E image uploaded to Blob', {
      blobUrl: blobResult.url,
      size: params.size,
    });

    return {
      url: blobResult.url,
      revisedPrompt,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
    };
  } catch (error) {
    logger.error('DALL-E image generation failed', error);
    throw error;
  }
}

/**
 * Check if DALL-E is configured (uses OpenAI API key)
 */
export function isDalleConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
