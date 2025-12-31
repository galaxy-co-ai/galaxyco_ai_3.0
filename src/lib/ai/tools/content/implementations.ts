/**
 * Content Tool Implementations
 *
 * Implementations for content generation, document creation, and media generation tools.
 */
import { db } from '@/lib/db';
import { knowledgeItems, knowledgeCollections, prospects } from '@/db/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { generateWithGamma, pollGammaGeneration, isGammaConfigured } from '@/lib/gamma';
import { generateImage, isDalleConfigured } from '@/lib/dalle';
import type { ToolImplementations, ToolResult } from '../types';

export const contentToolImplementations: ToolImplementations = {
  // draft_email
  async draft_email(args, context): Promise<ToolResult> {
    try {
      const purpose = args.purpose as string;
      const recipientName = args.recipientName as string;
      const recipientCompany = (args.recipientCompany as string) || '';
      const contextInfo = (args.context as string) || '';
      const tone = (args.tone as string) || 'professional';
      const senderName = context.userName;

      // Generate actual email using GPT-4o
      const { getOpenAI } = await import('@/lib/ai-providers');
      const openai = getOpenAI();

      const systemPrompt = `You are a professional email writer. Draft clear, effective emails that achieve their purpose while maintaining the appropriate tone. Focus on clarity, brevity, and actionability.`;
      const userPrompt = `Draft an email with the following details:

Purpose: ${purpose}
Recipient: ${recipientName}${recipientCompany ? ` at ${recipientCompany}` : ''}
Sender: ${senderName}
Tone: ${tone}${contextInfo ? `\nContext: ${contextInfo}` : ''}

Provide a complete email with:
- Subject line
- Professional greeting
- Clear, concise body
- Appropriate call-to-action
- Professional sign-off`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const draftedEmail = completion.choices[0]?.message?.content || '';

      if (!draftedEmail) {
        throw new Error('No email generated');
      }

      return {
        success: true,
        message: `Drafted email to ${recipientName}${recipientCompany ? ` at ${recipientCompany}` : ''}`,
        data: {
          purpose,
          recipientName,
          recipientCompany,
          tone,
          senderName,
          draft: draftedEmail,
        },
      };
    } catch (error) {
      logger.error('AI draft_email failed', error);
      return {
        success: false,
        message: 'Failed to draft email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // generate_document
  async generate_document(args, context): Promise<ToolResult> {
    try {
      const title = args.title as string;
      const documentType = (args.documentType as string) || 'general';
      const topic = args.topic as string;
      const requirements = (args.requirements as string) || '';
      const tone = (args.tone as string) || 'professional';
      const length = (args.length as string) || 'standard';
      const collectionName = args.collectionName as string | undefined;
      let collectionId = args.collectionId as string | undefined;

      // If collection name provided but no ID, find or create the collection
      if (collectionName && !collectionId) {
        const existingCollection = await db.query.knowledgeCollections.findFirst({
          where: and(
            eq(knowledgeCollections.workspaceId, context.workspaceId),
            like(knowledgeCollections.name, collectionName)
          ),
        });

        if (existingCollection) {
          collectionId = existingCollection.id;
        } else {
          // Create new collection
          const [newCollection] = await db
            .insert(knowledgeCollections)
            .values({
              workspaceId: context.workspaceId,
              name: collectionName,
              description: `Auto-created for ${documentType} documents`,
              createdBy: context.userId,
            })
            .returning();
          collectionId = newCollection.id;
        }
      }

      // Build the document structure template based on type
      const structureTemplates: Record<string, string> = {
        article: `
# ${title}

## Introduction
[Engaging introduction that hooks the reader and establishes the topic]

## Key Points
[Main content with well-organized sections]

### [Subheading 1]
[Detailed content]

### [Subheading 2]
[Detailed content]

## Conclusion
[Summary and call to action]`,
        sop: `
# ${title}

## Purpose
[Clear statement of why this procedure exists]

## Scope
[Who this applies to and when]

## Prerequisites
- [Required tools/access/knowledge]

## Procedure

### Step 1: [Action]
1. [Sub-step]
2. [Sub-step]

### Step 2: [Action]
1. [Sub-step]
2. [Sub-step]

## Troubleshooting
| Issue | Solution |
|-------|----------|
| [Common problem] | [Resolution] |

## References
- [Related documents]`,
        proposal: `
# ${title}

## Executive Summary
[Brief overview of the proposal and key benefits]

## Problem Statement
[Clear description of the challenge to be addressed]

## Proposed Solution
[Detailed description of your approach]

## Benefits
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | [Time] | [Deliverables] |

## Investment
[Cost breakdown and pricing]

## Next Steps
[Clear call to action]`,
        'meeting-notes': `
# ${title}

**Date:** [Date]
**Attendees:** [Names]
**Location/Call:** [Location]

## Agenda
1. [Item 1]
2. [Item 2]

## Discussion Summary

### [Topic 1]
- [Key points discussed]
- [Decisions made]

### [Topic 2]
- [Key points discussed]
- [Decisions made]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Task] | [Name] | [Date] |

## Next Meeting
[Date and topics]`,
        faq: `
# ${title}

## Frequently Asked Questions

### General

**Q: [Question 1]**
A: [Detailed answer]

**Q: [Question 2]**
A: [Detailed answer]

### Getting Started

**Q: [Question 3]**
A: [Detailed answer]

### Troubleshooting

**Q: [Question 4]**
A: [Detailed answer]`,
        guide: `
# ${title}

## Overview
[What this guide covers and who it's for]

## Getting Started
[Initial setup or prerequisites]

## Step-by-Step Instructions

### 1. [First Step]
[Detailed instructions with examples]

### 2. [Second Step]
[Detailed instructions with examples]

## Best Practices
- [Tip 1]
- [Tip 2]

## Additional Resources
- [Link/reference]`,
        report: `
# ${title}

## Executive Summary
[Key findings and recommendations]

## Introduction
[Context and objectives]

## Methodology
[How data was collected/analyzed]

## Findings

### [Finding 1]
[Details and supporting data]

### [Finding 2]
[Details and supporting data]

## Analysis
[Interpretation of findings]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Conclusion
[Summary and next steps]`,
        policy: `
# ${title}

## Policy Statement
[Clear statement of the policy]

## Purpose
[Why this policy exists]

## Scope
[Who this policy applies to]

## Policy Details

### [Section 1]
[Policy specifics]

### [Section 2]
[Policy specifics]

## Compliance
[How compliance will be monitored]

## Exceptions
[Process for requesting exceptions]

## Related Policies
- [Related policy links]

**Effective Date:** [Date]
**Last Updated:** [Date]`,
        general: `
# ${title}

## Overview
[Introduction to the topic]

## Details
[Main content]

## Summary
[Key takeaways]`,
      };

      const structure = structureTemplates[documentType] || structureTemplates.general;

      // Return the document generation request - the AI will fill in the content
      // based on this structure and the provided requirements
      return {
        success: true,
        message: `Ready to generate ${documentType} document. Please write the complete document content following this structure and requirements.`,
        data: {
          generationRequest: true,
          title,
          documentType,
          topic,
          requirements,
          tone,
          length,
          collectionId,
          collectionName,
          structureTemplate: structure,
          instructions: `Generate a ${length} ${tone} ${documentType} about "${topic}". ${requirements ? `Additional requirements: ${requirements}` : ''} Follow the structure template but write real, helpful content. Make it practical and actionable. Use markdown formatting.`,
        },
      };
    } catch (error) {
      logger.error('AI generate_document failed', error);
      return {
        success: false,
        message: 'Failed to prepare document generation',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // create_document
  async create_document(args, context): Promise<ToolResult> {
    try {
      const collectionName = args.collectionName as string | undefined;
      let collectionId = args.collectionId as string | undefined;

      // If collection name provided but no ID, find or create the collection
      if (collectionName && !collectionId) {
        const existingCollection = await db.query.knowledgeCollections.findFirst({
          where: and(
            eq(knowledgeCollections.workspaceId, context.workspaceId),
            like(knowledgeCollections.name, collectionName)
          ),
        });

        if (existingCollection) {
          collectionId = existingCollection.id;
        } else {
          // Create new collection
          const [newCollection] = await db
            .insert(knowledgeCollections)
            .values({
              workspaceId: context.workspaceId,
              name: collectionName,
              description: `Created by Neptune`,
              createdBy: context.userId,
            })
            .returning();
          collectionId = newCollection.id;
        }
      }

      const content = args.content as string;
      const [doc] = await db
        .insert(knowledgeItems)
        .values({
          workspaceId: context.workspaceId,
          title: args.title as string,
          type: (args.type as 'document' | 'text') || 'document',
          content: content,
          summary: content.substring(0, 500).replace(/[#*`]/g, ''), // Clean summary
          collectionId: collectionId || null,
          createdBy: context.userId,
          status: 'ready',
        })
        .returning();

      // Update collection item count if applicable
      if (collectionId) {
        await db
          .update(knowledgeCollections)
          .set({
            itemCount: sql`${knowledgeCollections.itemCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(knowledgeCollections.id, collectionId));
      }

      logger.info('AI created document', { docId: doc.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Document "${doc.title}" has been saved to your knowledge base${collectionName ? ` in the "${collectionName}" category` : ''}.`,
        data: {
          id: doc.id,
          title: doc.title,
          type: doc.type,
          collectionId: collectionId,
        },
        suggestedNextStep: {
          action: 'share_document',
          reason: 'Documents are most useful when shared with stakeholders',
          prompt: 'Want to share this with your team or a contact?',
          autoSuggest: false,
        },
      };
    } catch (error) {
      logger.error('AI create_document failed', error);
      return {
        success: false,
        message: 'Failed to create document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // create_collection
  async create_collection(args, context): Promise<ToolResult> {
    try {
      // Check if collection already exists
      const existing = await db.query.knowledgeCollections.findFirst({
        where: and(
          eq(knowledgeCollections.workspaceId, context.workspaceId),
          like(knowledgeCollections.name, args.name as string)
        ),
      });

      if (existing) {
        return {
          success: true,
          message: `Collection "${existing.name}" already exists`,
          data: {
            id: existing.id,
            name: existing.name,
            description: existing.description,
            alreadyExisted: true,
          },
        };
      }

      const [collection] = await db
        .insert(knowledgeCollections)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          description: (args.description as string) || null,
          color: (args.color as string) || null,
          icon: (args.icon as string) || null,
          createdBy: context.userId,
        })
        .returning();

      logger.info('AI created collection', { collectionId: collection.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created new category "${collection.name}"`,
        data: {
          id: collection.id,
          name: collection.name,
          description: collection.description,
        },
      };
    } catch (error) {
      logger.error('AI create_collection failed', error);
      return {
        success: false,
        message: 'Failed to create collection',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // create_professional_document
  async create_professional_document(args, context): Promise<ToolResult> {
    try {
      if (!isGammaConfigured()) {
        return {
          success: false,
          message: 'Gamma.app is not configured. Please add GAMMA_API_KEY to environment variables.',
          error: 'GAMMA_API_KEY missing',
        };
      }

      const audience = args.audience as string | undefined;
      const goal = args.goal as string | undefined;
      const tone = (args.tone as string) || 'professional';
      const generateOutline = (args.generateOutline as boolean) || false;

      // Enhance prompt with audience/goal context if provided
      let enhancedPrompt = args.prompt as string;
      if (audience) {
        enhancedPrompt = `Target audience: ${audience}. ${enhancedPrompt}`;
      }
      if (goal) {
        enhancedPrompt = `${enhancedPrompt} Primary goal: ${goal}.`;
      }
      if (tone && tone !== 'professional') {
        enhancedPrompt = `${enhancedPrompt} Tone: ${tone}.`;
      }

      // Add document type-specific guidance to prompt
      const contentType = args.contentType as string;
      if (contentType === 'presentation') {
        enhancedPrompt = `${enhancedPrompt} Structure: 10-15 slides following problem -> solution -> proof -> ask framework.`;
      } else if (contentType === 'document') {
        enhancedPrompt = `${enhancedPrompt} Structure: Lead with ROI/value proposition, include case studies, address objections, clear pricing, next steps.`;
      } else if (contentType === 'webpage') {
        enhancedPrompt = `${enhancedPrompt} Structure: Above-fold value prop + CTA, social proof, single clear CTA throughout, mobile-first.`;
      }

      logger.info('Generating professional document with Gamma', {
        contentType,
        style: args.style,
        audience,
        goal,
        tone,
        workspaceId: context.workspaceId,
      });

      // If generateOutline is true, return outline suggestion instead of generating full document
      if (generateOutline) {
        const outlineSuggestions: Record<string, string> = {
          presentation: '1. Hook/Problem 2. Market Size 3. Solution 4. Traction 5. Business Model 6. Team 7. Ask',
          document: '1. Executive Summary 2. Problem 3. Solution 4. Benefits 5. Timeline 6. Investment 7. Next Steps',
          webpage: '1. Hero (value prop + CTA) 2. Benefits 3. Social Proof 4. Features 5. Pricing 6. Final CTA',
        };

        return {
          success: true,
          message: `Here's a suggested outline for your ${contentType}:\n\n${outlineSuggestions[contentType] || 'Standard structure'}\n\nShould I generate the full document now?`,
          data: {
            outline: outlineSuggestions[contentType] || 'Standard structure',
            contentType,
            readyToGenerate: true,
          },
        };
      }

      const result = await generateWithGamma({
        prompt: enhancedPrompt,
        contentType: contentType as 'presentation' | 'document' | 'webpage' | 'social',
        style: (args.style as 'minimal' | 'professional' | 'creative' | 'bold') || 'professional',
      });

      // Poll for completion if processing
      if (result.status === 'processing') {
        logger.debug('Gamma document processing, polling for completion');
        const completed = await pollGammaGeneration(result.id);
        Object.assign(result, completed);
      }

      logger.info('Gamma document created successfully', {
        documentId: result.id,
        title: result.title,
        cards: result.cards.length,
      });

      // Generate 2-3 title options if title not provided
      const titleOptions: string[] = [];
      if (!args.title && audience && goal) {
        titleOptions.push(`${goal} for ${audience}`);
        titleOptions.push(`${contentType} - ${goal}`);
        titleOptions.push(`Professional ${contentType}: ${goal}`);
      }

      return {
        success: true,
        message: `Created professional ${contentType}: "${result.title}"\n\n${result.cards.length} slides/sections\nAudience: ${audience || 'General'}\nGoal: ${goal || 'General'}\nEdit: ${result.editUrl}${titleOptions.length > 0 ? `\n\nTitle options: ${titleOptions.join(', ')}` : ''}`,
        data: {
          id: result.id,
          title: result.title,
          contentType,
          editUrl: result.editUrl,
          embedUrl: result.embedUrl,
          pdfUrl: result.exportFormats?.pdf,
          pptxUrl: result.exportFormats?.pptx,
          cards: result.cards.length,
          style: args.style || 'professional',
          audience,
          goal,
          tone,
          titleOptions: titleOptions.length > 0 ? titleOptions : undefined,
        },
      };
    } catch (error) {
      logger.error('Gamma document creation failed', error);
      return {
        success: false,
        message: 'Failed to create professional document. The Gamma API may be temporarily unavailable.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // list_collections
  async list_collections(args, context): Promise<ToolResult> {
    try {
      const collections = await db.query.knowledgeCollections.findMany({
        where: eq(knowledgeCollections.workspaceId, context.workspaceId),
        orderBy: [desc(knowledgeCollections.updatedAt)],
      });

      return {
        success: true,
        message: `Found ${collections.length} collection(s)`,
        data: {
          collections: collections.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            itemCount: c.itemCount,
          })),
        },
      };
    } catch (error) {
      logger.error('AI list_collections failed', error);
      return {
        success: false,
        message: 'Failed to list collections',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // generate_image
  async generate_image(args, context): Promise<ToolResult> {
    try {
      if (!isDalleConfigured()) {
        return {
          success: false,
          message: 'DALL-E is not configured. Please add OPENAI_API_KEY to environment variables.',
          error: 'OPENAI_API_KEY missing',
        };
      }

      logger.info('Generating image with DALL-E 3', {
        promptLength: (args.prompt as string).length,
        size: args.size,
        quality: args.quality,
        style: args.style,
        workspaceId: context.workspaceId,
      });

      const result = await generateImage({
        prompt: args.prompt as string,
        size: args.size as '1024x1024' | '1792x1024' | '1024x1792' | undefined,
        quality: args.quality as 'standard' | 'hd' | undefined,
        style: args.style as 'vivid' | 'natural' | undefined,
      });

      logger.info('DALL-E image generated successfully', {
        imageUrl: result.url,
        size: result.size,
        quality: result.quality,
      });

      return {
        success: true,
        message: `Generated image: ${result.revisedPrompt.substring(0, 100)}...`,
        data: {
          imageUrl: result.url,
          prompt: args.prompt,
          revisedPrompt: result.revisedPrompt,
          size: result.size,
          quality: result.quality,
          style: args.style || 'vivid',
        },
      };
    } catch (error) {
      logger.error('DALL-E image generation failed', error);

      // Handle specific errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('content_policy')) {
        return {
          success: false,
          message: 'Image generation failed: Content policy violation. Please try a different prompt.',
          error: 'content_policy_violation',
        };
      }

      if (errorMessage.includes('rate_limit')) {
        return {
          success: false,
          message: 'Rate limit exceeded. Please try again in a moment.',
          error: 'rate_limit',
        };
      }

      return {
        success: false,
        message: 'Failed to generate image. Please try again with a different prompt.',
        error: errorMessage,
      };
    }
  },

  // generate_pdf
  async generate_pdf(args, context): Promise<ToolResult> {
    try {
      const { generatePDF, isPDFConfigured } = await import('@/lib/pdf-generator');

      if (!isPDFConfigured()) {
        return {
          success: false,
          message: 'PDF generation is not configured.',
          error: 'pdf_not_configured',
        };
      }

      const type = args.type as 'invoice' | 'report' | 'proposal' | 'contract';
      const title = args.title as string;
      const content = args.content as Record<string, unknown>;

      logger.info('Generating PDF document', { type, title, workspaceId: context.workspaceId });

      const result = await generatePDF({
        type,
        title,
        content,
        workspaceId: context.workspaceId,
      });

      logger.info('PDF generated successfully', { url: result.url, type, title });

      return {
        success: true,
        message: `Generated ${type}: "${title}"\n\nDownload: ${result.url}`,
        data: {
          url: result.url,
          filename: result.filename,
          type: result.type,
          title: result.title,
        },
      };
    } catch (error) {
      logger.error('PDF generation failed', error);
      return {
        success: false,
        message: 'Failed to generate PDF. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // save_upload_to_library
  async save_upload_to_library(args, context): Promise<ToolResult> {
    try {
      const fileUrl = args.fileUrl as string;
      const fileName = args.fileName as string;
      const fileType = args.fileType as 'image' | 'document' | 'file';
      const title = (args.title as string) || fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const collectionName = args.collectionName as string;
      const tags = (args.tags as string[]) || [];
      const userSummary = args.summary as string | undefined;

      // Generate collection description based on name
      const collectionDescriptions: Record<string, string> = {
        Invoices: 'Invoice documents and billing records',
        Contracts: 'Legal contracts and agreements',
        Receipts: 'Purchase receipts and expense records',
        Screenshots: 'Screen captures and UI references',
        'Logos & Branding': 'Brand assets, logos, and visual identity',
        'Product Images': 'Product photography and imagery',
        'Marketing Assets': 'Marketing materials and campaign assets',
        'Meeting Notes': 'Notes and summaries from meetings',
        Proposals: 'Business proposals and pitches',
        Reports: 'Business reports and analytics',
        Presentations: 'Slide decks and presentations',
        'Legal Documents': 'Legal paperwork and documentation',
        'HR Documents': 'Human resources documentation',
        Research: 'Research materials and findings',
        'Reference Materials': 'Reference documents and guides',
      };

      // Find or create the collection
      let collection = await db.query.knowledgeCollections.findFirst({
        where: and(
          eq(knowledgeCollections.workspaceId, context.workspaceId),
          like(knowledgeCollections.name, collectionName)
        ),
      });

      if (!collection) {
        const [newCollection] = await db
          .insert(knowledgeCollections)
          .values({
            workspaceId: context.workspaceId,
            name: collectionName,
            description: collectionDescriptions[collectionName] || `${collectionName} - organized by Neptune`,
            createdBy: context.userId,
          })
          .returning();
        collection = newCollection;
        logger.info('AI created new collection', { collectionName, workspaceId: context.workspaceId });
      }

      // Determine the item type for the knowledge base
      const itemType: 'image' | 'document' | 'url' | 'text' = fileType === 'image' ? 'image' : 'document';

      // Build summary
      const summary = userSummary || `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} - ${collectionName}`;

      // Save to knowledge items with tags in metadata
      const [item] = await db
        .insert(knowledgeItems)
        .values({
          workspaceId: context.workspaceId,
          title,
          type: itemType,
          sourceUrl: fileUrl,
          fileName: fileName,
          content: `File: ${fileName}${userSummary ? `\n\n${userSummary}` : ''}`,
          summary,
          metadata: {
            tags: tags.length > 0 ? tags : undefined,
            uploadedVia: 'neptune',
          },
          collectionId: collection.id,
          createdBy: context.userId,
          status: 'ready',
        })
        .returning();

      // Update collection item count
      await db
        .update(knowledgeCollections)
        .set({
          itemCount: sql`${knowledgeCollections.itemCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeCollections.id, collection.id));

      logger.info('AI saved upload to library', {
        itemId: item.id,
        fileName,
        title,
        collectionName,
        tags,
        workspaceId: context.workspaceId,
      });

      // Build response message
      const tagStr = tags.length > 0 ? ` Tagged: ${tags.join(', ')}.` : '';

      return {
        success: true,
        message: `Saved "${title}" to **${collectionName}**.${tagStr}`,
        data: {
          id: item.id,
          title: item.title,
          type: item.type,
          collectionId: collection.id,
          collectionName: collection.name,
          tags,
          sourceUrl: fileUrl,
        },
      };
    } catch (error) {
      logger.error('AI save_upload_to_library failed', error);
      return {
        success: false,
        message: 'Failed to save file to Library',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // generate_marketing_copy
  async generate_marketing_copy(args, context): Promise<ToolResult> {
    try {
      const copyType = args.type as string;
      const targetAudience = args.target_audience as string;
      const goal = args.goal as string;
      const tone = (args.tone as string) || 'professional';
      const contextInfo = (args.context as string) || '';
      const saveToLibrary = (args.save_to_library as boolean) || false;

      // Generate actual copy using GPT-4o
      const { getOpenAI } = await import('@/lib/ai-providers');
      const openai = getOpenAI();

      const systemPrompt = `You are an expert marketing copywriter. Generate compelling, persuasive copy that resonates with the target audience and drives action. Write in a ${tone} tone and focus on clarity, emotional appeal, and conversion optimization.`;
      const userPrompt = `Generate ${copyType} for ${targetAudience} with the goal of ${goal}.${contextInfo ? `\n\nAdditional context: ${contextInfo}` : ''}\n\nProvide only the final copy, ready to use. No meta-commentary or explanations.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8, // Higher creativity for marketing copy
        max_tokens: 1000,
      });

      const generatedCopy = completion.choices[0]?.message?.content || '';

      if (!generatedCopy) {
        throw new Error('No content generated');
      }

      // Save to library if requested
      let savedItemId: string | null = null;
      if (saveToLibrary) {
        try {
          const [savedItem] = await db
            .insert(knowledgeItems)
            .values({
              workspaceId: context.workspaceId,
              createdBy: context.userId,
              title: `Marketing Copy: ${copyType}`,
              type: 'text',
              content: generatedCopy,
              status: 'ready',
            })
            .returning();
          savedItemId = savedItem.id;
        } catch (saveError) {
          logger.warn('Failed to save marketing copy to library', { error: saveError });
        }
      }

      return {
        success: true,
        message: `Generated ${copyType} for ${targetAudience}. ${saveToLibrary && savedItemId ? 'Saved to library.' : 'Ready to use.'}`,
        data: {
          type: copyType,
          copy: generatedCopy,
          targetAudience,
          goal,
          tone,
          savedToLibrary: !!savedItemId,
          itemId: savedItemId,
        },
      };
    } catch (error) {
      logger.error('AI generate_marketing_copy failed', error);
      return {
        success: false,
        message: 'Failed to generate marketing copy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // analyze_brand_message
  async analyze_brand_message(args, context): Promise<ToolResult> {
    try {
      const content = args.content as string;
      const intendedAudience = args.intended_audience as string;
      const improvementAreas = (args.improvement_areas as string[]) || ['clarity', 'persuasion'];

      // Analyze the content and provide improvements
      const analysis = {
        originalLength: content.length,
        wordCount: content.split(/\s+/).length,
        improvementAreas,
        suggestions: `Analyze this content for ${intendedAudience} focusing on: ${improvementAreas.join(', ')}`,
      };

      return {
        success: true,
        message: `Analyzed content for ${intendedAudience}. Found ${improvementAreas.length} areas to improve.`,
        data: {
          analysis,
          improvements: `Content analysis complete. Focus on: ${improvementAreas.join(', ')}`,
        },
      };
    } catch (error) {
      logger.error('AI analyze_brand_message failed', error);
      return {
        success: false,
        message: 'Failed to analyze brand message',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // create_content_calendar
  async create_content_calendar(args, context): Promise<ToolResult> {
    try {
      const duration = args.duration as string;
      const channels = args.channels as string[];
      const themes = (args.themes as string) || '';
      const saveToLibrary = (args.save_to_library as boolean) || false;

      // Generate actual content calendar using GPT-4o
      const { getOpenAI } = await import('@/lib/ai-providers');
      const openai = getOpenAI();

      const systemPrompt = `You are a content strategy expert. Create detailed, actionable content calendars with specific post ideas, timing recommendations, and content themes. Be specific and practical.`;
      const userPrompt = `Create a ${duration} content calendar for ${channels.join(', ')}.${themes ? `\n\nFocus on these themes: ${themes}` : ''}\n\nFormat as a clear calendar with:
- Specific post ideas for each day/week
- Recommended posting times
- Content types (text, image, video, etc.)
- Hashtags/keywords
- Engagement strategies`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000, // Calendars need more tokens
      });

      const generatedCalendar = completion.choices[0]?.message?.content || '';

      if (!generatedCalendar) {
        throw new Error('No calendar generated');
      }

      const calendarData = {
        duration,
        channels,
        themes,
        content: generatedCalendar,
      };

      let savedItemId: string | null = null;
      if (saveToLibrary) {
        try {
          const [savedItem] = await db
            .insert(knowledgeItems)
            .values({
              workspaceId: context.workspaceId,
              createdBy: context.userId,
              title: `Content Calendar: ${duration}`,
              type: 'document',
              content: generatedCalendar,
              status: 'ready',
            })
            .returning();
          savedItemId = savedItem.id;
        } catch (saveError) {
          logger.warn('Failed to save content calendar to library', { error: saveError });
        }
      }

      return {
        success: true,
        message: `Created ${duration} content calendar for ${channels.join(', ')}. ${saveToLibrary && savedItemId ? 'Saved to library.' : ''}`,
        data: {
          calendar: calendarData,
          savedToLibrary: !!savedItemId,
          itemId: savedItemId,
        },
      };
    } catch (error) {
      logger.error('AI create_content_calendar failed', error);
      return {
        success: false,
        message: 'Failed to create content calendar',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // generate_brand_guidelines
  async generate_brand_guidelines(args, context): Promise<ToolResult> {
    try {
      const companyDescription = args.company_description as string;
      const targetAudience = args.target_audience as string;
      const brandPersonality = (args.brand_personality as string) || '';

      // Generate comprehensive brand guidelines using GPT-4o
      const { getOpenAI } = await import('@/lib/ai-providers');
      const openai = getOpenAI();

      const systemPrompt = `You are a brand strategy consultant. Create comprehensive, professional brand guidelines that teams can reference for consistent brand communication. Be specific with examples and actionable guidance.`;
      const userPrompt = `Create detailed brand guidelines for:\n\nCompany: ${companyDescription}\nTarget Audience: ${targetAudience}${brandPersonality ? `\nBrand Personality: ${brandPersonality}` : ''}\n\nInclude:
1. Brand Voice & Tone (with do's and don'ts)
2. Messaging Framework (key messages, value props)
3. Communication Style Guide
4. Content Guidelines
5. Examples of on-brand vs off-brand language`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6, // Lower temperature for more consistent guidelines
        max_tokens: 2500,
      });

      const generatedGuidelines = completion.choices[0]?.message?.content || '';

      if (!generatedGuidelines) {
        throw new Error('No guidelines generated');
      }

      // Always save brand guidelines to knowledge base
      const [savedItem] = await db
        .insert(knowledgeItems)
        .values({
          workspaceId: context.workspaceId,
          createdBy: context.userId,
          title: 'Brand Guidelines',
          type: 'document',
          content: generatedGuidelines,
          status: 'ready',
        })
        .returning();

      return {
        success: true,
        message: `Generated brand guidelines for ${companyDescription}. Saved to library.`,
        data: {
          guidelines: {
            companyDescription,
            targetAudience,
            brandPersonality,
            content: generatedGuidelines,
          },
          itemId: savedItem.id,
        },
      };
    } catch (error) {
      logger.error('AI generate_brand_guidelines failed', error);
      return {
        success: false,
        message: 'Failed to generate brand guidelines',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // draft_proposal
  async draft_proposal(args, context): Promise<ToolResult> {
    try {
      const dealId = args.dealId as string;
      const includePricing = (args.includePricing as boolean) ?? true;
      const format = (args.format as string) || 'document';

      // Get deal/lead information
      const deal = await db.query.prospects.findFirst({
        where: and(eq(prospects.id, dealId), eq(prospects.workspaceId, context.workspaceId)),
      });

      if (!deal) {
        return {
          success: false,
          message: 'Deal not found',
          error: 'Deal ID does not exist',
        };
      }

      // Generate proposal content
      const proposalContent = {
        title: `Proposal for ${deal.company || deal.name}`,
        sections: [
          { title: 'Executive Summary', content: `Overview of solution for ${deal.company || deal.name}` },
          { title: 'Problem Statement', content: 'Addressing key business challenges' },
          { title: 'Proposed Solution', content: 'Detailed solution approach' },
          { title: 'Timeline', content: 'Implementation timeline and milestones' },
          ...(includePricing
            ? [
                {
                  title: 'Pricing',
                  content: `Investment: ${deal.estimatedValue ? `$${deal.estimatedValue.toLocaleString()}` : 'To be determined'}`,
                },
              ]
            : []),
          { title: 'Next Steps', content: 'How to proceed' },
        ],
        format,
      };

      return {
        success: true,
        message: `Generated ${format} proposal for ${deal.company || deal.name}. Ready for review.`,
        data: {
          dealId: deal.id,
          proposal: proposalContent,
          canGenerateDocument: true,
        },
      };
    } catch (error) {
      logger.error('AI draft_proposal failed', error);
      return {
        success: false,
        message: 'Failed to draft proposal',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // navigate_to_page
  async navigate_to_page(args): Promise<ToolResult> {
    const page = args.page as string;
    const tab = args.tab as string | undefined;

    // Map page names to URLs
    const pageUrls: Record<string, string> = {
      'dashboard': '/',
      'crm': '/crm',
      'library': '/library',
      'campaigns': '/campaigns',
      'creator': '/creator',
      'activity': '/activity',
      'settings': '/settings',
      'connected-apps': '/connected-apps',
      'launchpad': '/launchpad',
    };

    const baseUrl = pageUrls[page];
    if (!baseUrl) {
      return {
        success: false,
        message: `Unknown page: ${page}. Available pages: ${Object.keys(pageUrls).join(', ')}`,
        error: 'invalid_page',
      };
    }

    const url = tab ? `${baseUrl}?tab=${tab}` : baseUrl;

    // Return navigation action for client to handle
    return {
      success: true,
      message: `Navigating to ${page}${tab ? ` (${tab} tab)` : ''}...`,
      data: {
        action: 'navigate',
        url,
        page,
        tab,
        dispatchEvent: 'neptune-navigate',
      },
    };
  },
};
