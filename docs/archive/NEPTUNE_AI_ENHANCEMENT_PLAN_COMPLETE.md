# Neptune AI Enhancement - Implementation Plan

> **AI Agent: READ THIS FIRST** 🤖
> 
> You are about to implement a comprehensive backend enhancement to the Neptune AI assistant. This document contains the complete implementation plan with all technical specifications.
> 
> **BEFORE YOU START:**
> 1. ✅ Read this ENTIRE document thoroughly
> 2. ✅ Review `README.md` to understand the current project state
> 3. ✅ Review `PROJECT_STATUS.md` to understand what's already built
> 4. ✅ Reference this document for 100% accuracy during implementation
> 
> **AS YOU BUILD:**
> - After completing each Phase, update `README.md` and `PROJECT_STATUS.md` with what you added
> - After completing each Phase, commit to git with a descriptive commit message
> - Use this document as your source of truth for all technical details
> 
> **WHEN YOU'RE DONE:**
> - After completing 100% of this plan, rename this file to: `NEPTUNE_AI_ENHANCEMENT_PLAN_COMPLETE.md`
> - Make a final git commit with all changes
> - Update `PROJECT_STATUS.md` with a summary of all new capabilities

---

## 📋 Project Overview

**Goal:** Add enterprise-grade AI capabilities to Neptune assistant without complicating the UI.

**Scope:** Backend-focused enhancements with minimal UI changes (inline displays only).

**New Capabilities:**
1. **File Upload** - Users can send documents, images, PDFs to Neptune for analysis
2. **GPT-4o Vision** - Neptune can analyze screenshots, extract data from images
3. **Gamma.app Integration** - Create professional presentations and documents
4. **DALL-E 3 Integration** - Generate logos, graphics, marketing visuals
5. **Document Processing** - Auto-extract text from PDFs and Word documents

**Environment Variables Required:**
- ✅ `OPENAI_API_KEY` - Already configured (for GPT-4o + DALL-E 3)
- ✅ `BLOB_READ_WRITE_TOKEN` - Already configured (for file storage)
- ✅ `GAMMA_API_KEY` - Already configured (for professional documents)

**No new environment variables needed!**

---

## 🎯 Success Criteria

After implementation, users should be able to:
1. Upload PDFs and ask "Summarize this contract"
2. Paste screenshots and ask "What's wrong here?"
3. Say "Create a logo for my coffee shop" and get an image
4. Upload Excel files and ask "What are the trends?"
5. Request "Design a pitch deck" and get a professional presentation
6. Say "Make a social media graphic" and get a designed image

**Zero UI complexity added** - just a paperclip button and inline displays.

---

## 📦 Dependencies to Install

```bash
npm install pdf-parse mammoth
```

**These are the ONLY new dependencies needed.**

Run this command before starting Phase 4.

---

## 🚀 Implementation Plan

### Phase 1: File Upload Infrastructure (4-6 hours)

#### Checkpoint: Users can upload files to Neptune

#### 1.1 Create File Upload API Route
**File:** `src/app/api/assistant/upload/route.ts` (NEW)

Based on existing Team Chat upload at `src/app/api/team/upload/route.ts`, create Neptune-specific upload handler.

**Key Features:**
- Accept: images (JPG, PNG, GIF, WebP, SVG), documents (PDF, DOCX, XLSX, PPTX, TXT, CSV), archives (ZIP)
- Max size: 10MB per file
- Upload to Vercel Blob storage (already configured)
- Return file URL + metadata
- Associate with conversation ID for context

