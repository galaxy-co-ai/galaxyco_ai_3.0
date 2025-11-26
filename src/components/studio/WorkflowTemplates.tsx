import { useState } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from "../ui/sheet";
import { 
  Mail, 
  Calendar, 
  FileText, 
  Database, 
  MessageSquare,
  ShoppingCart,
  Users,
  TrendingUp,
  Search,
  LayoutTemplate,
  Sparkles,
  Check
} from "lucide-react";
import { logger } from "@/lib/logger";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  gradient: string;
  category: string;
  nodes: number;
  useCase: string;
  isPro?: boolean;
}

const templates: WorkflowTemplate[] = [
  {
    id: "email-invoice",
    name: "Invoice Processing",
    description: "Automatically extract invoice data from emails and add to accounting software",
    icon: Mail,
    gradient: "from-blue-500 to-cyan-500",
    category: "Finance",
    nodes: 5,
    useCase: "Extract invoice details from emails, validate data, and sync to QuickBooks"
  },
  {
    id: "meeting-notes",
    name: "Meeting Transcription",
    description: "Transcribe meetings, generate summaries, and share with team",
    icon: Calendar,
    gradient: "from-purple-500 to-pink-500",
    category: "Productivity",
    nodes: 4,
    useCase: "Record calls, transcribe audio, create summary, and send to Slack"
  },
  {
    id: "lead-enrichment",
    name: "Lead Enrichment",
    description: "Enrich new leads with company data and add to CRM",
    icon: Users,
    gradient: "from-orange-500 to-red-500",
    category: "Sales",
    nodes: 6,
    useCase: "New lead → Enrich with data → Score → Add to Salesforce",
    isPro: true
  },
  {
    id: "customer-support",
    name: "Support Ticket Triage",
    description: "Classify support tickets and route to the right team",
    icon: MessageSquare,
    gradient: "from-green-500 to-emerald-500",
    category: "Support",
    nodes: 5,
    useCase: "Ticket received → AI classification → Priority scoring → Team routing"
  },
  {
    id: "social-monitoring",
    name: "Social Media Monitor",
    description: "Monitor brand mentions and respond automatically",
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-500",
    category: "Marketing",
    nodes: 4,
    useCase: "Monitor mentions → Sentiment analysis → Alert team → Auto-respond",
    isPro: true
  },
  {
    id: "document-gen",
    name: "Document Generator",
    description: "Generate contracts, proposals, and reports from templates",
    icon: FileText,
    gradient: "from-indigo-500 to-purple-500",
    category: "Productivity",
    nodes: 3,
    useCase: "Input data → Fill template → Generate PDF → Send for signature"
  },
  {
    id: "data-sync",
    name: "CRM Data Sync",
    description: "Keep customer data synchronized across platforms",
    icon: Database,
    gradient: "from-cyan-500 to-blue-500",
    category: "Integration",
    nodes: 4,
    useCase: "Detect changes → Transform data → Validate → Sync to CRM"
  },
  {
    id: "order-processing",
    name: "Order Processing",
    description: "Automate order fulfillment workflow from cart to shipping",
    icon: ShoppingCart,
    gradient: "from-amber-500 to-orange-500",
    category: "E-commerce",
    nodes: 7,
    useCase: "New order → Validate → Check inventory → Create shipment → Notify customer",
    isPro: true
  }
];

const categories = ["All", "Finance", "Sales", "Marketing", "Support", "Productivity", "Integration", "E-commerce"];

export function WorkflowTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isOpen, setIsOpen] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.useCase.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (templateId: string) => {
    logger.debug("Using template", { templateId });
    setIsOpen(false);
    // In a real app, this would load the template into the canvas
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 shadow-[0_2px_8px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_16px_rgb(0,0,0,0.08)]">
          <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
          Templates
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <LayoutTemplate className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle>Workflow Templates</SheetTitle>
              <SheetDescription>
                Start with pre-built workflows and customize to your needs
              </SheetDescription>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 shadow-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="h-7 text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </SheetHeader>

        {/* Templates Grid */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No templates found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group relative rounded-xl border bg-white p-5 hover:shadow-lg transition-all hover:border-blue-200"
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <template.icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.isPro && (
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700">
                              Pro
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 text-xs">
                          {template.nodes} nodes
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>

                      {/* Use Case */}
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Workflow:</p>
                        <p className="text-xs font-mono">{template.useCase}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                          className="h-8"
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/30">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Can't find what you need?</p>
              <p className="text-xs text-muted-foreground">
                Describe your workflow to the AI Assistant and it will build it for you
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
