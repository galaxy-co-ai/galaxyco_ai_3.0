/**
 * Content Tool Definitions
 *
 * Tool definitions for content generation, document creation, and media generation.
 */
import type { ToolDefinitions } from '../types';

export const contentToolDefinitions: ToolDefinitions = [
  // draft_email
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description: 'Generate a draft email for a specific purpose. Use this when the user wants help writing an email.',
      parameters: {
        type: 'object',
        properties: {
          purpose: {
            type: 'string',
            description: 'Purpose of the email (e.g., "follow up", "introduction", "proposal", "thank you")',
          },
          recipientName: {
            type: 'string',
            description: 'Name of the recipient',
          },
          recipientCompany: {
            type: 'string',
            description: 'Company of the recipient',
          },
          context: {
            type: 'string',
            description: 'Additional context about the situation or relationship',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'professional', 'friendly', 'casual'],
            description: 'Desired tone of the email',
          },
        },
        required: ['purpose'],
      },
    },
  },

  // generate_document
  {
    type: 'function',
    function: {
      name: 'generate_document',
      description: 'Generate a complete, high-quality document based on user requirements. Use this when the user wants to CREATE or WRITE a new document, article, SOP, proposal, FAQ, meeting notes, or any content. The AI will write the full content.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the document',
          },
          documentType: {
            type: 'string',
            enum: ['article', 'sop', 'proposal', 'meeting-notes', 'faq', 'guide', 'report', 'policy', 'template', 'general'],
            description: 'Type of document to generate - this determines the structure and tone',
          },
          topic: {
            type: 'string',
            description: 'Main topic or subject matter to write about',
          },
          requirements: {
            type: 'string',
            description: 'Specific requirements, context, key points to include, or instructions for the document',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'technical', 'friendly', 'formal'],
            description: 'Writing tone/style (default: professional)',
          },
          length: {
            type: 'string',
            enum: ['brief', 'standard', 'comprehensive'],
            description: 'Desired document length (default: standard)',
          },
          collectionId: {
            type: 'string',
            description: 'Optional collection/category ID to organize the document',
          },
          collectionName: {
            type: 'string',
            description: 'Name of collection to put document in (will create if needed)',
          },
        },
        required: ['title', 'documentType', 'topic'],
      },
    },
  },

  // create_document
  {
    type: 'function',
    function: {
      name: 'create_document',
      description: 'Save a document to the knowledge base with provided content. Use this when you already have the content ready to save.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the document',
          },
          content: {
            type: 'string',
            description: 'The document content (supports markdown formatting)',
          },
          type: {
            type: 'string',
            enum: ['document', 'text'],
            description: 'Type of content',
          },
          collectionId: {
            type: 'string',
            description: 'Optional collection/folder ID to organize the document',
          },
          collectionName: {
            type: 'string',
            description: 'Name of collection to put document in (will create if needed)',
          },
        },
        required: ['title', 'content'],
      },
    },
  },

  // create_collection
  {
    type: 'function',
    function: {
      name: 'create_collection',
      description: 'Create a new collection/category in the knowledge base to organize documents.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the collection',
          },
          description: {
            type: 'string',
            description: 'Description of what this collection contains',
          },
          color: {
            type: 'string',
            description: 'Color for the collection (e.g., blue, green, purple)',
          },
          icon: {
            type: 'string',
            description: 'Emoji icon for the collection',
          },
        },
        required: ['name'],
      },
    },
  },

  // create_professional_document
  {
    type: 'function',
    function: {
      name: 'create_professional_document',
      description: 'Generate a polished, professional presentation, document, or webpage using Gamma.app. Use this when user wants a HIGH-QUALITY, DESIGNED presentation/pitch deck/proposal/newsletter. Better than plain text documents. Creates beautifully designed content.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed description of what to create. Include topic, key points, audience, purpose, and any specific requirements.',
          },
          contentType: {
            type: 'string',
            enum: ['presentation', 'document', 'webpage', 'social'],
            description: 'Type of content: presentation (slides/pitch deck), document (report/proposal), webpage (landing page), social (social media post)',
          },
          style: {
            type: 'string',
            enum: ['minimal', 'professional', 'creative', 'bold'],
            description: 'Visual style/theme. Default: professional',
          },
          title: {
            type: 'string',
            description: 'Title for the document',
          },
        },
        required: ['prompt', 'contentType'],
      },
    },
  },

  // list_collections
  {
    type: 'function',
    function: {
      name: 'list_collections',
      description: 'List all collections/folders in the knowledge base.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // generate_image
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Generate an AI image using DALL-E 3. Use this when user asks to CREATE, DESIGN, or GENERATE any visual content like logos, graphics, illustrations, photos, artwork, social media images, marketing materials, icons, banners, or any other images. Produces high-quality, realistic images.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed description of the image to generate. Be VERY specific about style, colors, composition, mood, lighting, perspective, and subject details. More detail = better results.',
          },
          size: {
            type: 'string',
            enum: ['1024x1024', '1792x1024', '1024x1792'],
            description: 'Image dimensions: 1024x1024 (square), 1792x1024 (landscape/wide), 1024x1792 (portrait/tall)',
          },
          quality: {
            type: 'string',
            enum: ['standard', 'hd'],
            description: 'Image quality: standard (faster, cheaper) or hd (higher detail, more expensive)',
          },
          style: {
            type: 'string',
            enum: ['vivid', 'natural'],
            description: 'Visual style: vivid (dramatic, creative, hyper-real) or natural (realistic, photographic)',
          },
        },
        required: ['prompt'],
      },
    },
  },

  // generate_pdf
  {
    type: 'function',
    function: {
      name: 'generate_pdf',
      description: 'Generate a professional PDF document such as an invoice, report, proposal, or contract. The PDF will be styled beautifully and uploaded for download.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['invoice', 'report', 'proposal', 'contract'],
            description: 'Type of document to generate',
          },
          title: {
            type: 'string',
            description: 'Title of the document',
          },
          content: {
            type: 'object',
            description: 'Document content. Include relevant fields like companyName, recipientName, items (for invoices), sections (for reports), scope/deliverables (for proposals), or clauses (for contracts).',
            properties: {
              date: { type: 'string', description: 'Document date' },
              companyName: { type: 'string', description: 'Company/sender name' },
              companyAddress: { type: 'string', description: 'Company address' },
              recipientName: { type: 'string', description: 'Recipient name' },
              recipientCompany: { type: 'string', description: 'Recipient company' },
              recipientAddress: { type: 'string', description: 'Recipient address' },
              invoiceNumber: { type: 'string', description: 'Invoice number (for invoices)' },
              dueDate: { type: 'string', description: 'Due date (for invoices)' },
              items: {
                type: 'array',
                description: 'Line items (for invoices)',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    quantity: { type: 'number' },
                    unitPrice: { type: 'number' },
                    total: { type: 'number' },
                  },
                },
              },
              total: { type: 'number', description: 'Total amount' },
              sections: {
                type: 'array',
                description: 'Report sections',
                items: {
                  type: 'object',
                  properties: {
                    heading: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
              keyFindings: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key findings or bullet points',
              },
              scope: {
                type: 'array',
                items: { type: 'string' },
                description: 'Scope items (for proposals)',
              },
              deliverables: {
                type: 'array',
                items: { type: 'string' },
                description: 'Deliverables (for proposals)',
              },
              clauses: {
                type: 'array',
                description: 'Contract clauses',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        required: ['type', 'title', 'content'],
      },
    },
  },

  // save_upload_to_library
  {
    type: 'function',
    function: {
      name: 'save_upload_to_library',
      description: 'Save an uploaded file to the Library with smart organization. Analyze the file name and content to determine the best collection. Create new collections as needed. Use this when user confirms they want to save an uploaded file.',
      parameters: {
        type: 'object',
        properties: {
          fileUrl: {
            type: 'string',
            description: 'The URL of the uploaded file (from the attachment)',
          },
          fileName: {
            type: 'string',
            description: 'The original name of the file',
          },
          fileType: {
            type: 'string',
            enum: ['image', 'document', 'file'],
            description: 'Type of file (image, document, or file)',
          },
          title: {
            type: 'string',
            description: 'A clean, descriptive title for the item (not just the filename)',
          },
          collectionName: {
            type: 'string',
            description: 'The collection to organize into. Analyze the file and choose intelligently: "Invoices", "Contracts", "Receipts", "Screenshots", "Logos & Branding", "Product Images", "Marketing Assets", "Meeting Notes", "Proposals", "Reports", "Presentations", "Legal Documents", "HR Documents", "Research", "Reference Materials", or create a new relevant collection.',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Relevant tags for the file (e.g., ["Q4", "2025", "client-name", "draft"])',
          },
          summary: {
            type: 'string',
            description: 'A brief description of what this file contains or is used for',
          },
        },
        required: ['fileUrl', 'fileName', 'fileType', 'collectionName'],
      },
    },
  },

  // generate_marketing_copy
  {
    type: 'function',
    function: {
      name: 'generate_marketing_copy',
      description: 'Generate high-converting marketing copy for ads, emails, landing pages, social posts, or CTAs. Returns copy that can be used immediately or saved to knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['email_subject', 'ad_headline', 'landing_hero', 'social_post', 'cta_button', 'email_body'],
            description: 'Type of marketing copy to generate',
          },
          target_audience: {
            type: 'string',
            description: 'Description of the target audience (demographics, pain points, desires)',
          },
          goal: {
            type: 'string',
            enum: ['awareness', 'leads', 'sales', 'engagement'],
            description: 'Marketing goal for this copy',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'playful', 'urgent', 'inspirational'],
            description: 'Tone of voice for the copy',
          },
          context: {
            type: 'string',
            description: 'Additional context about the product, service, or campaign',
          },
          save_to_library: {
            type: 'boolean',
            description: 'Whether to save the generated copy to knowledge base (default: false)',
          },
        },
        required: ['type', 'target_audience', 'goal'],
      },
    },
  },

  // analyze_brand_message
  {
    type: 'function',
    function: {
      name: 'analyze_brand_message',
      description: 'Analyze existing copy/messaging and suggest improvements for clarity, persuasion, emotion, differentiation, or SEO.',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The copy or messaging to analyze',
          },
          intended_audience: {
            type: 'string',
            description: 'Who this message is targeting',
          },
          improvement_areas: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['clarity', 'persuasion', 'emotion', 'differentiation', 'SEO'],
            },
            description: 'Specific areas to focus improvements on',
          },
        },
        required: ['content', 'intended_audience'],
      },
    },
  },

  // create_content_calendar
  {
    type: 'function',
    function: {
      name: 'create_content_calendar',
      description: 'Generate a content calendar for social media or blog with themes, topics, and optimal posting times. Can save to knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          duration: {
            type: 'string',
            description: 'Duration of calendar (e.g., "1 week", "1 month", "3 months")',
          },
          channels: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['instagram', 'linkedin', 'twitter', 'facebook', 'blog', 'email'],
            },
            description: 'Channels to create content for',
          },
          themes: {
            type: 'string',
            description: 'Content themes or topics to focus on',
          },
          save_to_library: {
            type: 'boolean',
            description: 'Whether to save calendar to knowledge base (default: false)',
          },
        },
        required: ['duration', 'channels'],
      },
    },
  },

  // generate_brand_guidelines
  {
    type: 'function',
    function: {
      name: 'generate_brand_guidelines',
      description: 'Create comprehensive brand voice, tone, and messaging guidelines based on company description and target audience. Saves to knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          company_description: {
            type: 'string',
            description: 'Description of the company, products, and services',
          },
          target_audience: {
            type: 'string',
            description: 'Primary target audience description',
          },
          brand_personality: {
            type: 'string',
            description: 'Desired brand personality traits (e.g., "friendly, innovative, trustworthy")',
          },
        },
        required: ['company_description', 'target_audience'],
      },
    },
  },

  // draft_proposal
  {
    type: 'function',
    function: {
      name: 'draft_proposal',
      description: 'Generate a professional proposal document from deal data including pricing, timeline, deliverables, and terms.',
      parameters: {
        type: 'object',
        properties: {
          dealId: {
            type: 'string',
            description: 'ID of the deal to create proposal for',
          },
          includePricing: {
            type: 'boolean',
            description: 'Whether to include pricing tiers in proposal',
          },
          format: {
            type: 'string',
            enum: ['document', 'presentation'],
            description: 'Format of the proposal',
          },
        },
        required: ['dealId'],
      },
    },
  },
];
