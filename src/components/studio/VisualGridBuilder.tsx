import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Mail, Calendar, FileText, Database, Zap, Sparkles, Filter, Play, Pause, RotateCcw, Plus, Save, ZoomIn, ZoomOut, Edit3, Plug, MessageSquare, Trash2, Bot, Activity, Maximize2, Grid3x3 } from "lucide-react";
import { NodeInspector } from "./NodeInspector";
import { NodePalette } from "./NodePalette";
import { TestResultsPanel, TestResult } from "./TestResultsPanel";
import { WorkflowMinimap } from "./WorkflowMinimap";
import { WorkflowTemplates } from "./WorkflowTemplates";
import { KeyboardShortcuts } from "../shared/KeyboardShortcuts";
import { logger } from "@/lib/logger";

interface NodeType {
  id: number;
  type: string;
  icon: any;
  label: string;
  gradient: string;
  shadow: string;
  position: { x: number; y: number };
  workflowId: number;
}

// Define connections between nodes - radial layout from central AI
const connections: { from: number; to: number }[] = [
  // Workflow 1: Email Automation (upper left branch)
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  
  // Workflow 2: CRM Data Sync (upper right branch)
  { from: 1, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
  
  // Workflow 3: Meeting Transcription (bottom branch)
  { from: 1, to: 10 },
  { from: 10, to: 11 },
  { from: 11, to: 12 },
  { from: 12, to: 13 },
];

// Initial node data - Radial layout with central AI hub
const initialNodes: NodeType[] = [
  // Central AI Assistant Hub (shared across all workflows)
  {
    id: 1,
    type: "ai-assistant",
    icon: Sparkles,
    label: "AI Assistant Hub",
    gradient: "from-fuchsia-500 to-fuchsia-600",
    shadow: "shadow-fuchsia-500/50",
    position: { x: 610, y: 350 },
    workflowId: 1, // Primary workflow
  },
  
  // Workflow 1: Email Automation (upper left branch)
  {
    id: 2,
    type: "email-trigger",
    icon: Mail,
    label: "Monitor Inbox",
    gradient: "from-cyan-500 to-cyan-600",
    shadow: "shadow-cyan-500/50",
    position: { x: 610, y: 180 },
    workflowId: 1,
  },
  {
    id: 3,
    type: "filter",
    icon: Filter,
    label: "Filter Invoices",
    gradient: "from-purple-400 to-purple-500",
    shadow: "shadow-purple-500/50",
    position: { x: 480, y: 200 },
    workflowId: 1,
  },
  {
    id: 4,
    type: "extract",
    icon: Database,
    label: "Extract Data",
    gradient: "from-blue-400 to-blue-500",
    shadow: "shadow-blue-500/50",
    position: { x: 410, y: 320 },
    workflowId: 1,
  },
  {
    id: 5,
    type: "database",
    icon: Database,
    label: "Save to CRM",
    gradient: "from-rose-400 to-rose-500",
    shadow: "shadow-rose-500/50",
    position: { x: 480, y: 440 },
    workflowId: 1,
  },
  
  // Workflow 2: CRM Data Sync (upper right branch)
  {
    id: 6,
    type: "database",
    icon: Database,
    label: "Read CRM Data",
    gradient: "from-purple-400 to-purple-500",
    shadow: "shadow-purple-500/50",
    position: { x: 750, y: 180 },
    workflowId: 2,
  },
  {
    id: 7,
    type: "process",
    icon: Zap,
    label: "Enrich Data",
    gradient: "from-pink-400 to-pink-500",
    shadow: "shadow-pink-500/50",
    position: { x: 870, y: 250 },
    workflowId: 2,
  },
  {
    id: 8,
    type: "integration",
    icon: Database,
    label: "Process Records",
    gradient: "from-violet-400 to-violet-500",
    shadow: "shadow-violet-500/50",
    position: { x: 820, y: 350 },
    workflowId: 2,
  },
  {
    id: 9,
    type: "integration",
    icon: Plug,
    label: "Sync to Salesforce",
    gradient: "from-rose-400 to-rose-500",
    shadow: "shadow-rose-500/50",
    position: { x: 870, y: 450 },
    workflowId: 2,
  },
  
  // Workflow 3: Meeting Transcription (bottom branch)
  {
    id: 10,
    type: "calendar",
    icon: Calendar,
    label: "Join Meeting",
    gradient: "from-fuchsia-400 to-fuchsia-500",
    shadow: "shadow-fuchsia-500/50",
    position: { x: 610, y: 500 },
    workflowId: 3,
  },
  {
    id: 11,
    type: "transcribe",
    icon: FileText,
    label: "Transcribe Audio",
    gradient: "from-rose-400 to-rose-500",
    shadow: "shadow-rose-500/50",
    position: { x: 610, y: 620 },
    workflowId: 3,
  },
  {
    id: 12,
    type: "summarize",
    icon: MessageSquare,
    label: "Generate Summary",
    gradient: "from-amber-500 to-amber-600",
    shadow: "shadow-amber-500/50",
    position: { x: 700, y: 680 },
    workflowId: 3,
  },
  {
    id: 13,
    type: "send",
    icon: Mail,
    label: "Email Team",
    gradient: "from-orange-500 to-orange-600",
    shadow: "shadow-orange-500/50",
    position: { x: 800, y: 640 },
    workflowId: 3,
  },
];

// Define workflow groups for visual organization
const workflows = [
  { 
    id: 1, 
    name: "Email Automation", 
    description: "Automatically processes invoice emails",
    status: "active",
    nodeIds: [1, 2, 3, 4, 5],
    color: "blue"
  },
  { 
    id: 2, 
    name: "CRM Data Sync", 
    description: "Enriches and syncs contact data",
    status: "active",
    nodeIds: [1, 6, 7, 8, 9],
    color: "purple"
  },
  { 
    id: 3, 
    name: "Meeting Transcription", 
    description: "Records and summarizes meetings",
    status: "active",
    nodeIds: [1, 10, 11, 12, 13],
    color: "rose"
  },
];

export function VisualGridBuilder() {
  const [nodes, setNodes] = useState<NodeType[]>(initialNodes);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(1); // Start with workflow 1 selected
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fit all nodes to screen
  const handleFitToScreen = useCallback(() => {
    if (nodes.length === 0 || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate bounds of all nodes
    const bounds = nodes.reduce((acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      minY: Math.min(acc.minY, node.position.y),
      maxX: Math.max(acc.maxX, node.position.x + 200),
      maxY: Math.max(acc.maxY, node.position.y + 100)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    // Calculate zoom to fit all nodes with padding
    const padding = 100;
    const zoomX = (containerRect.width - padding * 2) / width;
    const zoomY = (containerRect.height - padding * 2) / height;
    const newZoom = Math.min(zoomX, zoomY, 1.0); // Don't zoom in beyond 100%

    // Center the content
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const newPanX = (containerRect.width / 2) / newZoom - centerX;
    const newPanY = (containerRect.height / 2) / newZoom - centerY;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [nodes]);

  // Auto-arrange nodes in a clean layout
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    // Group nodes by workflow
    const workflowGroups = new Map<number, typeof nodes>();
    nodes.forEach(node => {
      const group = workflowGroups.get(node.workflowId) || [];
      group.push(node);
      workflowGroups.set(node.workflowId, group);
    });

    let updatedNodes = [...nodes];
    let currentY = 100;

    // Layout each workflow vertically
    workflowGroups.forEach((workflowNodes, workflowId) => {
      const sortedNodes = [...workflowNodes].sort((a, b) => a.id - b.id);
      
      sortedNodes.forEach((node, index) => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            position: {
              x: 200 + (index % 3) * 300, // 3 columns max
              y: currentY + Math.floor(index / 3) * 200
            }
          };
        }
      });

      currentY += Math.ceil(sortedNodes.length / 3) * 200 + 100;
    });

    setNodes(updatedNodes);
    
    // Fit to screen after layout
    setTimeout(handleFitToScreen, 100);
  }, [nodes, handleFitToScreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + S - Save
      if (modifier && e.key === 's') {
        e.preventDefault();
        logger.debug('Save workflow');
      }

      // Cmd/Ctrl + F - Fit to screen
      if (modifier && e.key === 'f') {
        e.preventDefault();
        handleFitToScreen();
      }

      // Cmd/Ctrl + 0 - Reset zoom
      if (modifier && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      }

      // Delete - Delete selected node
      if (e.key === 'Delete' && selectedNode) {
        setNodes(prev => prev.filter(n => n.id !== selectedNode));
        setSelectedNode(null);
      }

      // Cmd/Ctrl + D - Duplicate node
      if (modifier && e.key === 'd' && selectedNode) {
        e.preventDefault();
        const node = nodes.find(n => n.id === selectedNode);
        if (node) {
          const newNode = {
            ...node,
            id: Math.max(...nodes.map(n => n.id)) + 1,
            position: { x: node.position.x + 50, y: node.position.y + 50 }
          };
          setNodes([...nodes, newNode]);
          setSelectedNode(newNode.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, nodes, zoom, handleFitToScreen]);

  // Calculate bounding box of all nodes and adjust zoom
  useEffect(() => {
    if (nodes.length === 0 || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const padding = 100;
    const nodeSize = 80;

    // Find bounding box
    const minX = Math.min(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxX = Math.max(...nodes.map(n => n.position.x + nodeSize));
    const maxY = Math.max(...nodes.map(n => n.position.y + nodeSize));

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    // Calculate zoom to fit - adjusted for toolbars
    const zoomX = (containerRect.width - 200) / contentWidth;
    const zoomY = (containerRect.height - 200) / contentHeight;
    const newZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.5), 1.0);

    // Calculate pan to center
    const newPanX = (containerRect.width / 2 / newZoom) - (minX + maxX) / 2;
    const newPanY = (containerRect.height / 2 / newZoom) - (minY + maxY) / 2;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [nodes]);

  const handleMouseDown = (nodeId: number, e: React.MouseEvent) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Select the node
    setSelectedNode(nodeId);
    setSelectedWorkflow(node.workflowId);

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    });
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Handle node dragging
    if (draggedNode !== null) {
      // Convert mouse position to the transformed coordinate space
      const mouseX = (e.clientX - containerRect.left) / zoom;
      const mouseY = (e.clientY - containerRect.top) / zoom;
      
      // Calculate new position accounting for pan and drag offset
      const newX = mouseX - pan.x - dragOffset.x;
      const newY = mouseY - pan.y - dragOffset.y;

      setNodes(prev =>
        prev.map(node =>
          node.id === draggedNode
            ? { ...node, position: { x: newX, y: newY } }
            : node
        )
      );
    }
    
    // Handle canvas panning
    if (isPanning) {
      const deltaX = (e.clientX - panStart.x) / zoom;
      const deltaY = (e.clientY - panStart.y) / zoom;
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only start panning if clicking on the canvas background, not on nodes or UI elements
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Get mouse position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate zoom delta (negative deltaY means zoom in)
    const zoomDelta = e.deltaY > 0 ? 0.95 : 1.05;
    const newZoom = Math.min(Math.max(zoom * zoomDelta, 0.25), 2.0);
    
    // Calculate the point in the canvas space before zoom
    const pointBeforeZoomX = (mouseX / zoom) - pan.x;
    const pointBeforeZoomY = (mouseY / zoom) - pan.y;
    
    // Calculate the point in the canvas space after zoom
    const pointAfterZoomX = (mouseX / newZoom) - pan.x;
    const pointAfterZoomY = (mouseY / newZoom) - pan.y;
    
    // Adjust pan to keep the point under the mouse cursor in the same place
    const newPanX = pan.x + (pointAfterZoomX - pointBeforeZoomX);
    const newPanY = pan.y + (pointAfterZoomY - pointBeforeZoomY);
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Get nodes for selected workflow
  const getWorkflowNodes = (workflowId: number) => {
    return nodes.filter(n => n.workflowId === workflowId);
  };

  // Handle dropping new nodes from palette
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const templateData = e.dataTransfer.getData('nodeTemplate');
    if (!templateData || !containerRef.current) return;
    
    const template = JSON.parse(templateData);
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Convert drop position to canvas coordinates
    const dropX = (e.clientX - containerRect.left) / zoom - pan.x;
    const dropY = (e.clientY - containerRect.top) / zoom - pan.y;
    
    // Create new node
    const newNode: NodeType = {
      id: Math.max(...nodes.map(n => n.id), 0) + 1,
      type: template.type,
      icon: template.icon,
      label: template.label,
      gradient: template.gradient,
      shadow: template.gradient.replace('from-', 'shadow-').replace('to-', '').split(' ')[0] + '/50',
      position: { x: dropX - 40, y: dropY - 40 }, // Center on cursor
      workflowId: selectedWorkflow || 1,
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode.id);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle test execution
  const handleTestNode = (nodeId: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Show test results panel if not already visible
    setShowTestResults(true);

    // Simulate test execution with realistic data
    const isSuccess = Math.random() > 0.2; // 80% success rate
    const duration = (Math.random() * 2 + 0.5).toFixed(2);

    const sampleInput = {
      email: {
        from: "vendor@acme.com",
        subject: "Invoice #INV-2847",
        body: "Please find attached invoice for services rendered...",
        attachments: ["invoice-2847.pdf"]
      }
    };

    const sampleOutput = isSuccess ? {
      invoiceNumber: "INV-2847",
      amount: 1250.00,
      vendor: "ACME Corp",
      dueDate: "2025-11-20",
      extracted: true
    } : null;

    const testResult: TestResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      nodeName: node.label,
      nodeId: node.id,
      status: isSuccess ? 'success' : 'error',
      duration: `${duration}s`,
      input: sampleInput,
      output: sampleOutput,
      error: isSuccess ? undefined : "Connection timeout: Failed to reach external API after 30s",
      logs: [
        `[${new Date().toISOString()}] Test started for node ${node.label}`,
        `[${new Date().toISOString()}] Processing input data...`,
        isSuccess 
          ? `[${new Date().toISOString()}] ✓ Test completed successfully` 
          : `[${new Date().toISOString()}] ✗ Test failed with error`
      ]
    };

    setTestResults(prev => [testResult, ...prev]);
  };

  // Create smooth curved path
  const createCurvedPath = (fromX: number, fromY: number, toX: number, toY: number) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control point offset for smooth curves
    const offset = Math.min(distance * 0.3, 60);
    
    // Determine if we need a vertical or horizontal curve
    if (Math.abs(dx) > Math.abs(dy)) {
      // Mostly horizontal - use horizontal control points
      const cx1 = fromX + offset;
      const cy1 = fromY;
      const cx2 = toX - offset;
      const cy2 = toY;
      return `M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`;
    } else {
      // Mostly vertical - use vertical control points
      const cx1 = fromX;
      const cy1 = fromY + offset;
      const cx2 = toX;
      const cy2 = toY - offset;
      return `M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`;
    }
  };

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      {showNodePalette && <NodePalette />}

      {/* Main Workflow Area */}
      <Card className="flex-1 p-3 md:p-4 lg:p-6 flex flex-col rounded-l-none border-l-0">
        <div className="mb-3 md:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3>Visual Workflow</h3>
              <p className="text-sm text-muted-foreground">
                3 workflows running across your agent ecosystem
              </p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNodePalette(!showNodePalette)}
                className="h-8 lg:hidden"
              >
                <Zap className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={showTestResults ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTestResults(!showTestResults)}
                className="h-8"
              >
                <Play className="h-3.5 w-3.5 md:mr-1.5" />
                <span className="hidden sm:inline">{showTestResults ? 'Hide' : 'View'} Tests</span>
                {testResults.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 bg-white/80">
                    {testResults.length}
                  </Badge>
                )}
              </Button>
              <Badge variant="outline" className="hidden sm:flex bg-green-50 text-green-700 border-green-200">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                3 Active
              </Badge>
              <Badge variant="outline" className="hidden lg:flex bg-muted">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 py-3 px-3 md:px-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              {/* Templates */}
              <WorkflowTemplates />
              
              <Separator orientation="vertical" className="h-6" />

              {/* Zoom Controls */}
              <Badge variant="outline" className="text-xs px-2 py-1 bg-white">
                {(zoom * 100).toFixed(0)}%
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 shadow-sm"
                    onClick={() => setZoom(Math.min(zoom * 1.2, 2.0))}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 shadow-sm"
                    onClick={() => setZoom(Math.max(zoom * 0.8, 0.25))}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 shadow-sm"
                    onClick={handleFitToScreen}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to Screen</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6" />

              {/* Auto Layout */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 shadow-sm"
                    onClick={handleAutoLayout}
                  >
                    <Grid3x3 className="h-3.5 w-3.5 md:mr-1.5" />
                    <span className="hidden md:inline">Auto-Layout</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Organize nodes automatically</TooltipContent>
              </Tooltip>

              {/* Keyboard Shortcuts */}
              <KeyboardShortcuts />
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              {/* Run/Save */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isRunning ? "destructive" : "default"}
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRunning ? "Stop Workflow" : "Run Workflow"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 shadow-sm">
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Save Workflow
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

      {/* Grid Builder Area */}
      <div 
        ref={containerRef}
        className={`flex-1 rounded-lg border border-border overflow-hidden relative ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        {/* Dot Grid Background */}
        <div 
          className="canvas-background absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="canvas-background absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95 pointer-events-none" />

        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 shadow-lg mx-auto">
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  Start describing your agent to see the workflow build automatically
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="canvas-background relative w-full h-full p-8">
            {/* Zoomable/Pannable Container */}
            <div
              className="canvas-background"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: '0 0',
                transition: draggedNode === null && !isPanning ? 'transform 0.3s ease-out' : 'none',
                width: '100%',
                height: '100%',
              }}
            >
              {/* SVG Layer for Connections */}
              <svg 
                className="absolute pointer-events-none" 
                style={{ 
                  zIndex: 1,
                  left: '-2000px',
                  top: '-2000px',
                  width: '8000px',
                  height: '8000px'
                }}
                viewBox="-2000 -2000 8000 8000"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Draw connection paths */}
                {connections.map((conn, idx) => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;

                  const fromX = fromNode.position.x + 40; // Center of 80px node
                  const fromY = fromNode.position.y + 40;
                  const toX = toNode.position.x + 40;
                  const toY = toNode.position.y + 40;
                  
                  // Determine workflow for color and visibility
                  let strokeColor = "#6366f1";
                  let opacity = 0.2;
                  let isValid = true; // Connection validation
                  
                  // Simple validation: check if nodes are in same workflow
                  if (fromNode.workflowId !== toNode.workflowId) {
                    isValid = false;
                    strokeColor = "#ef4444"; // Red for invalid
                    opacity = 0.4;
                  }
                  
                  workflows.forEach(workflow => {
                    if (workflow.nodeIds.includes(conn.from) && workflow.nodeIds.includes(conn.to)) {
                      if (workflow.id === selectedWorkflow) {
                        opacity = isValid ? 0.6 : 0.5;
                      }
                      if (isValid) {
                        if (workflow.color === 'blue') strokeColor = "#3b82f6";
                        if (workflow.color === 'purple') strokeColor = "#a855f7";
                        if (workflow.color === 'rose') strokeColor = "#f43f5e";
                      }
                    }
                  });

                  const pathData = createCurvedPath(fromX, fromY, toX, toY);
                  
                  return (
                    <g key={idx}>
                      {/* Main curved path */}
                      <path
                        d={pathData}
                        stroke={strokeColor}
                        strokeWidth="2"
                        opacity={opacity}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={isValid ? "0" : "8,4"}
                      />
                      {/* Animated flow indicator - only on selected workflow */}
                      {fromNode.workflowId === selectedWorkflow && isValid && (
                        <circle r="3" fill={strokeColor} opacity="0.9">
                          <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            path={pathData}
                          />
                        </circle>
                      )}
                      {/* Warning indicator for invalid connections */}
                      {!isValid && fromNode.workflowId === selectedWorkflow && (
                        <g>
                          <circle
                            cx={(fromX + toX) / 2}
                            cy={(fromY + toY) / 2}
                            r="12"
                            fill="#fef2f2"
                            stroke="#ef4444"
                            strokeWidth="2"
                          />
                          <text
                            x={(fromX + toX) / 2}
                            y={(fromY + toY) / 2 + 1}
                            textAnchor="middle"
                            fontSize="16"
                            fill="#ef4444"
                            fontWeight="bold"
                          >
                            !
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes Layer */}
              <div className="relative w-full h-full" style={{ zIndex: 2 }}>
                {nodes.map((node) => {
                  const isInSelectedWorkflow = node.workflowId === selectedWorkflow;
                  const nodeOpacity = selectedWorkflow === null || isInSelectedWorkflow ? 1 : 0.3;
                  
                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{
                        left: `${node.position.x}px`,
                        top: `${node.position.y}px`,
                        opacity: nodeOpacity,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <div 
                        className="group cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown(node.id, e)}
                      >
                        <div className="relative">
                          {/* Node Label */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-background border border-border rounded-lg px-3 py-1.5 shadow-lg">
                              <p className="text-xs">{node.label}</p>
                            </div>
                          </div>
                          
                          {/* Clean Button */}
                          <div 
                            className={`
                              relative w-20 h-20 rounded-2xl bg-gradient-to-br ${node.gradient}
                              transform transition-all duration-200
                              hover:scale-105
                              flex items-center justify-center
                              before:absolute before:inset-0 before:rounded-2xl 
                              before:bg-gradient-to-b before:from-white/10 before:to-transparent
                              ${draggedNode === node.id ? 'scale-105 cursor-grabbing shadow-2xl' : ''}
                              ${selectedNode === node.id ? 'shadow-xl ring-2 ring-white ring-offset-2' : 'shadow-md'}
                            `}
                            style={{
                              filter: selectedNode === node.id ? 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                            }}
                          >
                            <node.icon className="h-8 w-8 text-white relative z-10 drop-shadow pointer-events-none" />
                          </div>

                          {/* Subtle Bottom Shadow */}
                          <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-14 h-2 bg-gradient-to-br ${node.gradient} opacity-15 blur-sm rounded-full pointer-events-none`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Workflow Selector Toolbar - Left Edge */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-background/80 backdrop-blur-lg border border-border rounded-full shadow-lg py-2 px-1.5 flex flex-col items-center gap-0.5">
            {workflows.map((workflow) => (
              <Tooltip key={workflow.id}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`
                      h-9 w-9 rounded-full relative
                      ${selectedWorkflow === workflow.id 
                        ? 'bg-gradient-to-br from-purple-500/20 to-purple-700/20 ring-2 ring-purple-500/50' 
                        : 'hover:bg-accent'
                      }
                    `}
                    onClick={() => {
                      setSelectedWorkflow(workflow.id);
                      setSelectedNode(null);
                    }}
                  >
                    <Bot className={`h-4 w-4 ${selectedWorkflow === workflow.id ? 'text-purple-600' : ''}`} />
                    {workflow.status === 'active' && (
                      <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background animate-pulse" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{workflow.name}</p>
                    <p className="text-xs text-muted-foreground">{workflow.description}</p>
                    <p className="text-xs">
                      <span className="text-green-600">● Running</span> · {workflow.nodeIds.length} nodes
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}

            <Separator orientation="horizontal" className="w-4 my-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full hover:bg-accent"
                  onClick={() => {
                    setSelectedWorkflow(null);
                    setSelectedNode(null);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Create new workflow
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Floating Toolbar - Bottom */}
        {nodes.length > 0 && selectedWorkflow && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-background/80 backdrop-blur-lg border border-border rounded-full shadow-lg px-3 py-2 flex items-center gap-1">
              {/* Show selected workflow name */}
              <div className="px-3 text-xs font-medium text-muted-foreground">
                {workflows.find(w => w.id === selectedWorkflow)?.name}
              </div>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Playback Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-full py-1 px-3">
                  Run Workflow
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                    <Pause className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-full py-1 px-3">
                  Pause Workflow
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-full py-1 px-3">
                  Reset Workflow
                </TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Zoom Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-full py-1 px-3">
                  Zoom Out
                </TooltipContent>
              </Tooltip>
              
              <div className="px-2 text-xs text-muted-foreground min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-full py-1 px-3">
                  Zoom In
                </TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Save */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-full py-1 px-3">
                  Save Workflow
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Minimap */}
        {nodes.length > 0 && containerRef.current && (
          <WorkflowMinimap
            nodes={nodes.map(n => ({ ...n, x: n.position.x, y: n.position.y }))}
            connections={connections}
            viewportX={pan.x}
            viewportY={pan.y}
            scale={zoom}
            containerWidth={containerRef.current.getBoundingClientRect().width}
            containerHeight={containerRef.current.getBoundingClientRect().height}
            onViewportChange={(x, y) => setPan({ x, y })}
          />
        )}

        {/* Node Inspector Panel */}
        {selectedNode && nodes.find(n => n.id === selectedNode) && !showTestResults && (
          <NodeInspector 
            node={nodes.find(n => n.id === selectedNode)!}
            onClose={() => setSelectedNode(null)}
            onTest={handleTestNode}
          />
        )}
      </div>
      </Card>

      {/* Test Results Panel */}
      {showTestResults && (
        <TestResultsPanel 
          testResults={testResults}
          onClear={() => setTestResults([])}
        />
      )}
    </div>
  );
}
