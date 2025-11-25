import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play,
  X,
  ChevronRight,
  Terminal,
  Calendar,
  Zap,
  FileJson,
  Copy,
  ExternalLink
} from "lucide-react";

export interface TestResult {
  id: string;
  timestamp: Date;
  nodeName: string;
  nodeId: number;
  status: 'success' | 'error';
  duration: string;
  input?: any;
  output?: any;
  error?: string;
  logs?: string[];
}

interface TestResultsPanelProps {
  testResults: TestResult[];
  onClear: () => void;
}

export function TestResultsPanel({ testResults, onClear }: TestResultsPanelProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const stats = {
    total: testResults.length,
    success: testResults.filter(r => r.status === 'success').length,
    error: testResults.filter(r => r.status === 'error').length,
    avgDuration: testResults.length > 0 
      ? (testResults.reduce((sum, r) => sum + parseFloat(r.duration), 0) / testResults.length).toFixed(2) + 's'
      : '0s',
  };

  const successRate = testResults.length > 0 
    ? ((stats.success / stats.total) * 100).toFixed(1)
    : '0';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-72 lg:w-80 xl:w-96 bg-background border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium">Test Results</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClear}
            disabled={testResults.length === 0}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Stats */}
        {testResults.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                <p className="text-sm font-medium">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg border bg-green-50 border-green-200">
                <p className="text-xs text-muted-foreground mb-0.5">Passed</p>
                <p className="text-sm font-medium text-green-600">{stats.success}</p>
              </div>
              <div className="p-2 rounded-lg border bg-red-50 border-red-200">
                <p className="text-xs text-muted-foreground mb-0.5">Failed</p>
                <p className="text-sm font-medium text-red-600">{stats.error}</p>
              </div>
            </div>

            {/* Success Rate Bar */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Success Rate</span>
                <span className="text-sm font-bold text-blue-600">{successRate}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Play className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No tests run yet</p>
            <p className="text-xs mt-1">Click "Test This Node" to start</p>
          </div>
        )}
      </div>

      {/* Test Results List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {testResults.map((result) => {
            const isExpanded = expandedTest === result.id;
            
            return (
              <div
                key={result.id}
                className={`rounded-lg border transition-all ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {/* Test Header */}
                <button
                  onClick={() => setExpandedTest(isExpanded ? null : result.id)}
                  className="w-full p-3 text-left hover:bg-black/5 transition-colors rounded-lg"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {result.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{result.nodeName}</p>
                        <ChevronRight 
                          className={`h-4 w-4 flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(result.timestamp)}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(result.timestamp)}</span>
                        <span>•</span>
                        <Zap className="h-3 w-3" />
                        <span>{result.duration}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <Separator />
                    
                    {/* Status Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-medium">Status</Label>
                        <Badge 
                          variant={result.status === 'success' ? 'default' : 'destructive'}
                          className="h-5 text-xs"
                        >
                          {result.status === 'success' ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                      {result.error && (
                        <div className="bg-white rounded p-2 text-xs text-red-700 font-mono">
                          {result.error}
                        </div>
                      )}
                    </div>

                    {/* Input Data */}
                    {result.input && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-xs font-medium flex items-center gap-1">
                            <FileJson className="h-3 w-3" />
                            Input Data
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-xs px-2"
                            onClick={() => copyToClipboard(JSON.stringify(result.input, null, 2))}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-white rounded p-2 font-mono text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result.input, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Output Data */}
                    {result.output && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-xs font-medium flex items-center gap-1">
                            <FileJson className="h-3 w-3" />
                            Output Data
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-xs px-2"
                            onClick={() => copyToClipboard(JSON.stringify(result.output, null, 2))}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-white rounded p-2 font-mono text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Logs */}
                    {result.logs && result.logs.length > 0 && (
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">Execution Logs</Label>
                        <div className="bg-white rounded p-2 space-y-1 max-h-32 overflow-y-auto">
                          {result.logs.map((log, idx) => (
                            <div key={idx} className="text-xs font-mono text-muted-foreground">
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Full Details
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      {testResults.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Average Duration</span>
            <span className="font-medium">{stats.avgDuration}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8"
            onClick={onClear}
          >
            Clear All Results
          </Button>
        </div>
      )}
    </div>
  );
}

function Label({ className, children, ...props }: React.ComponentPropsWithoutRef<'label'>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
}
