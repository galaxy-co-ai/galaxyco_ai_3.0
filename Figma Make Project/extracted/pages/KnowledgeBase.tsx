import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Search,
  Upload,
  FileText,
  FolderOpen,
  Star,
  Clock,
  Users,
  Sparkles,
  Filter,
  Download,
  ExternalLink,
  MoreVertical,
  Folder,
  File,
  Image,
  Video,
  Archive,
  Plus,
  Grid3x3,
  List,
  TrendingUp,
  Eye,
  BookOpen,
  Share2,
  ChevronRight,
  ChevronDown,
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";

interface KBDocument {
  id: string;
  name: string;
  type: "document" | "image" | "video" | "spreadsheet" | "presentation" | "pdf";
  folder: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  views: number;
  starred: boolean;
  tags: string[];
  aiGenerated: boolean;
  description?: string;
}

interface KBFolder {
  id: string;
  name: string;
  documentCount: number;
  color: string;
  icon: string;
  subfolders?: KBFolder[];
  isAIGenerated?: boolean;
}

const folders: KBFolder[] = [
  { 
    id: "ai-generated", 
    name: "AI Docs", 
    documentCount: 42, 
    color: "gradient", 
    icon: "sparkles",
    isAIGenerated: true,
    subfolders: [
      { id: "ai-1", name: "Meeting Notes", documentCount: 15, color: "blue", icon: "file-text" },
      { id: "ai-2", name: "Sales Proposals", documentCount: 8, color: "green", icon: "file-text" },
      { id: "ai-3", name: "Implementation Plans", documentCount: 12, color: "purple", icon: "file-text" },
      { id: "ai-4", name: "Email Summaries", documentCount: 7, color: "orange", icon: "file-text" },
    ]
  },
  { id: "1", name: "Projects", documentCount: 24, color: "blue", icon: "briefcase" },
  { id: "2", name: "Proposals", documentCount: 12, color: "green", icon: "file-text" },
  { id: "3", name: "Contracts", documentCount: 8, color: "purple", icon: "file-check" },
  { id: "4", name: "Training Materials", documentCount: 15, color: "orange", icon: "book-open" },
  { id: "5", name: "Client Resources", documentCount: 31, color: "pink", icon: "users" },
  { id: "6", name: "Marketing", documentCount: 19, color: "cyan", icon: "megaphone" },
];

const documents: KBDocument[] = [
  {
    id: "1",
    name: "TechCorp Implementation Plan.pdf",
    type: "pdf",
    folder: "Projects",
    uploadedBy: "AI Assistant",
    uploadedAt: "2 hours ago",
    size: "2.4 MB",
    views: 24,
    starred: true,
    tags: ["Implementation", "Q4 2025"],
    aiGenerated: true,
    description: "Comprehensive implementation roadmap with timeline and milestones"
  },
  {
    id: "2",
    name: "Q4 Sales Proposal Template.docx",
    type: "document",
    folder: "Proposals",
    uploadedBy: "Sarah Chen",
    uploadedAt: "1 day ago",
    size: "856 KB",
    views: 45,
    starred: true,
    tags: ["Sales", "Template"],
    aiGenerated: false,
    description: "Reusable proposal template for enterprise sales"
  },
  {
    id: "3",
    name: "Product Demo Recording.mp4",
    type: "video",
    folder: "Training Materials",
    uploadedBy: "Michael Rodriguez",
    uploadedAt: "2 days ago",
    size: "124 MB",
    views: 156,
    starred: false,
    tags: ["Demo", "Training"],
    aiGenerated: false,
    description: "Full platform walkthrough for new clients"
  },
  {
    id: "4",
    name: "API Integration Guide.pdf",
    type: "pdf",
    folder: "Client Resources",
    uploadedBy: "AI Assistant",
    uploadedAt: "3 days ago",
    size: "1.8 MB",
    views: 89,
    starred: true,
    tags: ["Technical", "API"],
    aiGenerated: true,
    description: "Step-by-step guide for API integration"
  },
  {
    id: "5",
    name: "Brand Guidelines 2025.pdf",
    type: "pdf",
    folder: "Marketing",
    uploadedBy: "Emma Thompson",
    uploadedAt: "1 week ago",
    size: "5.2 MB",
    views: 67,
    starred: false,
    tags: ["Brand", "Design"],
    aiGenerated: false,
    description: "Updated brand guidelines and visual identity"
  },
  {
    id: "6",
    name: "Client Onboarding Checklist.xlsx",
    type: "spreadsheet",
    folder: "Projects",
    uploadedBy: "AI Assistant",
    uploadedAt: "1 week ago",
    size: "234 KB",
    views: 112,
    starred: true,
    tags: ["Onboarding", "Process"],
    aiGenerated: true,
    description: "Automated onboarding workflow checklist"
  },
  {
    id: "7",
    name: "Enterprise Contract Template.pdf",
    type: "pdf",
    folder: "Contracts",
    uploadedBy: "James Park",
    uploadedAt: "2 weeks ago",
    size: "1.1 MB",
    views: 34,
    starred: false,
    tags: ["Legal", "Enterprise"],
    aiGenerated: false
  },
  {
    id: "8",
    name: "ROI Analysis Dashboard.xlsx",
    type: "spreadsheet",
    folder: "Client Resources",
    uploadedBy: "AI Assistant",
    uploadedAt: "2 weeks ago",
    size: "678 KB",
    views: 78,
    starred: true,
    tags: ["Analytics", "ROI"],
    aiGenerated: true,
    description: "Interactive ROI calculator for client presentations"
  }
];

