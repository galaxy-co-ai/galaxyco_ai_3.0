"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  FileText, 
  Folder, 
  Star, 
  Clock, 
  Users, 
  Sparkles, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Plus, 
  Filter,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  File,
  Image as ImageIcon,
  Video,
  ArrowUpRight,
  MessageSquare,
  Info,
  Command,
  CornerDownRight,
  FolderOpen,
  Eye
} from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
} from "../components/ui/context-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card } from "../components/ui/card";

// --- Types ---

interface KBDocument {
  id: string;
  name: string;
  type: "document" | "image" | "video" | "spreadsheet" | "presentation" | "pdf";
  folderId: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  views: number;
  starred: boolean;
  tags: string[];
  aiGenerated: boolean;
  description?: string;
  lastModified?: string;
  sharedWith?: string[];
}

interface KBFolder {
  id: string;
  name: string;
  icon?: React.ReactNode;
  type: "system" | "user" | "smart";
  count?: number;
  children?: KBFolder[];
  color?: string;
}

// --- Mock Data ---

const folders: KBFolder[] = [
  { 
    id: "recent", 
    name: "Recent", 
    type: "smart", 
    icon: <Clock className="h-4 w-4" />,
    count: 12
  },
  { 
    id: "starred", 
    name: "Starred", 
    type: "smart", 
    icon: <Star className="h-4 w-4" />,
    count: 5
  },
  { 
    id: "shared", 
    name: "Shared with me", 
    type: "smart", 
    icon: <Users className="h-4 w-4" />,
    count: 8
  },
  { 
    id: "ai-gen", 
    name: "AI Generated", 
    type: "smart", 
    icon: <Sparkles className="h-4 w-4" />,
    count: 42,
    color: "text-purple-500"
  },
  {
    id: "projects",
    name: "Projects",
    type: "user",
    count: 24,
    children: [
      { id: "proj-alpha", name: "Project Alpha", type: "user", count: 10 },
      { id: "proj-beta", name: "Project Beta", type: "user", count: 14 }
    ]
  },
  { id: "proposals", name: "Proposals", type: "user", count: 12 },
  { id: "contracts", name: "Contracts", type: "user", count: 8 },
  { id: "marketing", name: "Marketing", type: "user", count: 19 },
  { id: "legal", name: "Legal & Compliance", type: "user", count: 15 },
];

const documents: KBDocument[] = [
  {
    id: "1",
    name: "TechCorp Implementation Plan.pdf",
    type: "pdf",
    folderId: "proj-alpha",
    uploadedBy: "AI Assistant",
    uploadedAt: "2 hours ago",
    size: "2.4 MB",
    views: 24,
    starred: true,
    tags: ["Implementation", "Q4 2025"],
    aiGenerated: true,
    description: "Comprehensive implementation roadmap with timeline and milestones.",
    lastModified: "10 mins ago"
  },
  {
    id: "2",
    name: "Q4 Sales Proposal Template.docx",
    type: "document",
    folderId: "proposals",
    uploadedBy: "Sarah Chen",
    uploadedAt: "1 day ago",
    size: "856 KB",
    views: 45,
    starred: true,
    tags: ["Sales", "Template"],
    aiGenerated: false,
    description: "Reusable proposal template for enterprise sales."
  },
  {
    id: "3",
    name: "Product Demo Recording.mp4",
    type: "video",
    folderId: "marketing",
    uploadedBy: "Michael Rodriguez",
    uploadedAt: "2 days ago",
    size: "124 MB",
    views: 156,
    starred: false,
    tags: ["Demo", "Training"],
    aiGenerated: false,
    description: "Full platform walkthrough for new clients."
  },
  {
    id: "4",
    name: "API Integration Guide.pdf",
    type: "pdf",
    folderId: "projects",
    uploadedBy: "AI Assistant",
    uploadedAt: "3 days ago",
    size: "1.8 MB",
    views: 89,
    starred: true,
    tags: ["Technical", "API"],
    aiGenerated: true,
    description: "Step-by-step guide for API integration."
  },
  {
    id: "5",
    name: "Brand Guidelines 2025.pdf",
    type: "pdf",
    folderId: "marketing",
    uploadedBy: "Emma Thompson",
    uploadedAt: "1 week ago",
    size: "5.2 MB",
    views: 67,
    starred: false,
    tags: ["Brand", "Design"],
    aiGenerated: false,
    description: "Updated brand guidelines and visual identity."
  },
  {
    id: "6",
    name: "Client Onboarding Checklist.xlsx",
    type: "spreadsheet",
    folderId: "proj-beta",
    uploadedBy: "AI Assistant",
    uploadedAt: "1 week ago",
    size: "234 KB",
    views: 112,
    starred: true,
    tags: ["Onboarding", "Process"],
    aiGenerated: true,
    description: "Automated onboarding workflow checklist."
  },
  {
    id: "7",
    name: "Enterprise Contract Template.pdf",
    type: "pdf",
    folderId: "contracts",
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
    folderId: "proposals",
    uploadedBy: "AI Assistant",
    uploadedAt: "2 weeks ago",
    size: "678 KB",
    views: 78,
    starred: true,
    tags: ["Analytics", "ROI"],
    aiGenerated: true,
    description: "Interactive ROI calculator for client presentations."
  }
];

