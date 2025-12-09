import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getOpenAI } from '@/lib/ai-providers';
import { uploadFile, isStorageConfigured } from '@/lib/storage';
import { logger } from '@/lib/logger';

// Request schemas
const generateImageSchema = z.object({
  action: z.literal('generate'),
  prompt: z.string().min(1).max(4000),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
  style: z.enum(['vivid', 'natural']).default('vivid'),
  variation: z.number().min(1).max(10).optional(), // For creating slight variations
});

const suggestPromptSchema = z.object({
  action: z.literal('suggest'),
  context: z.string().min(1).max(10000),
});

const requestSchema = z.discriminatedUnion('action', [
  generateImageSchema,
  suggestPromptSchema,
]);

/**
 * POST /api/admin/ai/image
 * Generate images with DALL-E 3 or suggest image prompts based on content
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Handle prompt suggestion
    if (data.action === 'suggest') {
      return handleSuggestPrompt(data.context);
    }

    // Handle image generation
    return handleGenerateImage(data);
  } catch (error) {
    logger.error('AI image API error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Suggest an image prompt based on article content
 */
async function handleSuggestPrompt(context: string): Promise<NextResponse> {
  const openai = getOpenAI();

  logger.info('Suggesting image prompt from context', {
    contextLength: context.length,
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating image prompts for DALL-E 3. Based on the provided article content, suggest a relevant, visually interesting image prompt.

Guidelines:
- Focus on the main concept or theme of the content
- Be specific about visual elements (colors, composition, mood, lighting)
- Avoid text in images (DALL-E struggles with text)
- Suggest something that complements the article without being too literal
- Keep the prompt concise but descriptive (50-150 words)

Respond with ONLY the image prompt, no explanations or prefixes.`,
        },
        {
          role: 'user',
          content: `Article content:\n\n${context.substring(0, 3000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const suggestedPrompt = response.choices[0]?.message?.content?.trim();
    
    if (!suggestedPrompt) {
      throw new Error('No prompt suggestion generated');
    }

    logger.info('Image prompt suggested', {
      promptLength: suggestedPrompt.length,
    });

    return NextResponse.json({
      suggestedPrompt,
    });
  } catch (error) {
    logger.error('Prompt suggestion failed', error);
    throw error;
  }
}

/**
 * Generate an image using DALL-E 3 and persist to Vercel Blob
 */
async function handleGenerateImage(params: z.infer<typeof generateImageSchema>): Promise<NextResponse> {
  const openai = getOpenAI();

  // Check if storage is configured
  if (!isStorageConfigured()) {
    logger.warn('Blob storage not configured, images will use temporary URLs');
  }

  // Add variation hint to create different images
  let enhancedPrompt = params.prompt;
  if (params.variation) {
    const variationHints = [
      'from a different angle',
      'with a slightly different composition',
      'with alternative lighting',
      'with a different color palette emphasis',
      'from a unique perspective',
      'with varied depth of field',
      'with contrasting mood',
      'showcasing different details',
      'with alternative framing',
      'with a fresh interpretation',
    ];
    const hint = variationHints[(params.variation - 1) % variationHints.length];
    enhancedPrompt = `${params.prompt}. Create this ${hint}.`;
  }

  logger.info('Generating image with DALL-E 3', {
    promptLength: enhancedPrompt.length,
    size: params.size,
    style: params.style,
    variation: params.variation,
  });

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      size: params.size,
      quality: 'hd',
      style: params.style,
      n: 1,
    });

    if (!response.data || !response.data[0]) {
      throw new Error('No image data returned from DALL-E');
    }

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt || params.prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    logger.debug('DALL-E image generated, uploading to Blob', { 
      imageUrl: imageUrl.substring(0, 50) + '...',
    });

    // If storage is not configured, return the temporary URL
    if (!isStorageConfigured()) {
      logger.warn('Returning temporary DALL-E URL - image will expire');
      return NextResponse.json({
        url: imageUrl,
        revisedPrompt,
        size: params.size,
        persistent: false,
        warning: 'Image URL is temporary. Configure BLOB_READ_WRITE_TOKEN for persistent storage.',
      });
    }

    // Download image and upload to Vercel Blob for persistence
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }
    
    const imageBlob = await imageResponse.blob();
    const timestamp = Date.now();
    const sizeLabel = params.size.replace('x', '-');
    const filename = `article-images/dalle-${timestamp}-${sizeLabel}.png`;
    
    const blobResult = await uploadFile(
      new File([imageBlob], `dalle-image-${timestamp}.png`, { type: 'image/png' }),
      filename,
      {
        contentType: 'image/png',
        access: 'public',
      }
    );

    logger.info('DALL-E image uploaded to Blob', {
      blobUrl: blobResult.url,
      size: params.size,
      fileSize: blobResult.size,
    });

    return NextResponse.json({
      url: blobResult.url,
      revisedPrompt,
      size: params.size,
      persistent: true,
    });
  } catch (error) {
    logger.error('DALL-E image generation failed', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('content_policy')) {
        throw new Error('Image request was rejected due to content policy. Please modify your prompt.');
      }
      if (error.message.includes('billing')) {
        throw new Error('OpenAI billing issue. Please check your API quota.');
      }
      if (error.message.includes('rate_limit')) {
        throw new Error('Rate limit reached. Please wait a moment and try again.');
      }
    }
    
    throw error;
  }
}