**Reference Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
  ],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/gzip'],
};

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allAllowedTypes = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents, ...ALLOWED_TYPES.archives];
    if (!allAllowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`neptune/${workspaceId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    logger.info('File uploaded for Neptune', {
      workspaceId,
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    // Determine attachment type
    let attachmentType: 'image' | 'document' | 'file' = 'file';
    if (ALLOWED_TYPES.images.includes(file.type)) {
      attachmentType = 'image';
    } else if (ALLOWED_TYPES.documents.includes(file.type)) {
      attachmentType = 'document';
    }

    return NextResponse.json({
      attachment: {
        type: attachmentType,
        url: blob.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    logger.error('Neptune file upload error', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
```

**Test:** After implementation, test uploading a PDF via API.

---

#### 1.2 Add File Attachments to AI Messages Schema
**File:** `src/db/schema.ts`

Extend `aiMessages` table to support attachments.

**Find the `aiMessages` table definition** (search for `export const aiMessages = pgTable`) and add:

```typescript
attachments: jsonb('attachments').$type<Array<{
  type: 'image' | 'document' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}>>(),
```

**After modifying schema, run migration:**
```bash
npx drizzle-kit push
```

**Test:** Verify schema migration succeeds without errors.

---

#### 1.3 Update Neptune Chat Components (3 files)

Add file upload UI to all Neptune panels.

**Files to modify:**
1. `src/components/conversations/NeptuneAssistPanel.tsx` (lines 190-216: input area)
2. `src/components/creator/CreatorNeptunePanel.tsx` (lines 272-302: input area)
3. `src/app/(app)/assistant/page.tsx` (lines 750-777: input area)

**For each file, add:**

**1. State management (add at top with other useState):**
```typescript
const [pendingAttachments, setPendingAttachments] = useState<Array<{
  type: 'image' | 'document' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}>>([]);
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**2. Hidden file input (add before message input area):**
```typescript
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip,.rar,.gz"
  onChange={handleFileSelect}
  className="hidden"
  aria-label="Upload file"
/>
```

**3. File selection handler:**
```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  setIsUploading(true);

  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/assistant/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setPendingAttachments(prev => [...prev, data.attachment]);
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    }
  }

  setIsUploading(false);
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

**4. Paste image support (add to input's onPaste):**
```typescript
const handlePaste = async (e: React.ClipboardEvent) => {
  const items = Array.from(e.clipboardData.items);
  const imageItem = items.find(item => item.type.startsWith('image/'));

  if (imageItem) {
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/assistant/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setPendingAttachments(prev => [...prev, data.attachment]);
      toast.success("Image pasted");
    } catch (error) {
      toast.error("Failed to upload pasted image");
    } finally {
      setIsUploading(false);
    }
  }
};
```

**5. Attachment display (add above input field):**
```typescript
{pendingAttachments.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-2">
    {pendingAttachments.map((att, i) => (
      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
        {att.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        <span className="truncate max-w-[150px]">{att.name}</span>
        <button
          onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
          className="ml-1 hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    ))}
  </div>
)}
```

**6. Paperclip button (add before send button):**
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => fileInputRef.current?.click()}
  disabled={isUploading}
  className="h-9 w-9"
  aria-label="Attach file"
>
  {isUploading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Paperclip className="h-4 w-4" />
  )}
</Button>
```

**7. Update handleSend to include attachments:**
```typescript
// In handleSend, when calling API, add:
body: JSON.stringify({
  message: input.trim(),
  conversationId: currentConversationId,
  attachments: pendingAttachments,
  context: { ... },
}),

// After successful send, clear attachments:
setPendingAttachments([]);
```

**Import additions needed:**
```typescript
import { Paperclip, X, ImageIcon, FileText, Loader2 } from "lucide-react";
```

**Test:** After implementation, verify you can click paperclip, select file, see it listed, and remove it.

---

#### Phase 1 Deliverables:
- ✅ File upload API working
- ✅ Database schema supports attachments
- ✅ All 3 Neptune panels have file upload UI
- ✅ Users can paste images into chat

**Git Commit:**
```bash
git add .
git commit -m "feat(neptune): add file upload infrastructure with Vercel Blob storage

- Create /api/assistant/upload route for file handling
- Add attachments column to aiMessages table
- Implement file upload UI in all Neptune panels (3 components)
- Support images, documents, and archives (max 10MB)
- Enable paste image support via clipboard
- Store files in Vercel Blob with workspace organization"

git push origin main
```

**Update Documentation:**
- Add to `PROJECT_STATUS.md` under "Recent Changes" section
- Update `README.md` features list to mention Neptune file upload capability

---

### Phase 2: GPT-4o Vision Upgrade (2-3 hours)

#### Checkpoint: Neptune can analyze images and screenshots

#### 2.1 Upgrade AI Model in Chat Route
**File:** `src/app/api/assistant/chat/route.ts`

**Find and replace (2 locations):**
- Line ~255: `model: 'gpt-4-turbo-preview',`
- Line ~303: `model: 'gpt-4-turbo-preview',`

**Change to:**
```typescript
model: 'gpt-4o',
```

**Benefits:**
- Native vision support (no separate API needed)
- 2x faster response time
- 50% cost reduction
- Better reasoning capabilities

**Test:** After change, verify Neptune still responds to text messages.

---

#### 2.2 Add Image URL Support to Message Format
**File:** `src/app/api/assistant/chat/route.ts` (around lines 218-227)

**Find the message building section** (where messages array is constructed).

**Modify to support vision:**
```typescript
// Build messages array for OpenAI
const messages: ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: systemPrompt,
  },
  ...history.slice(-15).map((msg) => {
    // Check if message has image attachments
    const attachments = msg.attachments as Array<{type: string; url: string}> | undefined;
    const imageAttachments = attachments?.filter(att => att.type === 'image') || [];
    
    if (imageAttachments.length > 0 && msg.role === 'user') {
      // Format with vision support
      return {
        role: msg.role as 'user' | 'assistant',
        content: [
          { type: 'text' as const, text: msg.content },
          ...imageAttachments.map(img => ({
            type: 'image_url' as const,
            image_url: { url: img.url },
          })),
        ],
      };
    }
    
    // Regular text message
    return {
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    };
  }),
];
```

**Test:** Upload an image and ask "What's in this image?" - Neptune should describe it.

---

#### 2.3 Update System Prompt for Vision Capabilities
**File:** `src/lib/ai/system-prompt.ts`

**Find the system prompt generation function** and add vision instruction:

```typescript
// Add to system prompt when images are present:
When the user shares an image, analyze it thoroughly. You can:
- Describe what you see in detail
- Extract text from screenshots or documents
- Identify objects, people, or scenes
- Analyze charts, graphs, or data visualizations
- Provide feedback on design or composition
- Answer questions about the image content

