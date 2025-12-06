/**
 * Document Generator
 * 
 * AI-powered document generation for the Creator page.
 * Uses OpenAI GPT-4o to generate content based on document type and user inputs.
 */

import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';

// Document section structure
export interface DocumentSection {
  id: string;
  type: 'title' | 'heading' | 'paragraph' | 'list' | 'cta';
  content: string;
  editable: boolean;
}

export interface GeneratedDocument {
  title: string;
  sections: DocumentSection[];
}

// System prompts for each document type
const DOCUMENT_PROMPTS: Record<string, string> = {
  newsletter: `You are an expert email copywriter creating a professional newsletter.
Write engaging, scannable content that:
- Has a compelling subject line and preview text
- Uses short paragraphs and bullet points
- Includes a clear call-to-action
- Maintains a friendly but professional tone
- Is optimized for mobile reading`,

  blog: `You are a skilled content writer creating an SEO-optimized blog post.
Write informative, engaging content that:
- Has a compelling headline and meta description
- Uses subheadings (H2, H3) to structure content
- Includes actionable tips and insights
- Has a clear introduction and conclusion
- Is between 800-1500 words for good SEO`,

  social: `You are a social media expert creating engaging social content.
Write content that:
- Hooks the reader in the first line
- Is optimized for the specific platform
- Uses relevant hashtags and mentions
- Includes a clear call-to-action
- Encourages engagement (likes, comments, shares)`,

  proposal: `You are a business development expert creating a compelling proposal.
Write a professional proposal that:
- Opens with an understanding of the client's needs
- Clearly outlines the solution and deliverables
- Includes timeline and investment details
- Highlights unique value propositions
- Has a strong closing with next steps`,

  document: `You are a professional business writer creating a formal document.
Write clear, organized content that:
- Has a logical structure with sections
- Uses professional language
- Includes all necessary details
- Is easy to scan and understand
- Follows business document conventions`,

  presentation: `You are a presentation design expert creating engaging slide content.
Write content that:
- Has a clear narrative arc
- Uses bullet points and short phrases
- Includes one key message per slide
- Has a strong opening and closing
- Is visual and easy to present`,

  'brand-kit': `You are a brand strategist creating comprehensive brand guidelines.
Write guidelines that:
- Define the brand voice and tone
- Include messaging frameworks
- Provide examples of dos and don'ts
- Cover different channels and contexts
- Are practical and easy to follow`,

  image: `You are a creative director guiding image creation.
Provide a detailed description that:
- Describes the visual concept clearly
- Specifies colors, style, and mood
- Includes composition suggestions
- Mentions any text overlays needed
- Is suitable for AI image generation`,
};

/**
 * Generate a document using OpenAI GPT-4o
 */
