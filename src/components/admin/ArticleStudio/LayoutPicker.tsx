"use client";

import { 
  FileText, 
  ListOrdered, 
  List, 
  TrendingUp, 
  Star, 
  Newspaper, 
  MessageSquare,
  Check,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  getAllLayouts, 
  layoutColorClasses, 
  type LayoutTemplate 
} from '@/lib/ai/article-layouts';

interface LayoutPickerProps {
  selectedLayout?: LayoutTemplate['id'];
  onSelect: (layoutId: LayoutTemplate['id']) => void;
  onContinue?: () => void;
  showContinueButton?: boolean;
}

// Map layout icons to Lucide components
const layoutIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'FileText': FileText,
  'ListOrdered': ListOrdered,
  'List': List,
  'TrendingUp': TrendingUp,
  'Star': Star,
  'Newspaper': Newspaper,
  'MessageSquare': MessageSquare,
};

export function LayoutPicker({ 
  selectedLayout, 
  onSelect, 
  onContinue,
  showContinueButton = true 
}: LayoutPickerProps) {
  const layouts = getAllLayouts();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Choose Your Article Structure</h2>
        <p className="text-muted-foreground">
          Select the layout that best fits your content. This determines the outline structure.
        </p>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {layouts.map((layout) => {
          const IconComponent = layoutIcons[layout.icon] || FileText;
          const colorClasses = layoutColorClasses[layout.id];
          const isSelected = selectedLayout === layout.id;

          return (
            <button
              key={layout.id}
              onClick={() => onSelect(layout.id)}
              className="text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
              aria-label={`Select ${layout.name} layout`}
              aria-pressed={isSelected}
            >
              <Card 
                className={cn(
                  "h-full transition-all duration-200 cursor-pointer relative overflow-hidden",
                  isSelected 
                    ? "ring-2 ring-primary shadow-md" 
                    : "hover:shadow-sm hover:border-gray-300"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors",
                      colorClasses.bg
                    )}
                  >
                    <IconComponent className={cn("h-5 w-5", colorClasses.text)} />
                  </div>
                  <CardTitle className="text-base">{layout.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {layout.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {layout.bestFor.slice(0, 2).map((use, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className={cn("text-[10px] px-1.5 py-0", colorClasses.border, colorClasses.text)}
                      >
                        {use}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{layout.sections.filter(s => s.isRequired).length}</span> sections
                    <span className="mx-1">•</span>
                    <span className="font-medium">~{layout.totalWordCountTarget}</span> words
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Selected Layout Details */}
      {selectedLayout && (
        <LayoutPreview layoutId={selectedLayout} />
      )}

      {/* Continue Button */}
      {showContinueButton && selectedLayout && onContinue && (
        <div className="flex justify-end pt-4">
          <Button onClick={onContinue} size="lg">
            Continue to Outline
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Layout Preview Component - Shows details of selected layout
interface LayoutPreviewProps {
  layoutId: LayoutTemplate['id'];
}

function LayoutPreview({ layoutId }: LayoutPreviewProps) {
  const layouts = getAllLayouts();
  const layout = layouts.find(l => l.id === layoutId);
  
  if (!layout) return null;

  const colorClasses = layoutColorClasses[layout.id];
  const IconComponent = layoutIcons[layout.icon] || FileText;

  return (
    <Card className={cn("border-2", colorClasses.border)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses.bg)}>
            <IconComponent className={cn("h-5 w-5", colorClasses.text)} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{layout.name}</CardTitle>
            <CardDescription>{layout.description}</CardDescription>
          </div>
          <Badge variant="outline" className={cn(colorClasses.bg, colorClasses.text, colorClasses.border)}>
            Selected
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Example Title */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Example:</p>
          <p className="text-sm font-medium">{layout.exampleTitle}</p>
        </div>

        {/* Sections Preview */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">SECTIONS</p>
          <div className="flex flex-wrap gap-2">
            {layout.sections.map((section, index) => (
              <div 
                key={section.id}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                  section.isRequired 
                    ? "bg-muted text-foreground" 
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="w-4 h-4 rounded-full bg-background flex items-center justify-center text-[10px] font-medium">
                  {index + 1}
                </span>
                <span>{section.title}</span>
                {!section.isRequired && (
                  <span className="text-[10px] text-muted-foreground">(opt)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Elements & Best For */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">RECOMMENDED ELEMENTS</p>
            <ul className="space-y-1">
              {layout.recommendedElements.map((element, index) => (
                <li key={index} className="text-xs flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", colorClasses.text.replace('text-', 'bg-'))} />
                  {element}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">BEST FOR</p>
            <ul className="space-y-1">
              {layout.bestFor.map((use, index) => (
                <li key={index} className="text-xs flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", colorClasses.text.replace('text-', 'bg-'))} />
                  {use}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LayoutPicker;

