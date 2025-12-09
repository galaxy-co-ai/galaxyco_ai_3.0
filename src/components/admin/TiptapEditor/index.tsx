"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo,
  Redo,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// AI Components
import { AIAutocomplete } from './extensions/AIAutocomplete';
import { AICommands } from './extensions/AICommands';
import { AISelectionMenu as AISelectionMenuExtension } from './extensions/AISelectionMenu';
import { AICommandPalette } from './AICommandPalette';
import { AISelectionMenu } from './AISelectionMenu';
import { AIInlineSuggestion } from './AIInlineSuggestion';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Citation format type
export interface CitationData {
  title: string;
  url: string | null;
  publication: string | null;
}

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  enableAI?: boolean;
  articleContext?: {
    title?: string;
    outline?: Array<{ title: string; type: string }>;
    layoutTemplate?: string;
    targetAudience?: string;
  };
  onFindSource?: (selectedText: string) => void;
  onSuggestImage?: (context: string) => void;
  onEditorReady?: (insertCitation: (citation: CitationData) => void) => void;
}

export function TiptapEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing your article...",
  className,
  enableAI = true,
  articleContext,
  onFindSource,
  onSuggestImage,
  onEditorReady,
}: TiptapEditorProps) {
  // AI State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState({ x: 0, y: 0 });
  const [selectionMenuVisible, setSelectionMenuVisible] = useState(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [suggestionMode, setSuggestionMode] = useState<'continue' | 'rewrite'>('continue');
  const [originalText, setOriginalText] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectionRangeRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg bg-zinc-900 p-4 font-mono text-sm',
        },
      }),
      // AI Extensions (only if enabled)
      ...(enableAI ? [
        AIAutocomplete.configure({
          onContinue: handleAIContinue,
          onAccept: (text: string) => {
            setSuggestionVisible(false);
            setSuggestion('');
          },
          onReject: () => {
            setSuggestionVisible(false);
            setSuggestion('');
          },
          getSuggestion: () => suggestion,
        }),
        AICommands.configure({
          onOpenPalette: (pos) => {
            setCommandPalettePosition(pos);
            setCommandPaletteOpen(true);
          },
          onClosePalette: () => {
            setCommandPaletteOpen(false);
          },
        }),
        AISelectionMenuExtension.configure({
          onShowMenu: (pos, text) => {
            setSelectionMenuPosition(pos);
            setSelectedText(text);
            setSelectionMenuVisible(true);
          },
          onHideMenu: () => {
            setSelectionMenuVisible(false);
          },
        }),
      ] : []),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-zinc dark:prose-invert max-w-none',
          'min-h-[400px] p-4 focus:outline-none',
          'prose-headings:font-semibold',
          'prose-p:text-base prose-p:leading-7',
          'prose-a:text-primary prose-a:underline',
          'prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r',
          'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-zinc-900 prose-pre:text-zinc-100',
          'prose-img:rounded-lg',
          'prose-hr:border-border',
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Insert citation function
  const insertCitation = useCallback((citation: CitationData) => {
    if (!editor) return;

    const { title, url, publication } = citation;
    
    // Format citation text
    let citationText: string;
    if (url) {
      // Create linked citation
      if (publication) {
        citationText = `According to <a href="${url}" target="_blank" rel="noopener noreferrer">${publication}</a>`;
      } else {
        citationText = `According to <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`;
      }
    } else {
      // Plain text citation
      citationText = publication ? `According to ${publication}` : `According to ${title}`;
    }

    // Insert at cursor position
    editor
      .chain()
      .focus()
      .insertContent(citationText + ', ')
      .run();

    toast.success('Citation inserted');
  }, [editor]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(insertCitation);
    }
  }, [editor, onEditorReady, insertCitation]);

  // Handle AI Continue
  function handleAIContinue(editorContent: string, cursorPosition: number) {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setSuggestionMode('continue');
    setSuggestionLoading(true);
    setSuggestionVisible(true);
    setSuggestion('');
    setOriginalText('');
    
    // Position suggestion panel near cursor
    if (editor) {
      const coords = editor.view.coordsAtPos(cursorPosition);
      setSuggestionPosition({ x: coords.left, y: coords.bottom + 8 });
    }

    // Stream AI response
    streamAIContinue(editorContent, cursorPosition);
  }

  // Stream AI Continue Response
  async function streamAIContinue(editorContent: string, cursorPosition: number) {
    try {
      const response = await fetch('/api/admin/ai/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editorContent,
          cursorPosition,
          context: articleContext,
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestion');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedText += parsed.content;
                setSuggestion(accumulatedText);
              }
              if (parsed.error) {
                toast.error(parsed.error);
              }
            } catch {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      setSuggestionLoading(false);
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      logger.error('AI continue error', error);
      toast.error('Failed to generate suggestion');
      setSuggestionLoading(false);
      setSuggestionVisible(false);
    }
  }

  // Handle AI Rewrite
  async function handleAIRewrite(text: string, mode: 'improve' | 'simplify' | 'expand' | 'shorten' | 'rephrase') {
    if (!editor) return;

    // Store selection range for later use
    const { from, to } = editor.state.selection;
    selectionRangeRef.current = { from, to };

    setSuggestionMode('rewrite');
    setSuggestionLoading(true);
    setSuggestionVisible(true);
    setSuggestion('');
    setOriginalText(text);
    setSelectionMenuVisible(false);

    // Position suggestion panel near selection
    const coords = editor.view.coordsAtPos(from);
    setSuggestionPosition({ x: coords.left, y: coords.top - 8 });

    try {
      const response = await fetch('/api/admin/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          context: articleContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rewrite text');
      }

      const data = await response.json();
      setSuggestion(data.rewritten);
      setSuggestionLoading(false);
    } catch (error) {
      logger.error('AI rewrite error', error);
      toast.error('Failed to rewrite text');
      setSuggestionLoading(false);
      setSuggestionVisible(false);
    }
  }

  // Accept suggestion
  const handleAcceptSuggestion = useCallback((text: string) => {
    if (!editor || !text) return;

    if (suggestionMode === 'continue') {
      // Insert at cursor position
      editor.chain().focus().insertContent(text).run();
    } else if (suggestionMode === 'rewrite' && selectionRangeRef.current) {
      // Replace selected text
      const { from, to } = selectionRangeRef.current;
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, text)
        .run();
    }

    setSuggestionVisible(false);
    setSuggestion('');
    selectionRangeRef.current = null;
    toast.success('Applied!');
  }, [editor, suggestionMode]);

  // Reject suggestion
  const handleRejectSuggestion = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSuggestionVisible(false);
    setSuggestion('');
    selectionRangeRef.current = null;
  }, []);

  // Regenerate suggestion
  const handleRegenerateSuggestion = useCallback(() => {
    if (suggestionMode === 'continue' && editor) {
      const { selection } = editor.state;
      handleAIContinue(editor.getHTML(), selection.from);
    } else if (suggestionMode === 'rewrite' && originalText) {
      handleAIRewrite(originalText, 'rephrase');
    }
  }, [editor, suggestionMode, originalText]);

  // Command handlers
  const handleContinue = useCallback(() => {
    if (editor) {
      const { selection } = editor.state;
      handleAIContinue(editor.getHTML(), selection.from);
    }
    setCommandPaletteOpen(false);
  }, [editor]);

  const handleRephrase = useCallback(() => {
    if (editor) {
      const { state } = editor;
      const { from, to } = state.selection;
      const text = state.doc.textBetween(from, to, ' ');
      if (text.trim()) {
        handleAIRewrite(text, 'rephrase');
      } else {
        toast.error('Please select some text first');
      }
    }
    setCommandPaletteOpen(false);
  }, [editor]);

  const handleExpand = useCallback(() => {
    if (editor) {
      const { state } = editor;
      const { from, to } = state.selection;
      const text = state.doc.textBetween(from, to, ' ');
      if (text.trim()) {
        handleAIRewrite(text, 'expand');
      } else {
        toast.error('Please select some text first');
      }
    }
    setCommandPaletteOpen(false);
  }, [editor]);

  const handleShorten = useCallback(() => {
    if (editor) {
      const { state } = editor;
      const { from, to } = state.selection;
      const text = state.doc.textBetween(from, to, ' ');
      if (text.trim()) {
        handleAIRewrite(text, 'shorten');
      } else {
        toast.error('Please select some text first');
      }
    }
    setCommandPaletteOpen(false);
  }, [editor]);

  const handleFindSource = useCallback(() => {
    if (editor) {
      const { state } = editor;
      const { from, to } = state.selection;
      const text = state.doc.textBetween(from, to, ' ');
      if (text.trim()) {
        if (onFindSource) {
          onFindSource(text.trim());
        } else {
          toast.info('Select text and use the Source Panel to find citations');
        }
      } else {
        toast.error('Please select some text first');
      }
    }
    setCommandPaletteOpen(false);
  }, [editor, onFindSource]);

  const handleSuggestImage = useCallback(() => {
    if (editor && onSuggestImage) {
      // Get surrounding context for image suggestion
      const { state } = editor;
      const { from } = state.selection;
      const doc = state.doc;
      
      // Get text around cursor for context
      const start = Math.max(0, from - 500);
      const end = Math.min(doc.content.size, from + 500);
      const context = doc.textBetween(start, end, ' ');
      
      onSuggestImage(context);
    } else {
      toast.info('Image generation coming in Phase 6');
    }
    setCommandPaletteOpen(false);
  }, [editor, onSuggestImage]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <div className="h-12 border-b bg-muted/50 animate-pulse" />
        <div className="min-h-[400px] p-4 animate-pulse" />
      </div>
    );
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children,
    title
  }: { 
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8",
        isActive && "bg-muted text-foreground"
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden relative", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b bg-muted/30 flex-wrap">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <FileCode className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Media */}
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          title="Add Image"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        {/* AI Button */}
        {enableAI && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 gap-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50",
                commandPaletteOpen && "bg-violet-50"
              )}
              onClick={() => {
                if (commandPaletteOpen) {
                  setCommandPaletteOpen(false);
                } else {
                  const coords = editor.view.coordsAtPos(editor.state.selection.from);
                  setCommandPalettePosition({ x: coords.left, y: coords.bottom + 8 });
                  setCommandPaletteOpen(true);
                }
              }}
              title="AI Commands (⌘J)"
              aria-label="Open AI commands"
              aria-haspopup="listbox"
              aria-expanded={commandPaletteOpen}
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium">AI</span>
            </Button>
          </>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* AI Components */}
      {enableAI && (
        <>
          <AICommandPalette
            isOpen={commandPaletteOpen}
            position={commandPalettePosition}
            onClose={() => setCommandPaletteOpen(false)}
            onContinue={handleContinue}
            onRephrase={handleRephrase}
            onExpand={handleExpand}
            onShorten={handleShorten}
            onFindSource={handleFindSource}
            onSuggestImage={handleSuggestImage}
          />

          <AISelectionMenu
            isVisible={selectionMenuVisible}
            position={selectionMenuPosition}
            selectedText={selectedText}
            onHide={() => setSelectionMenuVisible(false)}
            onImprove={(text) => handleAIRewrite(text, 'improve')}
            onRephrase={(text) => handleAIRewrite(text, 'rephrase')}
            onShorten={(text) => handleAIRewrite(text, 'shorten')}
            onFindSource={(text) => {
              if (onFindSource) {
                onFindSource(text);
              } else {
                toast.info('Select text and use the Source Panel to find citations');
              }
              setSelectionMenuVisible(false);
            }}
          />

          <AIInlineSuggestion
            isVisible={suggestionVisible}
            isLoading={suggestionLoading}
            suggestion={suggestion}
            originalText={originalText}
            mode={suggestionMode}
            position={suggestionPosition}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
            onRegenerate={handleRegenerateSuggestion}
          />
        </>
      )}
    </div>
  );
}

export default TiptapEditor;