export async function generateDocument(
  docTypeId: string,
  docTypeName: string,
  answers: Record<string, string>
): Promise<GeneratedDocument> {
  const openai = getOpenAI();
  
  // Get the system prompt for this document type
  const systemPrompt = DOCUMENT_PROMPTS[docTypeId] || DOCUMENT_PROMPTS.document;
  
  // Build the user prompt from answers
  const userPrompt = buildUserPrompt(docTypeId, docTypeName, answers);
  
  logger.info('[Document Generator] Generating document', {
    docTypeId,
    docTypeName,
    answersCount: Object.keys(answers).length,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Ensure we have the expected structure
    const document = normalizeGeneratedDocument(parsed, docTypeId, answers);
    
    logger.info('[Document Generator] Document generated successfully', {
      docTypeId,
      sectionsCount: document.sections.length,
    });

    return document;
  } catch (error) {
    logger.error('[Document Generator] Generation failed', error);
    throw error;
  }
}

/**
 * Build user prompt from document type and answers
 */
function buildUserPrompt(
  docTypeId: string,
  docTypeName: string,
  answers: Record<string, string>
): string {
  const answersText = Object.entries(answers)
    .map(([key, value]) => `- ${formatKey(key)}: ${value}`)
    .join('\n');

  return `Create a ${docTypeName} based on these requirements:

${answersText}

Return a JSON object with this structure:
{
  "title": "Document title",
  "sections": [
    { "type": "title", "content": "Main Title" },
    { "type": "heading", "content": "Section Heading" },
    { "type": "paragraph", "content": "Paragraph text..." },
    { "type": "list", "content": "Item 1\\nItem 2\\nItem 3" },
    { "type": "cta", "content": "Call to action text" }
  ]
}

IMPORTANT:
- Generate real, specific content based on the requirements
- Use multiple sections appropriate for a ${docTypeName}
- Each section should have meaningful content
- Lists should use \\n to separate items
- Include a compelling title`;
}

/**
 * Format a camelCase or snake_case key to readable text
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\s+/, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize the generated document to ensure consistent structure
 */
function normalizeGeneratedDocument(
  parsed: unknown,
  docTypeId: string,
  answers: Record<string, string>
): GeneratedDocument {
  // Handle various response formats
  const data = parsed as Record<string, unknown>;
  
  let title = '';
  let sections: DocumentSection[] = [];

  // Extract title
  if (typeof data.title === 'string') {
    title = data.title;
  } else {
    // Generate a title from answers
    title = generateTitle(docTypeId, answers);
  }

  // Extract sections
  if (Array.isArray(data.sections)) {
    sections = data.sections.map((section, index) => {
      const s = section as Record<string, unknown>;
      return {
        id: `section-${index}`,
        type: normalizeType(s.type as string),
        content: String(s.content || ''),
        editable: true,
      };
    });
  }

  // Ensure we have at least a title section
  if (sections.length === 0 || sections[0]?.type !== 'title') {
    sections.unshift({
      id: 'title',
      type: 'title',
      content: title,
      editable: true,
    });
  }

  return { title, sections };
}

/**
 * Normalize section type to valid values
 */
function normalizeType(type: string): 'title' | 'heading' | 'paragraph' | 'list' | 'cta' {
  const validTypes = ['title', 'heading', 'paragraph', 'list', 'cta'];
  if (validTypes.includes(type)) {
    return type as 'title' | 'heading' | 'paragraph' | 'list' | 'cta';
  }
  // Map common variations
  if (type === 'h1' || type === 'h2' || type === 'h3' || type === 'subheading') {
    return 'heading';
  }
  if (type === 'bullet' || type === 'bullets' || type === 'ul' || type === 'ol') {
    return 'list';
  }
  if (type === 'button' || type === 'action') {
    return 'cta';
  }
  return 'paragraph';
}

/**
 * Generate a default title from answers
 */
function generateTitle(docTypeId: string, answers: Record<string, string>): string {
  switch (docTypeId) {
    case 'newsletter':
      return answers.headline || answers.subject || `${answers.purpose || 'Weekly'} Newsletter`;
    case 'blog':
      return answers.topic || answers.title || 'Untitled Blog Post';
    case 'social':
      return `${answers.platform || 'Social'} Post: ${(answers.topic || 'Update').slice(0, 30)}`;
    case 'proposal':
      return `Proposal for ${answers.clientName || answers.client || 'Client'}`;
    case 'document':
      return answers.title || answers.purpose?.slice(0, 50) || 'New Document';
    case 'presentation':
      return `${answers.purpose || 'Presentation'}: ${(answers.keyMessage || '').slice(0, 30)}`;
    case 'brand-kit':
      return `${answers.brandName || 'Brand'} Brand Guidelines`;
    case 'image':
      return `${answers.imageType || 'Image'} - ${(answers.textOverlay || 'Design').slice(0, 30)}`;
    default:
      return `New ${docTypeId.charAt(0).toUpperCase() + docTypeId.slice(1)}`;
  }
}

/**
 * Generate document with streaming (for future use)
 */
export async function generateDocumentStream(
  docTypeId: string,
  docTypeName: string,
  answers: Record<string, string>,
  onChunk: (chunk: string) => void
): Promise<GeneratedDocument> {
  const openai = getOpenAI();
  const systemPrompt = DOCUMENT_PROMPTS[docTypeId] || DOCUMENT_PROMPTS.document;
  const userPrompt = buildUserPrompt(docTypeId, docTypeName, answers);

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: true,
  });

  let fullContent = '';
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullContent += content;
    onChunk(content);
  }

  // Parse the final content
  try {
    const parsed = JSON.parse(fullContent);
    return normalizeGeneratedDocument(parsed, docTypeId, answers);
  } catch {
    // If JSON parsing fails, create a simple document structure
    return {
      title: generateTitle(docTypeId, answers),
      sections: [
        { id: 'title', type: 'title', content: generateTitle(docTypeId, answers), editable: true },
        { id: 'content', type: 'paragraph', content: fullContent, editable: true },
      ],
    };
  }
}
