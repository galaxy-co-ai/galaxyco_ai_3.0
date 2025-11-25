import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";
import { Mail, Filter, Database, Calendar, FileText, Sparkles, Users, Send, CheckCircle2, Zap, ArrowRight, PlayCircle } from "lucide-react";

const workflows = [
  {
    id: "email-crm",
    name: "Email to CRM Pipeline",
    description: "Auto-sync emails to CRM",
    icon: Mail,
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    nodes: [
      { id: "1", type: "trigger", label: "New Email", icon: Mail, x: 60, y: 120 },
      { id: "2", type: "filter", label: "Filter Priority", icon: Filter, x: 250, y: 120 },
      { id: "3", type: "action", label: "Add to CRM", icon: Database, x: 440, y: 120 },
    ]
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes Automation",
    description: "Transcribe & summarize calls",
    icon: Calendar,
    color: "from-purple-500 to-pink-500",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50",
    nodes: [
      { id: "1", type: "trigger", label: "Meeting Ends", icon: Calendar, x: 60, y: 120 },
      { id: "2", type: "action", label: "Transcribe", icon: FileText, x: 250, y: 120 },
      { id: "3", type: "action", label: "AI Summary", icon: Sparkles, x: 440, y: 120 },
    ]
  },
  {
    id: "lead-qualification",
    name: "Lead Qualification Flow",
    description: "Score & route new leads",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    nodes: [
      { id: "1", type: "trigger", label: "New Lead", icon: Users, x: 60, y: 120 },
      { id: "2", type: "action", label: "AI Score", icon: Sparkles, x: 250, y: 120 },
      { id: "3", type: "action", label: "Notify Sales", icon: Send, x: 440, y: 120 },
    ]
  },
  {
    id: "task-automation",
    name: "Task Automation",
    description: "Auto-assign & track tasks",
    icon: CheckCircle2,
    color: "from-orange-500 to-red-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
    nodes: [
      { id: "1", type: "trigger", label: "New Task", icon: CheckCircle2, x: 60, y: 120 },
      { id: "2", type: "action", label: "Auto-Assign", icon: Users, x: 250, y: 120 },
      { id: "3", type: "action", label: "Send Alert", icon: Zap, x: 440, y: 120 },
    ]
  },
];