// --- Helper Functions ---

const getFileIcon = (type: KBDocument["type"]) => {
  switch (type) {
    case "pdf": return FileText;
    case "document": return FileText;
    case "image": return ImageIcon;
    case "video": return Video;
    case "spreadsheet": return FileText;
    case "presentation": return FileText;
    default: return File;
  }
};

const getFileColor = (type: KBDocument["type"]) => {
  switch (type) {
    case "pdf": return "text-red-500";
    case "document": return "text-blue-500";
    case "image": return "text-green-500";
    case "video": return "text-purple-500";
    case "spreadsheet": return "text-emerald-500";
    case "presentation": return "text-orange-500";
    default: return "text-gray-500";
  }
};

// --- Main Component ---

interface KnowledgeBaseProps {
  initialCollections?: Array<{
    id: string;
    name: string;
    description: string;
    itemCount: number;
    color?: string | null;
    icon?: string | null;
  }>;
  initialItems?: Array<{
    id: string;
    name: string;
    type: string;
    project: string;
    createdBy: string;
    createdAt: string;
    size: string;
    description: string;
  }>;
}

export function KnowledgeBase({ 
  initialCollections = [],
  initialItems = []
}: KnowledgeBaseProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("recent");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["projects"]));
  const [collapsedPreview, setCollapsedPreview] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Use provided data or fallback to mock data
  const [collectionsList] = useState(initialCollections.length > 0 ? initialCollections.map(col => ({
    id: col.id,
    name: col.name,
    type: 'user' as const,
    count: col.itemCount,
    color: col.color || undefined,
  })) : folders);
  const [documentsList] = useState(initialItems.length > 0 ? initialItems.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type.toLowerCase() as any,
    folderId: item.project === 'Uncategorized' ? 'recent' : item.project.toLowerCase().replace(/\s+/g, '-'),
    uploadedBy: item.createdBy,
    uploadedAt: item.createdAt,
    size: item.size,
    views: 0,
    starred: false,
    tags: [],
    aiGenerated: false,
    description: item.description,
  })) : documents);

  // Filter logic
  const filteredDocs = useMemo(() => {
    let docs = documentsList;
    
    // Folder filter
    if (selectedFolderId === "recent") {
      // In a real app, sort by date
    } else if (selectedFolderId === "starred") {
      docs = docs.filter(d => d.starred);
    } else if (selectedFolderId === "ai-gen") {
      docs = docs.filter(d => d.aiGenerated);
    } else if (selectedFolderId === "shared") {
      // Mock logic for shared
      docs = docs.filter(d => parseInt(d.id) % 2 === 0);
    } else {
      // Specific folder
      docs = docs.filter(d => d.folderId === selectedFolderId);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return docs;
  }, [selectedFolderId, searchQuery, documentsList]);

  const selectedDoc = documentsList.find(d => d.id === selectedDocId);

  const toggleFolder = (folderId: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderId)) {
      newSet.delete(folderId);
    } else {
      newSet.add(folderId);
    }
    setExpandedFolders(newSet);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* --- Header: AI Command Center --- */}
      <div className="h-16 border-b flex items-center px-4 gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 text-primary font-semibold mr-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Command className="h-4 w-4" />
          </div>
          Knowledge
        </div>
        
        <div className="flex-1 max-w-2xl relative group mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
          </div>
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary/20 transition-all shadow-sm"
            placeholder="Ask AI or search documents..." 
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded border border-border/50">⌘K</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* --- Main Content: Resizable Layout --- */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          
          {/* Left Sidebar: Navigation */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-muted/10">
            <div className="h-full flex flex-col">
              <div className="p-4 pb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Library</h3>
                <nav className="space-y-1">
                  {folders.filter(f => f.type === "smart").map(folder => (
                    <Button
                      key={folder.id}
                      variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={cn(
                        "w-full justify-between font-normal",
                        selectedFolderId === folder.id && "bg-primary/10 text-primary hover:bg-primary/15"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={folder.color}>{folder.icon}</span>
                        {folder.name}
                      </div>
                      {folder.count && (
                        <span className="text-xs text-muted-foreground">{folder.count}</span>
                      )}
                    </Button>
                  ))}
                </nav>
              </div>
              
              <Separator className="my-2" />
              
              <div className="p-4 pt-0 flex-1 overflow-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Folders</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {folders.filter(f => f.type === "user").map(folder => (
                    <div key={folder.id}>
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <Button
                            variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedFolderId(folder.id)}
                            className={cn(
                              "w-full justify-start font-normal mb-1",
                              selectedFolderId === folder.id && "bg-muted font-medium"
                            )}
                          >
                            {folder.children ? (
                              <div 
                                role="button"
                                className="p-1 mr-1 hover:bg-background rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFolder(folder.id);
                                }}
                              >
                                {expandedFolders.has(folder.id) ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ) : (
                              <div className="w-6" /> // Spacer
                            )}
                            {expandedFolders.has(folder.id) ? (
                               <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                            ) : (
                               <Folder className="h-4 w-4 mr-2 text-blue-500/70" />
                            )}
                            
                            <span className="truncate">{folder.name}</span>
                          </Button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem>Rename</ContextMenuItem>
                          <ContextMenuItem>Move</ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem className="text-red-500">Delete</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>

                      {/* Subfolders */}
                      {folder.children && expandedFolders.has(folder.id) && (
                        <div className="ml-6 space-y-1 border-l pl-2 border-border/50">
                          {folder.children.map(child => (
                            <Button
                              key={child.id}
                              variant={selectedFolderId === child.id ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => setSelectedFolderId(child.id)}
                              className={cn(
                                "w-full justify-start font-normal h-8 text-xs",
                                selectedFolderId === child.id && "bg-muted"
                              )}
                            >
                              <Folder className="h-3 w-3 mr-2 text-muted-foreground" />
                              {child.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t bg-muted/20">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-200">
                     <Badge variant="secondary" className="rounded-full h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500 text-white font-bold text-xs">
                       85%
                     </Badge>
                   </div>
                   <div>
                     <p className="text-xs font-medium">Storage Used</p>
                     <p className="text-[10px] text-muted-foreground">12.4 GB of 15 GB</p>
                   </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Middle: Document List */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="h-10 border-b flex items-center px-4 justify-between bg-background/50">
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{filteredDocs.length} items</span>
                  <Separator orientation="vertical" className="h-3 mx-3" />
                  <span className="flex items-center gap-1">
                    Sort by: Name <ChevronDown className="h-3 w-3" />
                  </span>
                </div>
                <div className="flex items-center gap-1">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className={cn("h-7 w-7", viewMode === "grid" && "bg-muted/50 text-foreground")}
                     onClick={() => setViewMode("grid")}
                   >
                     <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className={cn("h-7 w-7", viewMode === "list" && "bg-muted/50 text-foreground")}
                     onClick={() => setViewMode("list")}
                   >
                     <ListIcon className="h-4 w-4 text-muted-foreground" />
                   </Button>
                </div>
              </div>

              {/* List Header (Only for List View) */}
              {viewMode === "list" && (
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 border-b bg-muted/5 text-xs font-medium text-muted-foreground">
                  <div className="w-6"></div>
                  <div>Name</div>
                  <div className="w-24">Size</div>
                  <div className="w-32">Modified</div>
                  <div className="w-8"></div>
                </div>
              )}

              {/* Documents Content */}
              <ScrollArea className="flex-1">
                <div className="p-1">
                  {viewMode === "list" ? (
                    // LIST VIEW
                    <div className="flex flex-col">
                      {filteredDocs.map(doc => {
                        const Icon = getFileIcon(doc.type);
                        const iconColor = getFileColor(doc.type);
                        const isSelected = selectedDocId === doc.id;

                        return (
                          <ContextMenu key={doc.id}>
                            <ContextMenuTrigger>
                              <div 
                                onClick={() => setSelectedDocId(doc.id)}
                                onDoubleClick={() => setCollapsedPreview(false)}
                                className={cn(
                                  "grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 items-center border-b border-border/30 cursor-pointer group transition-colors text-sm hover:bg-muted/50",
                                  isSelected && "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/50"
                                )}
                              >
                                <div className="w-6 flex justify-center">
                                  <Icon className={cn("h-4 w-4", iconColor)} />
                                </div>
                                
                                <div className="min-w-0 flex items-center gap-2">
                                  <span className={cn("truncate font-medium", isSelected && "text-primary")}>{doc.name}</span>
                                  {doc.starred && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                                  {doc.aiGenerated && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-purple-100 text-purple-700 border-0">
                                      AI
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="text-xs text-muted-foreground w-24">{doc.size}</div>
                                
                                <div className="text-xs text-muted-foreground w-32 truncate">
                                  {doc.uploadedAt}
                                </div>
                                
                                <div className="w-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>Open</DropdownMenuItem>
                                      <DropdownMenuItem>Download</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuLabel>{doc.name}</ContextMenuLabel>
                              <ContextMenuSeparator />
                              <ContextMenuItem>Open</ContextMenuItem>
                              <ContextMenuItem>Download</ContextMenuItem>
                              <ContextMenuItem>Rename</ContextMenuItem>
                              <ContextMenuItem>
                                <Star className="h-3 w-3 mr-2" /> {doc.starred ? "Unstar" : "Star"}
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem className="text-purple-500">
                                <Sparkles className="h-3 w-3 mr-2" /> Ask AI about this
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem className="text-red-500">Delete</ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                    </div>
                  ) : (
                    // GRID VIEW
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                      {filteredDocs.map(doc => {
                        const Icon = getFileIcon(doc.type);
                        const iconColor = getFileColor(doc.type);
                        const isSelected = selectedDocId === doc.id;

                        return (
                           <ContextMenu key={doc.id}>
                            <ContextMenuTrigger>
                              <Card
                                onClick={() => setSelectedDocId(doc.id)}
                                onDoubleClick={() => setCollapsedPreview(false)}
                                className={cn(
                                  "p-4 flex flex-col gap-3 cursor-pointer group transition-all hover:shadow-md border-muted",
                                  isSelected && "ring-2 ring-primary ring-offset-2 border-primary"
                                )}
                              >
                                <div className="flex justify-between items-start">
                                   <div className={cn("h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center", iconColor.replace("text-", "bg-").replace("500", "100"))}>
                                      <Icon className={cn("h-5 w-5", iconColor)} />
                                   </div>
                                   {doc.starred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                                </div>
                                
                                <div>
                                  <h4 className={cn("text-sm font-medium truncate mb-1", isSelected && "text-primary")}>{doc.name}</h4>
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{doc.size}</span>
                                    <span>{doc.uploadedAt}</span>
                                  </div>
                                </div>
                                
                                {doc.aiGenerated && (
                                   <div className="pt-2 border-t mt-auto flex items-center gap-1.5 text-[10px] text-purple-600">
                                      <Sparkles className="h-3 w-3" />
                                      AI Generated
                                   </div>
                                )}
                              </Card>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuLabel>{doc.name}</ContextMenuLabel>
                              <ContextMenuSeparator />
                              <ContextMenuItem>Open</ContextMenuItem>
                              <ContextMenuItem>Download</ContextMenuItem>
                              <ContextMenuItem>Rename</ContextMenuItem>
                              <ContextMenuItem>
                                <Star className="h-3 w-3 mr-2" /> {doc.starred ? "Unstar" : "Star"}
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem className="text-purple-500">
                                <Sparkles className="h-3 w-3 mr-2" /> Ask AI about this
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem className="text-red-500">Delete</ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />
          
          {/* Right: Preview & AI Panel */}
          <ResizablePanel 
            defaultSize={30} 
            minSize={20} 
            collapsible={true} 
            collapsedSize={0}
            onCollapse={() => setCollapsedPreview(true)}
            onExpand={() => setCollapsedPreview(false)}
            className={cn("bg-muted/5", collapsedPreview && "min-w-[0px]")}
          >
            {selectedDoc ? (
              <div className="h-full flex flex-col">
                {/* Preview Header */}
                <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
                  <div className="flex items-center gap-2 overflow-hidden">
                     {/* Icon */}
                     {(() => {
                        const Icon = getFileIcon(selectedDoc.type);
                        return <Icon className={cn("h-4 w-4", getFileColor(selectedDoc.type))} />;
                     })()}
                     <span className="font-medium truncate text-sm">{selectedDoc.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                       <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Tabs: Preview / Info / AI Chat */}
                <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 pt-2">
                    <TabsList className="w-full grid grid-cols-3 h-9">
                      <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                      <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                      <TabsTrigger value="ai" className="text-xs flex gap-1">
                        <Sparkles className="h-3 w-3" /> Chat
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="preview" className="flex-1 p-4 overflow-hidden mt-0">
                    <div className="h-full w-full bg-background border rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden group">
                       <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(to_bottom_right,white,transparent)]" />
                       
                       <div className="text-center z-10 p-6">
                          {(() => {
                             const Icon = getFileIcon(selectedDoc.type);
                             return (
                               <div className={cn("h-20 w-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center", getFileColor(selectedDoc.type).replace('text-', 'bg-').replace('500', '100'))}>
                                 <Icon className={cn("h-10 w-10", getFileColor(selectedDoc.type))} />
                               </div>
                             );
                          })()}
                          <h3 className="font-medium mb-1">{selectedDoc.name}</h3>
                          <p className="text-xs text-muted-foreground mb-4">{selectedDoc.size} • {selectedDoc.type.toUpperCase()}</p>
                          <Button size="sm" variant="outline">
                             <Eye className="h-3.5 w-3.5 mr-2" />
                             Open Viewer
                          </Button>
                       </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="flex-1 overflow-auto mt-0">
                    <div className="p-4 space-y-6">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Description</h4>
                        <p className="text-sm leading-relaxed text-foreground/90">
                          {selectedDoc.description || "No description provided."}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Properties</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Owner</dt>
                            <dd className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">{selectedDoc.uploadedBy.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {selectedDoc.uploadedBy}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Created</dt>
                            <dd>{selectedDoc.uploadedAt}</dd>
                          </div>
                           <div className="flex justify-between">
                            <dt className="text-muted-foreground">Views</dt>
                            <dd>{selectedDoc.views}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <Separator />
                      
                      <div>
                         <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tags</h4>
                         <div className="flex flex-wrap gap-1.5">
                           {selectedDoc.tags.map(tag => (
                             <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary/50 hover:bg-secondary">
                               {tag}
                             </Badge>
                           ))}
                         </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ai" className="flex-1 flex flex-col overflow-hidden mt-0">
                    <div className="flex-1 p-4 overflow-auto space-y-4">
                       <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                             <Sparkles className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="space-y-1">
                             <div className="bg-muted/50 p-3 rounded-lg rounded-tl-none text-sm">
                               I've analyzed <span className="font-medium">{selectedDoc.name}</span>. Would you like a summary or key takeaways?
                             </div>
                             <div className="flex gap-2">
                               <Button variant="outline" size="sm" className="h-7 text-xs bg-background">Summarize</Button>
                               <Button variant="outline" size="sm" className="h-7 text-xs bg-background">Key Points</Button>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="p-3 border-t mt-auto">
                       <div className="relative">
                         <Input placeholder="Ask about this document..." className="pr-10" />
                         <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-full w-10 hover:bg-transparent">
                            <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                         </Button>
                       </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                   <FileText className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="font-medium text-foreground mb-1">No document selected</h3>
                <p className="text-xs max-w-[200px]">Select a document to view its details, preview, or chat with AI.</p>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
