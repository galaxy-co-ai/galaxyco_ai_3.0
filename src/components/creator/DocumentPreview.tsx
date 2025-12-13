"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Save,
  Share2,
  Download,
  Copy,
  Plus,
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
  Edit3,
  X,
  Send,
  FolderOpen,
  ExternalLink,
  Wand2,
  FileCode,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type DocumentTypeConfig } from "./documentRequirements";
import { ShareDocumentDialog } from "./ShareDocumentDialog";

// Document section structure
interface DocumentSection {
  id: string;
  type: "title" | "heading" | "paragraph" | "list" | "cta";
  content: string;
  editable: boolean;
}

interface DocumentPreviewProps {
  docType: DocumentTypeConfig;
  answers: Record<string, string>;
  onBack: () => void;
  onSaveToCollections: (document: GeneratedDocument) => void;
  onCreateNew: () => void;
}

interface GeneratedDocument {
  id: string;
  title: string;
  type: string;
  sections: DocumentSection[];
  createdAt: Date;
  metadata: Record<string, string>;
}

export default function DocumentPreview({
  docType,
  answers,
  onBack,
  onSaveToCollections,
  onCreateNew,
}: DocumentPreviewProps) {
  // State
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [showAiEdit, setShowAiEdit] = useState<string | null>(null);
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [isApplyingAiEdit, setIsApplyingAiEdit] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareLinkDialog, setShowShareLinkDialog] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [saveTitle, setSaveTitle] = useState(""); // Custom title for save dialog
  
  // Gamma integration state
  const [isGammaAvailable, setIsGammaAvailable] = useState(false);
  const [isGeneratingGamma, setIsGeneratingGamma] = useState(false);
  const [gammaResult, setGammaResult] = useState<{
    editUrl?: string;
    embedUrl?: string;
    exportFormats?: { pdf?: string; pptx?: string };
  } | null>(null);

  // Check if Gamma is available on mount
  useEffect(() => {
    async function checkGammaStatus() {
      try {
        const response = await fetch('/api/creator/gamma');
        const data = await response.json();
        setIsGammaAvailable(data.configured && data.supportedTypes?.includes(docType.id));
      } catch {
        setIsGammaAvailable(false);
      }
    }
    checkGammaStatus();
  }, [docType.id]);

  // Generate document on mount using real AI
  useEffect(() => {
    generateDocument();
  }, []);

  const generateDocument = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Progress animation
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      // Call real AI generation API
      const response = await fetch('/api/creator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docTypeId: docType.id,
          docTypeName: docType.name,
          answers,
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      
      // Transform API response to local document format
      const generatedDoc: GeneratedDocument = {
        id: data.document.id,
        title: data.document.title,
        type: data.document.type,
        sections: data.document.sections.map((s: { id: string; type: string; content: string }) => ({
          ...s,
          editable: true,
        })),
        createdAt: new Date(data.document.createdAt),
        metadata: data.document.metadata || answers,
      };

      setDocument(generatedDoc);
      setIsGenerating(false);

      toast.success("Document generated!", {
        description: "Review and edit your content below",
      });
    } catch (error) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      
      toast.error("Generation failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
      
      // Fallback to a basic document structure
      const fallbackDoc: GeneratedDocument = {
        id: `doc-${Date.now()}`,
        title: `New ${docType.name}`,
        type: docType.id,
        sections: [
          { id: 'title', type: 'title', content: `New ${docType.name}`, editable: true },
          { id: 'intro', type: 'paragraph', content: 'Your content will appear here. Please try generating again.', editable: true },
        ],
        createdAt: new Date(),
        metadata: answers,
      };
      setDocument(fallbackDoc);
    }
  };

  // Generate polished document with Gamma
  const handleGenerateWithGamma = async () => {
    if (!isGammaAvailable) return;
    
    setIsGeneratingGamma(true);
    
    try {
      const response = await fetch('/api/creator/gamma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docTypeId: docType.id,
          docTypeName: docType.name,
          answers,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate with Gamma');
      }
      
      // Store Gamma result
      setGammaResult({
        editUrl: data.data.editUrl,
        embedUrl: data.data.embedUrl,
        exportFormats: data.data.exportFormats,
      });
      
      // Update document with Gamma content
      if (data.data.cards && data.data.cards.length > 0) {
        const gammaSections: DocumentSection[] = [
          {
            id: 'gamma-title',
            type: 'title',
            content: data.data.title || document?.title || 'Untitled',
            editable: true,
          },
          ...data.data.cards.map((card: { title: string; content: string }, index: number) => ({
            id: `gamma-${index}`,
            type: index === 0 ? 'heading' : 'paragraph' as const,
            content: card.title ? `${card.title}\n\n${card.content}` : card.content,
            editable: true,
          })),
        ];
        
        setDocument({
          id: data.data.id || document?.id || `gamma-${Date.now()}`,
          title: data.data.title || document?.title || 'Gamma Document',
          type: docType.id,
          sections: gammaSections,
          createdAt: new Date(),
          metadata: { ...answers, gammaGenerated: 'true' },
        });
      }
      
      toast.success("Polished with Gamma! ✨", {
        description: "Your content has been enhanced with professional design",
      });
      
    } catch (error) {
      toast.error("Gamma generation failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsGeneratingGamma(false);
    }
  };

  // Handle section click to edit
  const handleSectionClick = (sectionId: string) => {
    if (editingSection === sectionId) return;
    
    const section = document?.sections.find((s) => s.id === sectionId);
    if (section?.editable) {
      setEditingSection(sectionId);
      setEditedContent(section.content);
      setShowAiEdit(null);
    }
  };

  // Save section edit
  const handleSaveEdit = () => {
    if (!document || !editingSection) return;

    setDocument({
      ...document,
      sections: document.sections.map((s) =>
        s.id === editingSection ? { ...s, content: editedContent } : s
      ),
    });
    setEditingSection(null);
    setEditedContent("");
    toast.success("Section updated");
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditedContent("");
  };

  // Show AI edit input for a section
  const handleShowAiEdit = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAiEdit(sectionId);
    setAiEditPrompt("");
  };

  // Apply AI edit using real AI endpoint
  const handleApplyAiEdit = async (sectionId: string) => {
    if (!aiEditPrompt.trim() || !document) return;

    const section = document.sections.find((s) => s.id === sectionId);
    if (!section) return;

    setIsApplyingAiEdit(true);

    try {
      const response = await fetch('/api/creator/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docTypeId: docType.id,
          docTypeName: docType.name,
          sectionType: section.type,
          sectionContent: section.content,
          instruction: aiEditPrompt,
          answers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'AI edit failed');
      }

      const data = await response.json();
      const aiEditedContent =
        typeof data.content === 'string' && data.content.trim().length > 0
          ? data.content
          : section.content;

      setDocument({
        ...document,
        sections: document.sections.map((s) =>
          s.id === sectionId ? { ...s, content: aiEditedContent } : s
        ),
      });

      toast.success("AI edit applied", {
        description: "Neptune updated this section",
      });
    } catch (error) {
      toast.error("AI edit failed", {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsApplyingAiEdit(false);
      setShowAiEdit(null);
      setAiEditPrompt("");
    }
  };

  // Save to collections - calls real API
  const handleSave = async () => {
    if (!document) return;
    
    // Use custom title from save dialog, fall back to document title
    const titleToSave = saveTitle.trim() || document.title;
    
    if (!titleToSave) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch('/api/creator/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToSave,
          type: document.type,
          content: { sections: document.sections },
          metadata: document.metadata,
          starred: false,
          gammaUrl: gammaResult?.editUrl || null,
          gammaEditUrl: gammaResult?.editUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await response.json();
      
      // Update local document with saved ID and new title
      const savedDocument = {
        ...document,
        id: data.item.id,
        title: titleToSave,
      };
      
      setSavedDocumentId(data.item.id);
      onSaveToCollections(savedDocument);
      setIsSaving(false);
      setShowSaveDialog(false);
      
      toast.success("Saved to Collections!", {
        description: `"${titleToSave}" has been saved`,
      });
    } catch (error) {
      setIsSaving(false);
      toast.error("Failed to save", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!document) return;
    
    const text = document.sections.map((s) => s.content).join("\n\n");
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Download
  const handleDownload = () => {
    if (!document) return;
    
    const text = document.sections.map((s) => s.content).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  // Generation loading state
  if (isGenerating) {
    return (
      <Card className="h-full flex flex-col items-center justify-center rounded-2xl shadow-sm border bg-card p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="h-10 w-10 text-white animate-pulse" />
            </div>
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-2xl border-2 border-violet-300 border-t-violet-600"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              Neptune is creating your {docType.name.toLowerCase()}...
            </h3>
            <p className="text-sm text-gray-500">
              Crafting the perfect content based on your inputs
            </p>
          </div>

          <div className="w-64 mx-auto space-y-2">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${generationProgress}%` }}
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400">
              {Math.round(generationProgress)}% complete
            </p>
          </div>
        </motion.div>
      </Card>
    );
  }

  if (!document) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Edit
        </Button>

        <div className="flex items-center gap-2">
          {/* Gamma Polish Button */}
          {isGammaAvailable && !gammaResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateWithGamma}
              disabled={isGeneratingGamma}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              {isGeneratingGamma ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Polishing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Polish with Gamma
                </>
              )}
            </Button>
          )}
          
          {/* Gamma Actions (when generated) */}
          {gammaResult && (
            <>
              {gammaResult.editUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(gammaResult.editUrl, '_blank')}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Edit in Gamma
                </Button>
              )}
              {gammaResult.exportFormats?.pdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(gammaResult.exportFormats?.pdf, '_blank')}
                >
                  <FileCode className="h-4 w-4 mr-1" />
                  Export PDF
                </Button>
              )}
            </>
          )}
          
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="h-4 w-4 mr-1" />
            Save to Collections
          </Button>
        </div>
      </div>

      {/* Document Preview */}
      <Card className="flex-1 overflow-hidden rounded-2xl shadow-sm border bg-white">
        <div className="h-full overflow-y-auto p-8">
          {/* Document Header */}
          <div className="flex items-start gap-4 mb-8 pb-6 border-b">
            <div
              className={cn(
                "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg",
                docType.gradientFrom,
                docType.gradientTo
              )}
            >
              <docType.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn(docType.bgColor, docType.iconColor, "border", docType.borderColor)}>
                  {docType.name}
                </Badge>
                {gammaResult && (
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                    <Wand2 className="h-3 w-3 mr-1" />
                    Polished with Gamma
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Created just now • Click any section to edit
              </p>
            </div>
          </div>

          {/* Document Sections */}
          <div className="space-y-6 max-w-3xl mx-auto">
            {document.sections.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
              >
                {editingSection === section.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    {section.type === "title" || section.type === "heading" ? (
                      <Input
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className={cn(
                          section.type === "title" && "text-2xl font-bold",
                          section.type === "heading" && "text-lg font-semibold"
                        )}
                        autoFocus
                      />
                    ) : (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[100px]"
                        autoFocus
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : showAiEdit === section.id ? (
                  // AI Edit mode
                  <div className="space-y-3 p-4 bg-violet-50 rounded-xl border border-violet-200">
                    <div className="flex items-center gap-2 text-sm text-violet-700">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">Neptune AI Edit</span>
                    </div>
                    <div
                      className={cn(
                        "text-gray-700 p-3 bg-white rounded-lg border",
                        section.type === "title" && "text-2xl font-bold",
                        section.type === "heading" && "text-lg font-semibold"
                      )}
                    >
                      {section.content}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={aiEditPrompt}
                        onChange={(e) => setAiEditPrompt(e.target.value)}
                        placeholder="Describe the change (e.g., 'make it more casual')"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isApplyingAiEdit) {
                            handleApplyAiEdit(section.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleApplyAiEdit(section.id)}
                        disabled={!aiEditPrompt.trim() || isApplyingAiEdit}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        {isApplyingAiEdit ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAiEdit(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div
                    onClick={() => handleSectionClick(section.id)}
                    className={cn(
                      "relative rounded-lg transition-all cursor-pointer",
                      section.editable &&
                        "hover:bg-gray-50 hover:ring-2 hover:ring-violet-200 p-4 -m-4"
                    )}
                  >
                    {section.type === "title" && (
                      <h1 className="text-2xl font-bold text-gray-900">
                        {section.content}
                      </h1>
                    )}
                    {section.type === "heading" && (
                      <h2 className="text-lg font-semibold text-gray-800">
                        {section.content}
                      </h2>
                    )}
                    {section.type === "paragraph" && (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </p>
                    )}
                    {section.type === "list" && (
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {section.content.split("\n").map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {section.type === "cta" && (
                      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
                        <p className="font-medium text-violet-700">
                          {section.content}
                        </p>
                      </div>
                    )}

                    {/* Edit buttons - show on hover */}
                    {section.editable && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSectionClick(section.id);
                          }}
                          className="p-1.5 rounded-lg bg-white border shadow-sm hover:bg-gray-50"
                          title="Edit manually"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => handleShowAiEdit(section.id, e)}
                          className="p-1.5 rounded-lg bg-violet-100 border border-violet-200 shadow-sm hover:bg-violet-200"
                          title="AI edit with Neptune"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Create New Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={onCreateNew}
          className="text-gray-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create Another
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog 
        open={showSaveDialog} 
        onOpenChange={(open) => {
          setShowSaveDialog(open);
          // Initialize save title when opening dialog
          if (open && document) {
            setSaveTitle(document.title);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-emerald-600" />
              Save to Collections
            </DialogTitle>
            <DialogDescription>
              Your document will be organized and saved to your Collections.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="save-document-title" className="text-sm font-medium text-gray-700 mb-1 block">
                Document Title
              </label>
              <Input 
                id="save-document-title"
                value={saveTitle} 
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Enter document title"
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Type
              </label>
              <Badge className={cn(docType.bgColor, docType.iconColor, "border", docType.borderColor)}>
                {docType.name}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !saveTitle.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              Share Document
            </DialogTitle>
            <DialogDescription>
              Share this document with your team or externally.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download as Text File
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              disabled={!savedDocumentId}
              onClick={() => {
                setShowShareDialog(false);
                setShowShareLinkDialog(true);
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {savedDocumentId ? 'Get Shareable Link' : 'Save First to Get Link'}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Link Dialog */}
      {savedDocumentId && (
        <ShareDocumentDialog
          open={showShareLinkDialog}
          onOpenChange={setShowShareLinkDialog}
          documentId={savedDocumentId}
          documentTitle={document?.title || 'Untitled'}
        />
      )}
    </div>
  );
}

