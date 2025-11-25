import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { 
  X, 
  Play, 
  Settings, 
  Activity, 
  FileJson, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Zap,
  TrendingUp,
  Copy,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface NodeInspectorProps {
  node: {
    id: number;
    type: string;
    icon: any;
    label: string;
    gradient: string;
    workflowId: number;
  };
  onClose: () => void;
  onTest?: (nodeId: number) => void;
}

export function NodeInspector({ node, onClose, onTest }: NodeInspectorProps) {
  const [isRunning, setIsRunning] = useState(false);

  // Mock data for demonstration
  const executionStats = {
    totalRuns: 1247,
    successRate: 98.4,
    avgDuration: "1.2s",
    lastRun: "2 minutes ago",
    errorCount: 3,
    costToday: "$0.24"
  };

  const recentLogs = [
    { time: "14:32:15", level: "success", message: "Email processed successfully", duration: "1.1s" },
    { time: "14:30:42", level: "success", message: "Data extracted from invoice #INV-2847", duration: "0.9s" },
    { time: "14:28:19", level: "success", message: "Filtered 3 matching emails", duration: "1.3s" },
    { time: "14:25:33", level: "warning", message: "Rate limit approaching (80%)", duration: "1.0s" },
    { time: "14:22:08", level: "success", message: "CRM record updated", duration: "1.5s" },
  ];

  const sampleData = {
    input: {
      email: {
        from: "vendor@acme.com",
        subject: "Invoice #INV-2847",
        body: "Please find attached invoice for services rendered...",
        attachments: ["invoice-2847.pdf"]
      }
    },
    output: {
      invoiceNumber: "INV-2847",
      amount: 1250.00,
      vendor: "ACME Corp",
      dueDate: "2025-11-20",
      extracted: true
    }
  };

  const handleTestNode = () => {
    setIsRunning(true);
    if (onTest) {
      onTest(node.id);
    }
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-background border-l border-border z-20 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${node.gradient} flex items-center justify-center shadow-md`}>
              <node.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm mb-1">{node.label}</h3>
              <p className="text-xs text-muted-foreground">Node #{node.id}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
            <p className="text-sm font-medium">{executionStats.successRate}%</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-muted-foreground">Avg Time</p>
            </div>
            <p className="text-sm font-medium">{executionStats.avgDuration}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-amber-600" />
              <p className="text-xs text-muted-foreground">Runs</p>
            </div>
            <p className="text-sm font-medium">{executionStats.totalRuns}</p>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          className="w-full mt-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
          onClick={handleTestNode}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Testing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Test This Node
            </>
          )}
        </Button>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger 
            value="config" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Config
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger 
            value="data" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
          >
            <FileJson className="h-3.5 w-3.5 mr-1.5" />
            Data
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="config" className="p-4 space-y-4 m-0">
            {/* Configuration Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-name" className="text-xs">Node Name</Label>
                <Input 
                  id="node-name"
                  defaultValue={node.label}
                  className="mt-1.5 h-9"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="What does this node do?"
                  className="mt-1.5 min-h-20 resize-none"
                  defaultValue="Monitors inbox for incoming emails matching specific criteria"
                />
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-medium mb-3">Node Settings</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-retry" className="text-xs font-normal">Auto Retry</Label>
                      <p className="text-xs text-muted-foreground">Retry failed executions</p>
                    </div>
                    <Switch id="auto-retry" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="logging" className="text-xs font-normal">Detailed Logging</Label>
                      <p className="text-xs text-muted-foreground">Log all data inputs/outputs</p>
                    </div>
                    <Switch id="logging" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications" className="text-xs font-normal">Error Notifications</Label>
                      <p className="text-xs text-muted-foreground">Alert on failures</p>
                    </div>
                    <Switch id="notifications" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Type-specific settings */}
              <div>
                <h4 className="text-xs font-medium mb-3">Email Filter Settings</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="sender" className="text-xs">Sender Contains</Label>
                    <Input 
                      id="sender"
                      placeholder="e.g., @vendor.com"
                      className="mt-1.5 h-9"
                      defaultValue="@vendor.com, invoice@"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-xs">Subject Keywords</Label>
                    <Input 
                      id="subject"
                      placeholder="e.g., invoice, payment"
                      className="mt-1.5 h-9"
                      defaultValue="invoice, INV-, payment"
                    />
                  </div>

                  <div>
                    <Label htmlFor="attachment" className="text-xs">Has Attachment</Label>
                    <Switch id="attachment" defaultChecked className="mt-1.5" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Advanced */}
              <div>
                <h4 className="text-xs font-medium mb-3">Advanced</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="timeout" className="text-xs">Timeout (seconds)</Label>
                    <Input 
                      id="timeout"
                      type="number"
                      defaultValue="30"
                      className="mt-1.5 h-9"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rate-limit" className="text-xs">Rate Limit (per minute)</Label>
                    <Input 
                      id="rate-limit"
                      type="number"
                      defaultValue="60"
                      className="mt-1.5 h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-4 space-y-4 m-0">
            {/* Performance Overview */}
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-medium">Performance</h4>
                </div>
                <Badge variant="outline" className="bg-white text-xs">
                  Last 24h
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Total Executions</p>
                  <p className="font-medium">{executionStats.totalRuns}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cost Today</p>
                  <p className="font-medium">{executionStats.costToday}</p>
                </div>
              </div>
            </Card>

            {/* Error Summary */}
            {executionStats.errorCount > 0 && (
              <Card className="p-3 bg-red-50 border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h4 className="text-xs font-medium text-red-900">Recent Errors</h4>
                </div>
                <p className="text-xs text-red-700">
                  {executionStats.errorCount} failures in the last 24 hours
                </p>
                <Button variant="link" className="h-auto p-0 text-xs text-red-600 mt-1">
                  View error details <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Card>
            )}

            {/* Recent Activity Logs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium">Recent Activity</h4>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View All
                </Button>
              </div>

              <div className="space-y-2">
                {recentLogs.map((log, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      log.level === 'success' ? 'bg-green-500' : 
                      log.level === 'warning' ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate">{log.message}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{log.duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Last Execution */}
            <div>
              <h4 className="text-xs font-medium mb-2">Last Execution</h4>
              <div className="text-xs text-muted-foreground">
                {executionStats.lastRun}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="p-4 space-y-4 m-0">
            {/* Sample Input/Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium">Sample Input</h4>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(sampleData.input, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium">Sample Output</h4>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(sampleData.output, null, 2)}
                </pre>
              </div>
            </div>

            {/* Data Schema */}
            <div>
              <h4 className="text-xs font-medium mb-2">Expected Schema</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="font-mono">email.from</span>
                  <Badge variant="outline" className="text-xs">string</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="font-mono">email.subject</span>
                  <Badge variant="outline" className="text-xs">string</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="font-mono">email.body</span>
                  <Badge variant="outline" className="text-xs">string</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="font-mono">email.attachments</span>
                  <Badge variant="outline" className="text-xs">array</Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
          Save Changes
        </Button>
        <Button variant="outline" className="w-full">
          Reset to Default
        </Button>
      </div>
    </div>
  );
}
