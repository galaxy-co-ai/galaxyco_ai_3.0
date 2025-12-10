import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Map, X } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

interface Node {
  id: number;
  x: number;
  y: number;
  type: string;
  icon: any;
  label: string;
  gradient: string;
  workflowId: number;
}

interface Connection {
  from: number;
  to: number;
}

interface WorkflowMinimapProps {
  nodes: Node[];
  connections: Connection[];
  viewportX: number;
  viewportY: number;
  scale: number;
  containerWidth: number;
  containerHeight: number;
  onViewportChange: (x: number, y: number) => void;
}

export function WorkflowMinimap({
  nodes,
  connections,
  viewportX,
  viewportY,
  scale,
  containerWidth,
  containerHeight,
  onViewportChange
}: WorkflowMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const minimapSize = { width: 200, height: 150 };
  
  // Calculate bounds of all nodes
  const bounds = nodes.reduce((acc, node) => {
    return {
      minX: Math.min(acc.minX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxX: Math.max(acc.maxX, node.x + 200),
      maxY: Math.max(acc.maxY, node.y + 100)
    };
  }, { minX: 0, minY: 0, maxX: containerWidth, maxY: containerHeight });

  const worldWidth = bounds.maxX - bounds.minX;
  const worldHeight = bounds.maxY - bounds.minY;
  
  const minimapScale = Math.min(
    minimapSize.width / worldWidth,
    minimapSize.height / worldHeight
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, minimapSize.width, minimapSize.height);

    // Draw connections
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        const fromX = (fromNode.x - bounds.minX + 100) * minimapScale;
        const fromY = (fromNode.y - bounds.minY + 50) * minimapScale;
        const toX = (toNode.x - bounds.minX + 100) * minimapScale;
        const toY = (toNode.y - bounds.minY + 50) * minimapScale;
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const x = (node.x - bounds.minX) * minimapScale;
      const y = (node.y - bounds.minY) * minimapScale;
      const width = 200 * minimapScale;
      const height = 100 * minimapScale;

      // Node background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, width, height);
      
      // Node border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);

      // Highlight selected workflow
      if (node.type === "ai-assistant") {
        ctx.fillStyle = "#f0abfc";
        ctx.fillRect(x, y, width, height);
      }
    });

    // Draw viewport rectangle
    const viewportWidth = containerWidth * minimapScale;
    const viewportHeight = containerHeight * minimapScale;
    const viewportMapX = (-viewportX - bounds.minX) * minimapScale;
    const viewportMapY = (-viewportY - bounds.minY) * minimapScale;

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportMapX, viewportMapY, viewportWidth, viewportHeight);
    
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    ctx.fillRect(viewportMapX, viewportMapY, viewportWidth, viewportHeight);

  }, [nodes, connections, viewportX, viewportY, scale, bounds, minimapScale, containerWidth, containerHeight]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coordinates to world coordinates
    const worldX = (clickX / minimapScale) + bounds.minX - containerWidth / 2;
    const worldY = (clickY / minimapScale) + bounds.minY - containerHeight / 2;

    onViewportChange(-worldX, -worldY);
  };

  return (
    <Card className="absolute bottom-4 right-4 shadow-lg z-10 border-2 border-border bg-white/95 backdrop-blur">
      {isExpanded ? (
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Minimap</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-muted"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <canvas
            ref={canvasRef}
            width={minimapSize.width}
            height={minimapSize.height}
            className="cursor-pointer rounded"
            onClick={handleMinimapClick}
          />
          <div className="text-xs text-muted-foreground text-center mt-1">
            Click to navigate
          </div>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-muted"
              onClick={() => setIsExpanded(true)}
            >
              <Map className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Show Minimap
          </TooltipContent>
        </Tooltip>
      )}
    </Card>
  );
}