const recentActivity = [
  { action: "uploaded", user: "AI Assistant", document: "TechCorp Implementation Plan.pdf", time: "2 hours ago" },
  { action: "viewed", user: "Sarah Chen", document: "API Integration Guide.pdf", time: "3 hours ago" },
  { action: "starred", user: "Michael Rodriguez", document: "Client Onboarding Checklist.xlsx", time: "5 hours ago" },
  { action: "uploaded", user: "Emma Thompson", document: "Brand Guidelines 2025.pdf", time: "1 day ago" },
];

export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<"all" | "starred" | "ai-generated">("all");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isRecentActivityExpanded, setIsRecentActivityExpanded] = useState(false);
  const [isAIRecommendationsExpanded, setIsAIRecommendationsExpanded] = useState(false);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.folder.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (activeFilter === "starred") return doc.starred;
    if (activeFilter === "ai-generated") return doc.aiGenerated;
    return true;
  });

  const getFileIcon = (type: KBDocument["type"]) => {
    switch (type) {
      case "pdf": return FileText;
      case "document": return FileText;
      case "image": return Image;
      case "video": return Video;
      case "spreadsheet": return FileText;
      case "presentation": return FileText;
      default: return File;
    }
  };

  const getFileColor = (type: KBDocument["type"]) => {
    switch (type) {
      case "pdf": return "from-red-500/10 to-red-500/20 text-red-500";
      case "document": return "from-blue-500/10 to-blue-500/20 text-blue-500";
      case "image": return "from-green-500/10 to-green-500/20 text-green-500";
      case "video": return "from-purple-500/10 to-purple-500/20 text-purple-500";
      case "spreadsheet": return "from-emerald-500/10 to-emerald-500/20 text-emerald-500";
      case "presentation": return "from-orange-500/10 to-orange-500/20 text-orange-500";
      default: return "from-gray-500/10 to-gray-500/20 text-gray-500";
    }
  };

  const totalDocuments = documents.length;
  const aiGeneratedCount = documents.filter(d => d.aiGenerated).length;
  const totalViews = documents.reduce((acc, doc) => acc + doc.views, 0);
  const starredCount = documents.filter(d => d.starred).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">
            Centralized repository for all company documentation
          </p>
        </div>
        <Button className="rounded-full shadow-lg">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Horizontal Stats Cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">{totalDocuments}</span>
                <span className="text-xs text-muted-foreground leading-none">Total Documents</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">{aiGeneratedCount}</span>
                <span className="text-xs text-muted-foreground leading-none">AI Generated</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">{totalViews.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground leading-none">Total Views</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">{starredCount}</span>
                <span className="text-xs text-muted-foreground leading-none">Starred Items</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Recommendations Banner */}
      <Collapsible open={isAIRecommendationsExpanded} onOpenChange={setIsAIRecommendationsExpanded}>
        <Card className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm whitespace-nowrap">AI-Recommended Documents</h3>
                  <p className="text-xs text-muted-foreground">Based on your recent activity</p>
                </div>
                
                {/* Quick chips inline */}
                {!isAIRecommendationsExpanded && documents.filter(d => d.aiGenerated).slice(0, 2).map((doc) => (
                  <Button
                    key={doc.id}
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-lg bg-white/60 backdrop-blur-sm border-white/80 hover:bg-white hover:shadow-md transition-all text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1.5 text-purple-500" />
                    {doc.name.length > 20 ? doc.name.substring(0, 20) + '...' : doc.name}
                  </Button>
                ))}
              </div>
              
              {/* Expanded content */}
              <CollapsibleContent className="mt-3 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Recommended for you</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {documents.filter(d => d.aiGenerated).map((doc) => (
                      <Button
                        key={doc.id}
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg bg-white/60 backdrop-blur-sm border-white/80 hover:bg-white hover:shadow-md transition-all text-xs"
                      >
                        <TrendingUp className="h-3 w-3 mr-1.5 text-purple-500" />
                        {doc.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-2">AI can help you create</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white/60 backdrop-blur-sm border-white/80 hover:bg-white hover:shadow-md transition-all text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1.5 text-blue-500" />
                      Meeting Summary
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white/60 backdrop-blur-sm border-white/80 hover:bg-white hover:shadow-md transition-all text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1.5 text-green-500" />
                      Sales Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white/60 backdrop-blur-sm border-white/80 hover:bg-white hover:shadow-md transition-all text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1.5 text-orange-500" />
                      Project Brief
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white/60 backdrop-blur-sm border-white/80 hover:bg-white hover:shadow-md transition-all text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1.5 text-purple-500" />
                      Customer Analysis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white/60 backdrop-blur-sm border-white/80 hover:bg-white hover:shadow-md transition-all text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1.5 text-pink-500" />
                      Product Roadmap
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-lg flex-shrink-0">
                {isAIRecommendationsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </Card>
      </Collapsible>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1 p-0 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl overflow-hidden">
          <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm">Folders</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[600px]">
            <div className="p-3 space-y-1.5">
              {!isRecentActivityExpanded ? (
                folders.map((folder) => {
                  const folderColors: Record<string, string> = {
                    blue: 'from-blue-500/10 to-blue-500/20 text-blue-600',
                    green: 'from-green-500/10 to-green-500/20 text-green-600',
                    purple: 'from-purple-500/10 to-purple-500/20 text-purple-600',
                    orange: 'from-orange-500/10 to-orange-500/20 text-orange-600',
                    pink: 'from-pink-500/10 to-pink-500/20 text-pink-600',
                    cyan: 'from-cyan-500/10 to-cyan-500/20 text-cyan-600',
                    gradient: 'from-purple-500/10 via-blue-500/10 to-cyan-500/20 text-purple-600'
                  };
                  const isExpanded = expandedFolders.has(folder.id);
                  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
                  
                  return (
                    <div key={folder.id}>
                      <button
                        className="w-full p-2.5 rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all text-left group"
                        onClick={() => {
                          if (hasSubfolders) {
                            setExpandedFolders(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(folder.id)) {
                                newSet.delete(folder.id);
                              } else {
                                newSet.add(folder.id);
                              }
                              return newSet;
                            });
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${folderColors[folder.color]} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                            {folder.isAIGenerated ? (
                              <Sparkles className="h-4 w-4" />
                            ) : (
                              <Folder className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate group-hover:text-primary transition-colors">{folder.name}</p>
                            <p className="text-xs text-muted-foreground">{folder.documentCount} documents</p>
                          </div>
                          {hasSubfolders && (
                            <div className="shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                      
                      {/* Subfolders */}
                      {hasSubfolders && isExpanded && (
                        <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-2">
                          {folder.subfolders!.map((subfolder) => (
                            <button
                              key={subfolder.id}
                              className="w-full p-2 rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all text-left group"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-7 w-7 rounded-md bg-gradient-to-br ${folderColors[subfolder.color]} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                  <Folder className="h-3 w-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs truncate group-hover:text-primary transition-colors">{subfolder.name}</p>
                                  <p className="text-xs text-muted-foreground">{subfolder.documentCount} docs</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <button
                  className="w-full p-2.5 rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all text-left group"
                  onClick={() => setIsRecentActivityExpanded(false)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm group-hover:text-primary transition-colors">Folders</p>
                      <p className="text-xs text-muted-foreground">{folders.length} folders</p>
                    </div>
                    <div className="shrink-0">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="p-4 border-t mt-2 bg-gradient-to-br from-muted/20 to-transparent">
              <button
                className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
                onClick={() => setIsRecentActivityExpanded(!isRecentActivityExpanded)}
              >
                <h3 className="text-sm">Recent Activity</h3>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {isRecentActivityExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>
              {isRecentActivityExpanded && (
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => {
                    const activityIcons: Record<string, any> = {
                      uploaded: Upload,
                      viewed: Eye,
                      starred: Star
                    };
                    const ActivityIcon = activityIcons[activity.action] || FileText;
                    return (
                      <div key={idx} className="flex gap-2">
                        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ActivityIcon className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground leading-tight">
                            <span className="text-foreground">{activity.user}</span> {activity.action}
                          </p>
                          <p className="text-xs text-foreground truncate leading-tight mt-0.5">{activity.document}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filters */}
          <Card className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setActiveFilter("all")}>
                      All Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("starred")}>
                      <Star className="h-4 w-4 mr-2" />
                      Starred Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("ai-generated")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Generated
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-1 border border-border/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 ${viewMode === "grid" ? "bg-muted" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 ${viewMode === "list" ? "bg-muted" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <ScrollArea className="h-[600px]">
            {viewMode === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.type);
                  const colorClass = getFileColor(doc.type);

                  return (
                    <Card
                      key={doc.id}
                      className="p-3 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl hover:shadow-[0_6px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer group relative"
                    >
                      {/* Header: Icon + Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                          <FileIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {doc.starred && (
                            <div className="h-5 w-5 rounded-md bg-yellow-50 flex items-center justify-center">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            </div>
                          )}
                          {doc.aiGenerated && (
                            <div className="h-5 w-5 rounded-md bg-purple-50 flex items-center justify-center">
                              <Sparkles className="h-3 w-3 text-purple-500" />
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem>
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-3.5 w-3.5 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="h-3.5 w-3.5 mr-2" />
                                {doc.starred ? "Unstar" : "Star"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-3.5 w-3.5 mr-2" />
                                Share
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* File Name */}
                      <div className="mb-2">
                        <p className="text-sm truncate group-hover:text-primary transition-colors leading-tight">{doc.name}</p>
                        <Badge variant="outline" className="text-[10px] border-0 bg-muted/50 rounded mt-1 h-4 px-1.5">
                          {doc.type.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Tags */}
                      {doc.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          {doc.tags.slice(0, 1).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] border-0 bg-gradient-to-br from-muted to-muted/50 rounded h-4 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 1 && (
                            <Badge variant="outline" className="text-[10px] border-0 bg-gradient-to-br from-muted to-muted/50 rounded h-4 px-1.5">
                              +{doc.tags.length - 1}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Footer: Metadata */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t gap-2">
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Eye className="h-3 w-3" />
                          <span>{doc.views}</span>
                        </div>
                        <span className="truncate flex-1 text-center">{doc.size}</span>
                        <span className="flex-shrink-0">{doc.uploadedAt}</span>
                      </div>
                      
                      {/* Uploader */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1.5">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px] bg-gradient-to-br from-primary/10 to-primary/5">
                            {doc.uploadedBy.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{doc.uploadedBy}</span>
                      </div>

                      {/* Quick Preview Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-2 right-2 h-6 w-6 p-0 rounded-full bg-primary/10 hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                                <FileIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {doc.name}
                                  {doc.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                  {doc.aiGenerated && <Sparkles className="h-4 w-4 text-purple-500" />}
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {doc.type.toUpperCase()}
                                </Badge>
                              </div>
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                              Document preview and details
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            {/* Description */}
                            {doc.description && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Description</p>
                                <p className="text-sm">{doc.description}</p>
                              </div>
                            )}
                            
                            {/* Tags */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Tags</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {doc.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Uploaded By</p>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5">
                                      {doc.uploadedBy.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{doc.uploadedBy}</span>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Upload Date</p>
                                <p>{doc.uploadedAt}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">File Size</p>
                                <p>{doc.size}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Views</p>
                                <div className="flex items-center gap-1.5">
                                  <Eye className="h-4 w-4" />
                                  <span>{doc.views}</span>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Folder</p>
                                <p>{doc.folder}</p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t">
                              <Button className="flex-1" size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Document
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.type);
                  const colorClass = getFileColor(doc.type);

                  return (
                    <Card
                      key={doc.id}
                      className="p-3 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl hover:shadow-[0_6px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                          <FileIcon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="truncate text-sm group-hover:text-primary transition-colors">{doc.name}</p>
                            {doc.starred && (
                              <div className="h-5 w-5 rounded bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              </div>
                            )}
                            {doc.aiGenerated && (
                              <div className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center shrink-0">
                                <Sparkles className="h-3 w-3 text-purple-500" />
                              </div>
                            )}
                            <Badge variant="outline" className="bg-muted border-0 text-xs rounded shrink-0">
                              {doc.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Folder className="h-3 w-3" />
                              <span>{doc.folder}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px] bg-gradient-to-br from-primary/10 to-primary/5">
                                  {doc.uploadedBy.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{doc.uploadedBy}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{doc.uploadedAt}</span>
                            </div>
                            <span>•</span>
                            <span>{doc.size}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{doc.views}</span>
                            </div>
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" className="h-8 rounded-lg">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Open
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="h-4 w-4 mr-2" />
                                {doc.starred ? "Unstar" : "Star"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredDocuments.length === 0 && (
              <Card className="p-12 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl text-center">
                <div className="max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2">
                    {searchQuery ? "No documents found" : "No documents yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchQuery 
                      ? "Try adjusting your search or filter criteria"
                      : "Upload files or let AI Assistant create documents for you"
                    }
                  </p>
                  {!searchQuery && (
                    <div className="flex items-center justify-center gap-3">
                      <Button className="rounded-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                      <Button variant="outline" className="rounded-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Ask AI to Create
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