Be specific and helpful in your image analysis.
```

**Test:** Upload a screenshot with an error message and ask Neptune to help debug it.

---

#### Phase 2 Deliverables:
- ✅ GPT-4o model upgrade complete
- ✅ Vision API message format working
- ✅ Neptune can analyze images
- ✅ System prompt includes vision instructions

**Git Commit:**
```bash
git add .
git commit -m "feat(neptune): upgrade to GPT-4o with vision capabilities

- Upgrade from gpt-4-turbo-preview to gpt-4o model
- Add image URL support in message format for vision API
- Update system prompt with vision analysis instructions
- Enable screenshot analysis and text extraction from images
- 2x faster response time, 50% cost reduction"

git push origin main
```

**Update Documentation:**
- Add to `PROJECT_STATUS.md` under "Recent Changes"
- Update `README.md` to mention vision capabilities

---

### Phase 3: Gamma.app Professional Documents (2-3 hours)

#### Checkpoint: Neptune can create professional presentations and documents

#### 3.1 Add Gamma Document Generation Tool
**File:** `src/lib/ai/tools.ts`

**Find the `aiTools` array** (around line 53) and add this tool after the document tools (around line 550):

```typescript
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
```

---

#### 3.2 Implement Gamma Tool Handler
**File:** `src/lib/ai/tools.ts`

**Add import at top of file:**
```typescript
import { generateWithGamma, pollGammaGeneration, isGammaConfigured } from '@/lib/gamma';
```

**Find the `toolImplementations` object** (around line 1900) and add:

```typescript
async create_professional_document(args, context): Promise<ToolResult> {
  try {
    if (!isGammaConfigured()) {
      return {
        success: false,
        message: 'Gamma.app is not configured. Please add GAMMA_API_KEY to environment variables.',
        error: 'GAMMA_API_KEY missing',
      };
    }

    logger.info('Generating professional document with Gamma', {
      contentType: args.contentType,
      style: args.style,
      workspaceId: context.workspaceId,
    });

    const result = await generateWithGamma({
      prompt: args.prompt as string,
      contentType: args.contentType as 'presentation' | 'document' | 'webpage' | 'social',
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

    return {
      success: true,
      message: `✨ Created professional ${args.contentType}: "${result.title}"\n\n📝 ${result.cards.length} slides/sections\n🔗 Edit: ${result.editUrl}`,
      data: {
        id: result.id,
        title: result.title,
        contentType: args.contentType,
        editUrl: result.editUrl,
        embedUrl: result.embedUrl,
        pdfUrl: result.exportFormats?.pdf,
        pptxUrl: result.exportFormats?.pptx,
        cards: result.cards.length,
        style: args.style || 'professional',
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
```

**Find the tool capability mapping** (around line 3178) and add Gamma to relevant categories:

```typescript
// Add to content/knowledge capabilities:
content: [...existingTools, 'create_professional_document'],
knowledge: [...existingTools, 'create_professional_document'],
```

---

#### 3.3 Display Gamma Documents Inline in Chat

**Files to modify (3 files):**
1. `src/components/conversations/NeptuneAssistPanel.tsx` (message rendering area ~lines 154-186)
2. `src/components/creator/CreatorNeptunePanel.tsx` (message rendering area ~lines 210-249)
3. `src/app/(app)/assistant/page.tsx` (message rendering area ~lines 694-730)

**For each file, add import:**
```typescript
import { Presentation, ExternalLink, Download } from "lucide-react";
```

**Add this code after the message content display (inside the message rendering loop):**

```typescript
{/* Gamma Document Display */}
{message.metadata?.functionCalls?.some(fc => fc.name === 'create_professional_document') && (() => {
  const gammaCall = message.metadata.functionCalls.find(fc => fc.name === 'create_professional_document');
  const gammaData = gammaCall?.result?.data;
  
  if (!gammaData) return null;
  
  return (
    <div className="mt-3 p-4 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-purple-100">
          <Presentation className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-purple-900 truncate">
              {gammaData.title}
            </h4>
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
              Gamma.app
            </Badge>
          </div>
          <p className="text-xs text-purple-600">
            {gammaData.contentType.charAt(0).toUpperCase() + gammaData.contentType.slice(1)} • {gammaData.cards} slides • {gammaData.style} style
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="text-xs h-8" asChild>
          <a href={gammaData.editUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Edit in Gamma
          </a>
        </Button>
        
        {gammaData.pdfUrl && (
          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
            <a href={gammaData.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-3 w-3 mr-1.5" />
              Download PDF
            </a>
          </Button>
        )}
        
        {gammaData.pptxUrl && (
          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
            <a href={gammaData.pptxUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-3 w-3 mr-1.5" />
              Download PPTX
            </a>
          </Button>
        )}
      </div>
    </div>
  );
})()}
```

**Test:** Ask Neptune "Create a pitch deck for a SaaS startup" - should see Gamma document inline with edit/download buttons.

---

#### Phase 3 Deliverables:
- ✅ Gamma document generation tool added
- ✅ Tool handler implemented and tested
- ✅ Inline Gamma document preview in all Neptune panels
- ✅ Edit and download links working

**Git Commit:**
```bash
git add .
git commit -m "feat(neptune): integrate Gamma.app for professional document creation

- Add create_professional_document AI tool for Gamma integration
- Support presentations, documents, webpages, and social content
- Implement tool handler with polling for completion
- Display Gamma documents inline with edit and download links
- Enable professional pitch decks, proposals, and reports via Neptune"

git push origin main
```

**Update Documentation:**
- Add to `PROJECT_STATUS.md` under "Recent Changes"
- Update `README.md` to mention Gamma document creation

---

### Phase 4: DALL-E 3 Image Generation (6-8 hours)

#### Checkpoint: Neptune can create logos, graphics, and marketing visuals

#### 4.1 Create DALL-E Client Library
**File:** `src/lib/dalle.ts` (NEW)

```typescript
/**
 * DALL-E 3 Image Generation Client
 * 
 * Generates images using OpenAI's DALL-E 3 and stores them in Vercel Blob
 */

import { getOpenAI } from '@/lib/ai-providers';
import { put } from '@vercel/blob';
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

    // Download image and upload to Vercel Blob for persistence
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    const timestamp = Date.now();
    const filename = `dalle/${timestamp}.png`;
    
    const blobResult = await put(filename, imageBlob, {
      access: 'public',
      addRandomSuffix: false,
    });

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
```

---

#### 4.2 Add Image Generation Tool to AI Tools
**File:** `src/lib/ai/tools.ts`

**Add import at top:**
```typescript
import { generateImage, isDalleConfigured } from '@/lib/dalle';
```

**Add to `aiTools` array (after Gamma tool, around line 600):**

```typescript
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
```

---

#### 4.3 Implement Tool Execution Handler
**File:** `src/lib/ai/tools.ts`

**Add to `toolImplementations` object (around line 2050):**

```typescript
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
      message: `🎨 Generated image: ${result.revisedPrompt.substring(0, 100)}...`,
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
```

**Update tool capability mapping (around line 3178):**
```typescript
// Add to content capabilities:
content: [...existingTools, 'create_professional_document', 'generate_image'],
```

---

#### 4.4 Display Generated Images Inline in Chat

**Files to modify (3 files):**
1. `src/components/conversations/NeptuneAssistPanel.tsx`
2. `src/components/creator/CreatorNeptunePanel.tsx`
3. `src/app/(app)/assistant/page.tsx`

**For each file, add import:**
```typescript
import { ImageIcon, Download, Eye } from "lucide-react";
```

**Add this code in the message rendering area (after Gamma document display):**

```typescript
{/* DALL-E Generated Image Display */}
{message.metadata?.functionCalls?.some(fc => fc.name === 'generate_image') && (() => {
  const imageCall = message.metadata.functionCalls.find(fc => fc.name === 'generate_image');
  const imageData = imageCall?.result?.data;
  
  if (!imageData?.imageUrl) return null;
  
  return (
    <div className="mt-3 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* Image Preview */}
      <div className="relative group">
        <img 
          src={imageData.imageUrl}
          alt={imageData.revisedPrompt || "Generated image"}
          className="w-full h-auto max-h-96 object-contain bg-white"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>
      
      {/* Image Info & Actions */}
      <div className="p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <ImageIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                DALL-E 3
              </Badge>
              <span className="text-xs text-blue-600">
                {imageData.size} • {imageData.quality || 'standard'} • {imageData.style || 'vivid'}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              {imageData.revisedPrompt}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
            <a href={imageData.imageUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-3 w-3 mr-1.5" />
              View Full Size
            </a>
          </Button>
          
          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
            <a href={imageData.imageUrl} download={`dalle-${Date.now()}.png`}>
              <Download className="h-3 w-3 mr-1.5" />
              Download
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
})()}
```

**Test:** Ask Neptune "Create a modern logo for a coffee shop" - should see generated image inline with download option.

---

#### Phase 4 Deliverables:
- ✅ DALL-E client library created
- ✅ Image generation tool added and tested
- ✅ Inline image display working
- ✅ Download functionality implemented

**Git Commit:**
```bash
git add .
git commit -m "feat(neptune): add DALL-E 3 image generation capabilities

- Create dalle.ts library with OpenAI DALL-E 3 integration
- Store generated images in Vercel Blob for persistence
- Add generate_image AI tool with full parameter support
- Display generated images inline with preview and download
- Support square, landscape, and portrait orientations
- Enable logo, graphic, and marketing asset creation via Neptune"

git push origin main
```

**Update Documentation:**
- Add to `PROJECT_STATUS.md` under "Recent Changes"
- Update `README.md` to mention image generation

---

### Phase 5: Enhanced Document Processing (3-4 hours)

#### Checkpoint: Neptune can extract and analyze text from PDFs and Word documents

#### 5.1 Install Document Processing Dependencies

```bash
npm install pdf-parse mammoth
```

**Verify installation:**
```bash
npm list pdf-parse mammoth
```

---

#### 5.2 Create Document Processing Library
**File:** `src/lib/document-processing.ts` (NEW)

```typescript
/**
 * Document Text Extraction Library
 * 
 * Extracts text from PDFs, Word documents, and other file formats
 */

import PDFParser from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '@/lib/logger';

export interface ProcessedDocument {
  text: string;
  fileName: string;
  pageCount?: number;
  wordCount: number;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(fileUrl: string, fileName: string): Promise<ProcessedDocument> {
  try {
    logger.debug('Extracting text from PDF', { fileUrl, fileName });

    // Fetch PDF file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await PDFParser(buffer);

    const text = data.text;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    logger.info('PDF text extracted', {
      fileName,
      pages: data.numpages,
      wordCount,
      textLength: text.length,
    });

    return {
      text,
      fileName,
      pageCount: data.numpages,
      wordCount,
    };
  } catch (error) {
    logger.error('PDF text extraction failed', { fileName, error });
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from Word document (.docx)
 */
export async function extractTextFromDocx(fileUrl: string, fileName: string): Promise<ProcessedDocument> {
  try {
    logger.debug('Extracting text from DOCX', { fileUrl, fileName });

    // Fetch DOCX file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text with mammoth
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    logger.info('DOCX text extracted', {
      fileName,
      wordCount,
      textLength: text.length,
    });

    return {
      text,
      fileName,
      wordCount,
    };
  } catch (error) {
    logger.error('DOCX text extraction failed', { fileName, error });
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromPlainFile(fileUrl: string, fileName: string): Promise<ProcessedDocument> {
  try {
    logger.debug('Extracting text from plain file', { fileUrl, fileName });

    const response = await fetch(fileUrl);
    const text = await response.text();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    logger.info('Plain text extracted', {
      fileName,
      wordCount,
      textLength: text.length,
    });

    return {
      text,
      fileName,
      wordCount,
    };
  } catch (error) {
    logger.error('Plain text extraction failed', { fileName, error });
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process document based on MIME type
 */
export async function processDocument(attachment: {
  url: string;
  name: string;
  mimeType: string;
}): Promise<ProcessedDocument> {
  const { url, name, mimeType } = attachment;

  try {
    // PDF
    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(url, name);
    }

    // Word Document
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return await extractTextFromDocx(url, name);
    }

    // Plain text files
    if (
      mimeType === 'text/plain' ||
      mimeType === 'text/csv' ||
      mimeType === 'text/markdown' ||
      mimeType === 'application/json'
    ) {
      return await extractTextFromPlainFile(url, name);
    }

    // Unsupported type
    logger.warn('Unsupported document type for text extraction', { mimeType, name });
    return {
      text: '',
      fileName: name,
      wordCount: 0,
    };
  } catch (error) {
    logger.error('Document processing failed', { name, mimeType, error });
    throw error;
  }
}

/**
 * Process multiple documents
 */
export async function processDocuments(attachments: Array<{
  url: string;
  name: string;
  mimeType: string;
  type: string;
}>): Promise<string> {
  const documentAttachments = attachments.filter(att => att.type === 'document');
  
  if (documentAttachments.length === 0) {
    return '';
  }

  logger.info('Processing multiple documents', { count: documentAttachments.length });

  const results = await Promise.all(
    documentAttachments.map(async (att) => {
      try {
        const processed = await processDocument(att);
        return `[Document: ${processed.fileName}]\n${processed.text}\n`;
      } catch (error) {
        logger.error('Failed to process document', { fileName: att.name, error });
        return `[Document: ${att.name}]\n[Error: Could not extract text from this file]\n`;
      }
    })
  );

  return results.join('\n---\n\n');
}
```

---

#### 5.3 Auto-Process Documents in Chat Route
**File:** `src/app/api/assistant/chat/route.ts`

**Add import at top:**
```typescript
import { processDocuments } from '@/lib/document-processing';
```

**Find where user message is saved** (around line 198-205) and modify:

```typescript
// Parse attachments from request
const attachments = body.attachments as Array<{
  type: 'image' | 'document' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}> | undefined;

// Process document attachments to extract text
let documentContext = '';
if (attachments && attachments.length > 0) {
  try {
    documentContext = await processDocuments(attachments);
    logger.debug('Document text extracted', {
      documentsProcessed: attachments.filter(a => a.type === 'document').length,
      textLength: documentContext.length,
    });
  } catch (error) {
    logger.error('Document processing error (non-blocking)', error);
  }
}

// Combine user message with document context
const fullMessage = documentContext 
  ? `${message}\n\n--- Attached Documents ---\n${documentContext}`
  : message;

// Save user message with attachments
const [userMessage] = await db
  .insert(aiMessages)
  .values({
    conversationId: conversation.id,
    role: 'user',
    content: fullMessage, // Use full message with document text
    attachments: attachments, // Store original attachments
  })
  .returning();
```

**This allows Neptune to automatically read and understand uploaded documents without user having to manually extract text.**

**Test:** Upload a PDF contract and ask "Summarize this document" - Neptune should read the PDF content.

---

#### Phase 5 Deliverables:
- ✅ pdf-parse and mammoth dependencies installed
- ✅ Document processing library created
- ✅ Auto-extraction working in chat route
- ✅ PDF, DOCX, and TXT processing tested

**Git Commit:**
```bash
git add .
git commit -m "feat(neptune): add automatic document text extraction

- Install pdf-parse and mammoth for document processing
- Create document-processing.ts library for PDF, DOCX, TXT extraction
- Auto-extract text from uploaded documents in chat route
- Include document content in AI context automatically
- Enable contract analysis, document summarization, and content review
- Support multi-document processing with error handling"

git push origin main
```

**Update Documentation:**
- Add to `PROJECT_STATUS.md` under "Recent Changes"
- Update `README.md` to mention document processing

---

### Phase 6: Testing & Final Documentation (2 hours)

#### Checkpoint: All features tested and documented

#### 6.1 Manual Testing Checklist

Test all new capabilities:

**File Upload:**
- [ ] Upload image (JPG/PNG) via paperclip button
- [ ] Paste image from clipboard (Ctrl+V)
- [ ] Upload PDF document
- [ ] Upload Word document (.docx)
- [ ] Upload text file (.txt)
- [ ] Remove attachment before sending
- [ ] Send message with multiple attachments

**Vision Analysis:**
- [ ] Upload screenshot and ask "What's in this image?"
- [ ] Upload chart/graph and ask for analysis
- [ ] Upload error message screenshot and ask for help
- [ ] Paste image and ask Neptune to describe it

**Gamma Documents:**
- [ ] "Create a pitch deck for a SaaS startup"
- [ ] "Make a proposal for Q4 marketing budget"
- [ ] "Design a landing page for my product"
- [ ] Click "Edit in Gamma" button (opens in new tab)
- [ ] Click "Download PDF" button (downloads file)

**DALL-E Images:**
- [ ] "Create a logo for a coffee shop"
- [ ] "Design a social media post graphic"
- [ ] "Generate a product mockup illustration"
- [ ] Click "View Full Size" button
- [ ] Click "Download" button
- [ ] Test different sizes (square, landscape, portrait)

**Document Processing:**
- [ ] Upload PDF contract and ask "Summarize this"
- [ ] Upload Word document and ask questions about content
- [ ] Upload multiple documents and ask "Compare these"
- [ ] Upload text file and ask for analysis

**Error Handling:**
- [ ] Upload file larger than 10MB (should show error)
- [ ] Upload unsupported file type (should show error)
- [ ] Test rate limiting (if possible)
- [ ] Test with invalid/broken image URL

---

#### 6.2 Update API Documentation
**File:** `API_DOCUMENTATION.md`

Add new endpoints and capabilities:

```markdown
### POST /api/assistant/upload

Upload files for Neptune AI assistant analysis.

**Request:** multipart/form-data
- `file`: File to upload (max 10MB)

**Supported Types:**
- Images: JPG, PNG, GIF, WebP, SVG
- Documents: PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON
- Archives: ZIP, RAR, GZ

**Response:**
```json
{
  "attachment": {
    "type": "image" | "document" | "file",
    "url": "https://...",
    "name": "filename.pdf",
    "size": 1234567,
    "mimeType": "application/pdf"
  }
}
```

**Rate Limit:** 20 uploads per minute

---

### AI Tool: create_professional_document

Generate polished presentations, documents, and webpages using Gamma.app.

**Parameters:**
- `prompt` (required): Detailed description of content to create
- `contentType` (required): 'presentation' | 'document' | 'webpage' | 'social'
- `style`: 'minimal' | 'professional' | 'creative' | 'bold'
- `title`: Document title

**Returns:**
- Edit URL for Gamma.app
- Export URLs (PDF, PPTX)
- Card count
- Embed URL

---

### AI Tool: generate_image

Generate images using DALL-E 3.

**Parameters:**
- `prompt` (required): Detailed image description
- `size`: '1024x1024' | '1792x1024' | '1024x1792'
- `quality`: 'standard' | 'hd'
- `style`: 'vivid' | 'natural'

**Returns:**
- Image URL (stored in Vercel Blob)
- Revised prompt
- Size and quality metadata

---

### GPT-4o Vision Capabilities

Neptune now uses GPT-4o with built-in vision. When users upload images:
- Automatic image analysis
- Text extraction from screenshots
- Chart and diagram interpretation
- Design feedback
- Error debugging from screenshots

No separate API - vision is integrated into chat messages.
```

---

#### 6.3 Update Project Documentation

**File:** `PROJECT_STATUS.md`

Add comprehensive summary under "Recent Changes":

```markdown
### [Current Date] - Neptune AI Enhancement (COMPLETE)

#### Neptune AI Comprehensive Backend Upgrade

Complete overhaul of Neptune AI assistant with enterprise-grade capabilities. All backend enhancements with minimal UI changes (inline displays only).

**New Capabilities:**

1. **File Upload Infrastructure** ✅
   - Upload images, PDFs, Word docs, Excel, text files (max 10MB)
   - Paste images from clipboard
   - Store in Vercel Blob with workspace organization
   - Support all Neptune panels (Conversations, Creator, Assistant page)

2. **GPT-4o Vision Upgrade** ✅
   - Upgraded from GPT-4 Turbo to GPT-4o
   - 2x faster response time, 50% cost reduction
   - Built-in vision for screenshot analysis
   - Text extraction from images
   - Chart and diagram interpretation

3. **Gamma.app Professional Documents** ✅
   - Create polished presentations and pitch decks
   - Generate professional proposals and reports
   - Design landing pages and webpages
   - Create social media content
   - Inline preview with edit and download links

4. **DALL-E 3 Image Generation** ✅
   - Generate logos, graphics, illustrations
   - Create marketing assets and social media images
   - Support square, landscape, and portrait formats
   - Standard and HD quality options
   - Store in Vercel Blob for persistence

5. **Document Processing** ✅
   - Auto-extract text from PDFs
   - Process Word documents (.docx)
   - Read text files and CSVs
   - Include document content in AI context automatically
   - Multi-document analysis support

**Technical Implementation:**
- New API route: `/api/assistant/upload` for file handling
- Database schema: Added `attachments` column to `aiMessages` table
- New libraries: `src/lib/dalle.ts`, `src/lib/document-processing.ts`
- AI tools: `create_professional_document`, `generate_image`
- Dependencies: pdf-parse, mammoth

**Files Modified:**
- `src/app/api/assistant/upload/route.ts` (NEW)
- `src/lib/dalle.ts` (NEW)
- `src/lib/document-processing.ts` (NEW)
- `src/db/schema.ts` (attachments column)
- `src/app/api/assistant/chat/route.ts` (GPT-4o + document processing)
- `src/lib/ai/tools.ts` (2 new tools + handlers)
- `src/components/conversations/NeptuneAssistPanel.tsx` (file upload + displays)
- `src/components/creator/CreatorNeptunePanel.tsx` (file upload + displays)
- `src/app/(app)/assistant/page.tsx` (file upload + displays)

**Cost Impact:**
- GPT-4o: 50% cheaper than GPT-4 Turbo (~$5-10/month per user)
- DALL-E 3: ~$2-5/month per user (50 images)
- Gamma.app: Existing subscription (no additional cost)
- Vercel Blob: ~$1-2/month (included in plan)
- Total: ~$8-17/month per active user (cheaper than before)

**User Experience:**
- Zero UI complexity added (just paperclip button)
- All results display inline in chat (ChatGPT-style)
- Professional documents, images, and analysis without leaving conversation
- Paste support for quick screenshot sharing
```

**File:** `README.md`

Update features section:

```markdown
### 🤖 Neptune AI Assistant (Enhanced)
- Multi-provider support (OpenAI GPT-4o, Anthropic, Google)
- **File upload support** - Send documents, images, PDFs for analysis
- **Vision capabilities** - Analyze screenshots, extract text from images
- **Professional document creation** - Gamma.app integration for presentations and proposals
- **Image generation** - DALL-E 3 for logos, graphics, marketing visuals
- **Document processing** - Auto-extract text from PDFs and Word documents
- Context-aware responses with workspace data
- Streaming support for real-time responses
- Available on all dashboard pages + dedicated `/assistant` page
```

---

#### Phase 6 Deliverables:
- ✅ All features manually tested
- ✅ API documentation updated
- ✅ PROJECT_STATUS.md updated
- ✅ README.md updated
- ✅ All commits pushed to git

**Final Git Commit:**
```bash
git add .
git commit -m "docs(neptune): complete Neptune AI enhancement documentation

- Update API_DOCUMENTATION.md with new endpoints and tools
- Add comprehensive summary to PROJECT_STATUS.md
- Update README.md features list with Neptune capabilities
- Document all new AI tools and file upload functionality
- Add testing checklist and cost analysis"

git push origin main
```

---

## 🎉 Implementation Complete!

### Final Steps:

1. **Rename this file:**
   ```bash
   mv NEPTUNE_AI_ENHANCEMENT_PLAN.md NEPTUNE_AI_ENHANCEMENT_PLAN_COMPLETE.md
   ```

2. **Final commit:**
   ```bash
   git add NEPTUNE_AI_ENHANCEMENT_PLAN_COMPLETE.md
   git commit -m "docs: mark Neptune AI enhancement plan as complete"
   git push origin main
   ```

3. **Verify everything works:**
   - Test file upload
   - Test image generation
   - Test Gamma documents
   - Test document processing
   - Test vision analysis

---

## 📊 Summary of Changes

**New Files Created:**
- `src/app/api/assistant/upload/route.ts`
- `src/lib/dalle.ts`
- `src/lib/document-processing.ts`

**Files Modified:**
- `src/db/schema.ts` (added attachments column)
- `src/app/api/assistant/chat/route.ts` (GPT-4o + doc processing)
- `src/lib/ai/tools.ts` (2 new tools: Gamma + DALL-E)
- `src/components/conversations/NeptuneAssistPanel.tsx`
- `src/components/creator/CreatorNeptunePanel.tsx`
- `src/app/(app)/assistant/page.tsx`
- `API_DOCUMENTATION.md`
- `PROJECT_STATUS.md`
- `README.md`

**Dependencies Added:**
- `pdf-parse`
- `mammoth`

**Database Changes:**
- Added `attachments` column to `aiMessages` table

**Total Implementation Time:** 17-23 hours (~3 days)

**Git Commits:** 6 commits (one per phase)

---

## ✅ Success Criteria Met

Users can now:
- ✅ Upload PDFs and ask "Summarize this contract"
- ✅ Paste screenshots and ask "What's wrong here?"
- ✅ Say "Create a logo for my coffee shop" and get an image
- ✅ Upload Excel files and ask "What are the trends?"
- ✅ Request "Design a pitch deck" and get a professional presentation
- ✅ Say "Make a social media graphic" and get a designed image

**Neptune is now an enterprise-grade AI wingman!** 🚀

---

**End of Implementation Plan**
