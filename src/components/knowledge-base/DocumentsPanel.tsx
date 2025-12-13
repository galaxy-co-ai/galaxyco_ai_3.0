import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { 
  FileText, 
  FolderOpen, 
  Download, 
  ExternalLink, 
  Search,
  Clock,
  Sparkles,
  File
} from "lucide-react";
import { useState } from "react";

interface Document {
  id: string;
  name: string;
  type: string;
  project: string;
  createdBy: "AI Assistant" | "User";
  createdAt: string;
  size: string;
  description: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "TechCorp Implementation Plan.pdf",
    type: "PDF",
    project: "TechCorp Implementation",
    createdBy: "AI Assistant",
    createdAt: "2 hours ago",
    size: "2.4 MB",
    description: "Comprehensive implementation roadmap with timeline, milestones, and resource allocation"
  },
  {
    id: "2",
    name: "Requirements Document.docx",
    type: "DOCX",
    project: "TechCorp Implementation",
    createdBy: "AI Assistant",
    createdAt: "1 day ago",
    size: "856 KB",
    description: "Detailed technical and business requirements gathered from discovery sessions"
  },
  {
    id: "3",
    name: "API Integration Specs.pdf",
    type: "PDF",
    project: "InnovateLabs Integration",
    createdBy: "AI Assistant",
    createdAt: "3 days ago",
    size: "1.2 MB",
    description: "Technical specifications for Salesforce and Slack API integrations"
  },
  {
    id: "4",
    name: "Training Materials.pdf",
    type: "PDF",
    project: "TechCorp Implementation",
    createdBy: "AI Assistant",
    createdAt: "5 days ago",
    size: "4.1 MB",
    description: "User training guides and best practices documentation"
  },
  {
    id: "5",
    name: "SLA Agreement Draft.pdf",
    type: "PDF",
    project: "Global Systems Rollout",
    createdBy: "AI Assistant",
    createdAt: "1 week ago",
    size: "678 KB",
    description: "Service level agreement terms including uptime guarantees and support response times"
  },
  {
    id: "6",
    name: "Deployment Checklist.xlsx",
    type: "XLSX",
    project: "Global Systems Rollout",
    createdBy: "AI Assistant",
    createdAt: "1 week ago",
    size: "234 KB",
    description: "Regional deployment checklist for all 5 office locations"
  }
];

// Group documents by project
const groupDocumentsByProject = (documents: Document[]) => {
  const grouped: Record<string, Document[]> = {};
  documents.forEach(doc => {
    if (!grouped[doc.project]) {
      grouped[doc.project] = [];
    }
    grouped[doc.project].push(doc);
  });
  return grouped;
};

export function DocumentsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredDocuments = mockDocuments.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const groupedDocuments = groupDocumentsByProject(filteredDocuments);

  const getFileIcon = (type: string) => {
    return FileText;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Search */}
      <div className="p-6 pb-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border-0"
          />
        </div>
      </div>

      {/* Documents List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {Object.entries(groupedDocuments).map(([project, docs]) => (
            <div key={project}>
              {/* Project Header */}
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm">{project}</h3>
                <Badge variant="outline" className="ml-auto text-xs bg-muted border-0">
                  {docs.length} {docs.length === 1 ? "doc" : "docs"}
                </Badge>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                {docs.map((doc) => {
                  const FileIcon = getFileIcon(doc.type);
                  
                  return (
                    <Card 
                      key={doc.id} 
                      className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl hover:shadow-[0_6px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center shrink-0">
                          <FileIcon className="h-5 w-5 text-blue-500" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {doc.description}
                              </p>
                            </div>
                            
                            {doc.createdBy === "AI Assistant" && (
                              <Badge 
                                variant="outline" 
                                className="bg-purple-500/10 text-purple-500 border-0 text-xs shrink-0 rounded-full"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{doc.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <File className="h-3 w-3" />
                              <span>{doc.size}</span>
                            </div>
                            <Badge variant="outline" className="text-xs border-0 bg-muted">
                              {doc.type}
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs shadow-[0_2px_8px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_16px_rgb(0,0,0,0.08)]"
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              Open
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs shadow-[0_2px_8px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_16px_rgb(0,0,0,0.08)]"
                            >
                              <Download className="h-3 w-3 mr-1.5" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? "No documents found" : "No documents yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  AI Assistant will automatically organize documents here
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
