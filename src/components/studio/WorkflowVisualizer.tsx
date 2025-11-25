import { useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "../ui/card";

const initialNodes: Node[] = [
  {
    id: "assistant",
    type: "default",
    position: { x: 250, y: 50 },
    data: { 
      label: (
        <div className="text-center">
          <div className="text-sm">AI Assistant</div>
          <div className="text-xs text-muted-foreground">Orchestrating</div>
        </div>
      ) 
    },
    style: {
      background: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      border: "2px solid hsl(var(--primary))",
      borderRadius: "8px",
      padding: "12px 20px",
      width: 160,
    },
  },
  {
    id: "email-triage",
    position: { x: 50, y: 200 },
    data: { 
      label: (
        <div className="text-center">
          <div className="text-sm">Email Triage</div>
          <div className="text-xs text-green-500">● Active</div>
        </div>
      ) 
    },
    style: {
      background: "hsl(var(--card))",
      border: "2px solid hsl(var(--border))",
      borderRadius: "8px",
      padding: "12px 20px",
      width: 140,
    },
  },
  {
    id: "crm-agent",
    position: { x: 250, y: 200 },
    data: { 
      label: (
        <div className="text-center">
          <div className="text-sm">CRM Agent</div>
          <div className="text-xs text-green-500">● Processing</div>
        </div>
      ) 
    },
    style: {
      background: "hsl(var(--card))",
      border: "2px solid hsl(var(--border))",
      borderRadius: "8px",
      padding: "12px 20px",
      width: 140,
    },
  },
  {
    id: "knowledge-base",
    position: { x: 450, y: 200 },
    data: { 
      label: (
        <div className="text-center">
          <div className="text-sm">Knowledge Base</div>
          <div className="text-xs text-gray-400">● Idle</div>
        </div>
      ) 
    },
    style: {
      background: "hsl(var(--card))",
      border: "2px solid hsl(var(--border))",
      borderRadius: "8px",
      padding: "12px 20px",
      width: 160,
    },
  },
  {
    id: "task-1",
    position: { x: 50, y: 350 },
    data: { 
      label: (
        <div className="text-center">
          <div className="text-xs">Invoice Processing</div>
          <div className="text-xs text-muted-foreground">75% complete</div>
        </div>
      ) 
    },
    style: {
      background: "hsl(var(--muted))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "6px",
      padding: "8px 12px",
      width: 140,
      fontSize: "12px",
    },
  },
  {
    id: "task-2",
    position: { x: 250, y: 350 },
    data: { 
      label: (
        <div className="text-center">
          <div className="text-xs">Meeting Notes</div>
          <div className="text-xs text-muted-foreground">Transcribing...</div>
        </div>
      ) 
    },
    style: {
      background: "hsl(var(--muted))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "6px",
      padding: "8px 12px",
      width: 140,
      fontSize: "12px",
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "assistant", target: "email-triage", animated: true },
  { id: "e2", source: "assistant", target: "crm-agent", animated: true },
  { id: "e3", source: "assistant", target: "knowledge-base" },
  { id: "e4", source: "email-triage", target: "task-1", animated: true },
  { id: "e5", source: "crm-agent", target: "task-2", animated: true },
];

export function WorkflowVisualizer() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Card className="h-[500px] p-0 overflow-hidden">
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          className="bg-muted/20"
        >
          <Background />
          <Controls />
          <MiniMap
            style={{
              background: "hsl(var(--muted))",
            }}
            maskColor="hsl(var(--background) / 0.6)"
          />
        </ReactFlow>
      </div>
    </Card>
  );
}