const getNodeTypeColor = (type: string) => {
  switch (type) {
    case 'trigger':
      return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' };
    case 'filter':
      return { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' };
    case 'action':
      return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' };
    default:
      return { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-500' };
  }
};

export function StudioShowcase() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState<number[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    // Start building animation when workflow changes
    setIsBuilding(true);
    setVisibleNodes([]);
    
    const currentWorkflow = workflows[selectedWorkflow];
    const delays = currentWorkflow.nodes.map((_, i) => i * 600);
    
    delays.forEach((delay, index) => {
      setTimeout(() => {
        setVisibleNodes(prev => [...prev, index]);
        if (index === currentWorkflow.nodes.length - 1) {
          setTimeout(() => setIsBuilding(false), 400);
        }
      }, delay);
    });

    // Auto-rotate workflows
    const rotateTimer = setTimeout(() => {
      setSelectedWorkflow((prev) => (prev + 1) % workflows.length);
    }, 6000);

    return () => clearTimeout(rotateTimer);
  }, [selectedWorkflow]);

  const currentWorkflow = workflows[selectedWorkflow];

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white flex overflow-hidden">
      {/* Left Panel - Workflow Chips (1/3) */}
      <div className="w-1/3 p-6 border-r border-gray-200 bg-white/50 backdrop-blur-sm flex flex-col">
        <div className="mb-6">
          <h3 className="text-lg mb-1">Workflow Templates</h3>
          <p className="text-xs text-muted-foreground">Click to preview automation flow</p>
        </div>
        
        <div className="space-y-3 flex-1 overflow-y-auto">
          {workflows.map((workflow, index) => {
            const Icon = workflow.icon;
            const isActive = selectedWorkflow === index;
            
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    isActive
                      ? `bg-gradient-to-r ${workflow.color} text-white border-transparent shadow-lg scale-105`
                      : 'bg-white hover:shadow-md border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setSelectedWorkflow(index)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-white/20' : workflow.bgColor
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : workflow.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm truncate ${isActive ? 'text-white' : ''}`}>
                          {workflow.name}
                        </p>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0"
                          >
                            <PlayCircle className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'} truncate`}>
                        {workflow.description}
                      </p>
                    </div>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 6, ease: "linear" }}
                      />
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Badge className={`bg-gradient-to-r ${currentWorkflow.color} text-white border-0 text-xs px-3 py-1.5`}>
            <Sparkles className="h-3 w-3 mr-1.5" />
            AI-Powered Workflows
          </Badge>
        </div>
      </div>

      {/* Right Panel - Workflow Visualization (2/3) */}
      <div className="flex-1 p-8 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg">Visual Workflow Builder</h3>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Building...
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Watch as the workflow is built node by node
          </p>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden shadow-inner">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#e5e7eb" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Workflow Nodes */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedWorkflow}
              className="relative h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                {/* Connection Lines */}
                {currentWorkflow.nodes.map((node, index) => {
                  if (index === currentWorkflow.nodes.length - 1) return null;
                  const nextNode = currentWorkflow.nodes[index + 1];
                  const isVisible = visibleNodes.includes(index) && visibleNodes.includes(index + 1);
                  
                  return (
                    <motion.line
                      key={`line-${index}`}
                      x1={node.x + 80}
                      y1={node.y + 30}
                      x2={nextNode.x}
                      y2={nextNode.y + 30}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isVisible ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    />
                  );
                })}
                
                {/* Arrow Markers */}
                {currentWorkflow.nodes.map((node, index) => {
                  if (index === currentWorkflow.nodes.length - 1) return null;
                  const nextNode = currentWorkflow.nodes[index + 1];
                  const isVisible = visibleNodes.includes(index) && visibleNodes.includes(index + 1);
                  const midX = (node.x + 80 + nextNode.x) / 2;
                  
                  return (
                    <motion.g
                      key={`arrow-${index}`}
                      initial={{ opacity: 0 }}
                      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <ArrowRight
                        x={midX - 8}
                        y={node.y + 22}
                        className="h-4 w-4 text-gray-400"
                      />
                    </motion.g>
                  );
                })}
              </svg>

              {/* Nodes */}
              {currentWorkflow.nodes.map((node, index) => {
                const NodeIcon = node.icon;
                const colors = getNodeTypeColor(node.type);
                const isVisible = visibleNodes.includes(index);

                return (
                  <motion.div
                    key={node.id}
                    className="absolute"
                    style={{ left: node.x, top: node.y, zIndex: 10 }}
                    initial={{ opacity: 0, scale: 0, y: -20 }}
                    animate={isVisible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className="relative group">
                      {/* Node Glow Effect */}
                      {isVisible && (
                        <motion.div
                          className={`absolute -inset-2 bg-gradient-to-r ${currentWorkflow.color} rounded-xl blur-md opacity-0`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.3 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                      
                      {/* Node Card */}
                      <Card className={`relative w-20 h-16 p-2 border-2 ${colors.border} bg-white shadow-lg hover:shadow-xl transition-shadow`}>
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className={`h-7 w-7 rounded-lg ${colors.bg} flex items-center justify-center mb-1`}>
                            <NodeIcon className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-[8px] text-center leading-tight truncate w-full px-0.5">
                            {node.label}
                          </p>
                        </div>
                        
                        {/* Node Type Badge */}
                        <div className={`absolute -top-2 -right-2 h-5 w-5 rounded-full ${colors.bg} flex items-center justify-center shadow-md`}>
                          <span className="text-white text-[8px]">{index + 1}</span>
                        </div>
                      </Card>
                      
                      {/* Success Checkmark */}
                      {isVisible && index < visibleNodes.length - 1 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                        >
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Workflow Complete Indicator */}
          {!isBuilding && visibleNodes.length === currentWorkflow.nodes.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 right-4"
            >
              <Badge className={`bg-gradient-to-r ${currentWorkflow.color} text-white border-0 shadow-lg`}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Workflow Complete
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span>Trigger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-yellow-500" />
            <span>Filter</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Action</span>
          </div>
        </div>
      </div>
    </div>
  );
}
