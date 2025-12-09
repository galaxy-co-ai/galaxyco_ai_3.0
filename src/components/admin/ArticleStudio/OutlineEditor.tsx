"use client";

import { useState, useCallback } from 'react';
import { 
  GripVertical,
  Edit3,
  RefreshCw,
  Trash2,
  Plus,
  Sparkles,
  ChevronUp,
  ChevronDown,
  FileText,
  Loader2,
  Check,
  X,
  Wand2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  getLayout, 
  layoutColorClasses,
  getSectionTypeLabel,
  type LayoutTemplate,
  type SectionType
} from '@/lib/ai/article-layouts';

// Outline section type (editable version)
export interface OutlineSection {
  id: string;
  title: string;
  type: SectionType;
  bullets: string[];
  wordCount: number;
  isEditing?: boolean;
}

// Full outline data
export interface OutlineData {
  title: string;
  description: string;
  sections: OutlineSection[];
  layoutId: LayoutTemplate['id'];
  targetAudience?: string;
  suggestedAngle?: string;
}

interface OutlineEditorProps {
  outline: OutlineData;
  onChange: (outline: OutlineData) => void;
  onGenerateDraft: () => void;
  isGeneratingDraft?: boolean;
}

export function OutlineEditor({ 
  outline, 
  onChange, 
  onGenerateDraft,
  isGeneratingDraft = false
}: OutlineEditorProps) {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingBulletIndex, setEditingBulletIndex] = useState<{ sectionId: string; bulletIndex: number } | null>(null);
  const [newBulletText, setNewBulletText] = useState('');
  const [addingBulletToSection, setAddingBulletToSection] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [gettingVariations, setGettingVariations] = useState<string | null>(null);
  const [titleVariations, setTitleVariations] = useState<{ sectionId: string; variations: string[] } | null>(null);

  const layout = getLayout(outline.layoutId);
  const colorClasses = layoutColorClasses[outline.layoutId];

  // Update outline title
  const handleTitleChange = useCallback((newTitle: string) => {
    onChange({ ...outline, title: newTitle });
  }, [outline, onChange]);

  // Update outline description
  const handleDescriptionChange = useCallback((newDescription: string) => {
    onChange({ ...outline, description: newDescription });
  }, [outline, onChange]);

  // Update section title
  const handleSectionTitleChange = useCallback((sectionId: string, newTitle: string) => {
    const updatedSections = outline.sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    );
    onChange({ ...outline, sections: updatedSections });
  }, [outline, onChange]);

  // Update bullet point
  const handleBulletChange = useCallback((sectionId: string, bulletIndex: number, newText: string) => {
    const updatedSections = outline.sections.map(section => {
      if (section.id === sectionId) {
        const newBullets = [...section.bullets];
        newBullets[bulletIndex] = newText;
        return { ...section, bullets: newBullets };
      }
      return section;
    });
    onChange({ ...outline, sections: updatedSections });
  }, [outline, onChange]);

  // Add bullet point
  const handleAddBullet = useCallback((sectionId: string) => {
    if (!newBulletText.trim()) {
      setAddingBulletToSection(null);
      return;
    }
    const updatedSections = outline.sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, bullets: [...section.bullets, newBulletText.trim()] };
      }
      return section;
    });
    onChange({ ...outline, sections: updatedSections });
    setNewBulletText('');
    setAddingBulletToSection(null);
  }, [outline, onChange, newBulletText]);

  // Delete bullet point
  const handleDeleteBullet = useCallback((sectionId: string, bulletIndex: number) => {
    const updatedSections = outline.sections.map(section => {
      if (section.id === sectionId) {
        const newBullets = section.bullets.filter((_, index) => index !== bulletIndex);
        return { ...section, bullets: newBullets };
      }
      return section;
    });
    onChange({ ...outline, sections: updatedSections });
  }, [outline, onChange]);

  // Move section up or down
  const handleMoveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = outline.sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= outline.sections.length) return;

    const newSections = [...outline.sections];
    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
    onChange({ ...outline, sections: newSections });
  }, [outline, onChange]);

  // Delete section
  const handleDeleteSection = useCallback((sectionId: string) => {
    const updatedSections = outline.sections.filter(section => section.id !== sectionId);
    onChange({ ...outline, sections: updatedSections });
    toast.success('Section removed');
  }, [outline, onChange]);

  // Add new section
  const handleAddSection = useCallback(() => {
    const newSection: OutlineSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      type: 'body',
      bullets: [],
      wordCount: 200,
    };
    onChange({ ...outline, sections: [...outline.sections, newSection] });
    setEditingTitleId(newSection.id);
  }, [outline, onChange]);

  // Regenerate single section
  const handleRegenerateSection = useCallback(async (sectionId: string) => {
    const section = outline.sections.find(s => s.id === sectionId);
    if (!section) return;

    setRegeneratingSection(sectionId);
    try {
      const response = await fetch('/api/admin/ai/outline/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: outline.title,
          articleDescription: outline.description,
          sectionTitle: section.title,
          sectionType: section.type,
          layoutId: outline.layoutId,
          existingSections: outline.sections.map(s => s.title),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate section');
      }

      const data = await response.json();
      const updatedSections = outline.sections.map(s =>
        s.id === sectionId
          ? { ...s, bullets: data.bullets || [], wordCount: data.wordCount || s.wordCount }
          : s
      );
      onChange({ ...outline, sections: updatedSections });
      toast.success('Section regenerated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate section');
    } finally {
      setRegeneratingSection(null);
    }
  }, [outline, onChange]);

  // Get title variations
  const handleGetVariations = useCallback(async (sectionId: string) => {
    const section = outline.sections.find(s => s.id === sectionId);
    if (!section) return;

    setGettingVariations(sectionId);
    try {
      const response = await fetch('/api/admin/ai/outline/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: outline.title,
          articleDescription: outline.description,
          sectionTitle: section.title,
          sectionType: section.type,
          layoutId: outline.layoutId,
          mode: 'variations',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get variations');
      }

      const data = await response.json();
      setTitleVariations({ sectionId, variations: data.variations || [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to get variations');
    } finally {
      setGettingVariations(null);
    }
  }, [outline]);

  // Apply title variation
  const handleApplyVariation = useCallback((sectionId: string, newTitle: string) => {
    handleSectionTitleChange(sectionId, newTitle);
    setTitleVariations(null);
    toast.success('Title updated');
  }, [handleSectionTitleChange]);

  return (
    <div className="space-y-6">
      {/* Article Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs", colorClasses.bg, colorClasses.text, colorClasses.border)}
            >
              {layout.name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ~{layout.totalWordCountTarget} words target
            </Badge>
          </div>
          
          <Input
            value={outline.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
            placeholder="Article title..."
            aria-label="Article title"
          />
          
          <Input
            value={outline.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="text-sm text-muted-foreground border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
            placeholder="Brief description or subtitle..."
            aria-label="Article description"
          />
        </CardHeader>

        {(outline.targetAudience || outline.suggestedAngle) && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4 text-xs">
              {outline.targetAudience && (
                <div>
                  <span className="font-medium">Target audience: </span>
                  <span className="text-muted-foreground">{outline.targetAudience}</span>
                </div>
              )}
              {outline.suggestedAngle && (
                <div>
                  <span className="font-medium">Angle: </span>
                  <span className="text-muted-foreground">{outline.suggestedAngle}</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">SECTIONS</h3>
          <span className="text-xs text-muted-foreground">
            {outline.sections.length} sections
          </span>
        </div>

        {outline.sections.map((section, index) => (
          <Card 
            key={section.id} 
            className={cn(
              "relative transition-all",
              regeneratingSection === section.id && "opacity-50"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                {/* Reorder Controls */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    onClick={() => handleMoveSection(section.id, 'up')}
                    disabled={index === 0}
                    className={cn(
                      "p-0.5 rounded hover:bg-muted transition-colors",
                      index === 0 && "opacity-30 cursor-not-allowed"
                    )}
                    aria-label="Move section up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveSection(section.id, 'down')}
                    disabled={index === outline.sections.length - 1}
                    className={cn(
                      "p-0.5 rounded hover:bg-muted transition-colors",
                      index === outline.sections.length - 1 && "opacity-30 cursor-not-allowed"
                    )}
                    aria-label="Move section down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Section Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {getSectionTypeLabel(section.type)}
                    </Badge>
                    
                    {editingTitleId === section.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={section.title}
                          onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onBlur={() => setEditingTitleId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingTitleId(null);
                            if (e.key === 'Escape') setEditingTitleId(null);
                          }}
                          aria-label="Edit section title"
                        />
                      </div>
                    ) : (
                      <span 
                        className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                        onClick={() => setEditingTitleId(section.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitleId(section.id); }}
                        aria-label={`Section title: ${section.title}. Click to edit.`}
                      >
                        {section.title}
                      </span>
                    )}

                    {/* Get Variations Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGetVariations(section.id)}
                      disabled={gettingVariations === section.id}
                      className="h-6 px-2 text-xs shrink-0"
                      aria-label="Get title variations"
                    >
                      {gettingVariations === section.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Wand2 className="h-3 w-3 mr-1" />
                          Variations
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Title Variations Dropdown */}
                  {titleVariations?.sectionId === section.id && titleVariations.variations.length > 0 && (
                    <div className="mb-2 p-2 rounded-md bg-muted/50 border">
                      <p className="text-xs font-medium mb-1.5">Alternative titles:</p>
                      <div className="space-y-1">
                        {titleVariations.variations.map((variation, vIndex) => (
                          <button
                            key={vIndex}
                            onClick={() => handleApplyVariation(section.id, variation)}
                            className="w-full text-left text-xs p-1.5 rounded hover:bg-background transition-colors flex items-center gap-2"
                          >
                            <span className="flex-1">{variation}</span>
                            <Check className="h-3 w-3 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setTitleVariations(null)}
                        className="text-xs text-muted-foreground mt-1.5 hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Word Count */}
                  <div className="text-xs text-muted-foreground mb-2">
                    ~{section.wordCount} words
                  </div>
                </div>

                {/* Section Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRegenerateSection(section.id)}
                    disabled={regeneratingSection === section.id}
                    aria-label="Regenerate section content"
                  >
                    {regeneratingSection === section.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteSection(section.id)}
                    aria-label="Delete section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Bullets */}
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {section.bullets.map((bullet, bulletIndex) => (
                  <div 
                    key={bulletIndex}
                    className="flex items-start gap-2 group"
                  >
                    <span className="text-muted-foreground mt-0.5">•</span>
                    
                    {editingBulletIndex?.sectionId === section.id && editingBulletIndex?.bulletIndex === bulletIndex ? (
                      <div className="flex-1 flex items-center gap-1">
                        <Input
                          value={bullet}
                          onChange={(e) => handleBulletChange(section.id, bulletIndex, e.target.value)}
                          className="h-6 text-xs flex-1"
                          autoFocus
                          onBlur={() => setEditingBulletIndex(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingBulletIndex(null);
                            if (e.key === 'Escape') setEditingBulletIndex(null);
                          }}
                          aria-label="Edit bullet point"
                        />
                      </div>
                    ) : (
                      <>
                        <span 
                          className="text-sm text-muted-foreground flex-1 cursor-pointer hover:text-foreground"
                          onClick={() => setEditingBulletIndex({ sectionId: section.id, bulletIndex })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') setEditingBulletIndex({ sectionId: section.id, bulletIndex }); 
                          }}
                          aria-label={`Bullet point: ${bullet}. Click to edit.`}
                        >
                          {bullet}
                        </span>
                        <button
                          onClick={() => handleDeleteBullet(section.id, bulletIndex)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                          aria-label="Delete bullet point"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add Bullet */}
                {addingBulletToSection === section.id ? (
                  <div className="flex items-center gap-2 pl-4">
                    <Input
                      value={newBulletText}
                      onChange={(e) => setNewBulletText(e.target.value)}
                      placeholder="Add a key point..."
                      className="h-6 text-xs flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddBullet(section.id);
                        if (e.key === 'Escape') {
                          setAddingBulletToSection(null);
                          setNewBulletText('');
                        }
                      }}
                      aria-label="New bullet point"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleAddBullet(section.id)}
                      aria-label="Save bullet point"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setAddingBulletToSection(null);
                        setNewBulletText('');
                      }}
                      aria-label="Cancel adding bullet"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingBulletToSection(section.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pl-4"
                    aria-label="Add bullet point"
                  >
                    <Plus className="h-3 w-3" />
                    Add point
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Section Button */}
        <Button
          variant="outline"
          onClick={handleAddSection}
          className="w-full"
          aria-label="Add new section"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Generate Draft Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button 
          size="lg"
          onClick={onGenerateDraft}
          disabled={isGeneratingDraft || outline.sections.length === 0}
          aria-label="Generate full draft from outline"
        >
          {isGeneratingDraft ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Draft...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Full Draft
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default OutlineEditor;

