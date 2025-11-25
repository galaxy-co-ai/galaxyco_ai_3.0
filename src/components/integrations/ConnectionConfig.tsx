import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
  X, 
  GitBranch, 
  Filter, 
  Code,
  Clock,
  AlertTriangle,
  Zap,
  ArrowRight,
  Plus,
  Trash2
} from "lucide-react";

interface ConnectionConfigProps {
  connection: {
    from: number;
    to: number;
    fromNode?: { label: string };
    toNode?: { label: string };
  };
  position: { x: number; y: number };
  onClose: () => void;
  onDelete?: () => void;
}

export function ConnectionConfig({ connection, position, onClose, onDelete }: ConnectionConfigProps) {
  const [hasCondition, setHasCondition] = useState(false);
  const [hasTransform, setHasTransform] = useState(false);
  const [hasDelay, setHasDelay] = useState(false);

  return (
    <div 
      className="absolute z-30 w-80 bg-background border border-border rounded-xl shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-medium">Connection</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-[100px]">{connection.fromNode?.label || `Node ${connection.from}`}</span>
              <ArrowRight className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">{connection.toNode?.label || `Node ${connection.to}`}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transform" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-4">
          <TabsTrigger 
            value="transform" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
          >
            <Code className="h-3 w-3 mr-1.5" />
            Transform
          </TabsTrigger>
          <TabsTrigger 
            value="conditions" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
          >
            <GitBranch className="h-3 w-3 mr-1.5" />
            Conditions
          </TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs"
          >
            <Zap className="h-3 w-3 mr-1.5" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-80">
          <TabsContent value="transform" className="p-4 space-y-4 m-0">
            {/* Data Transformation */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-normal">Enable Transform</Label>
                <p className="text-xs text-muted-foreground">Map and transform data</p>
              </div>
              <Switch 
                checked={hasTransform}
                onCheckedChange={setHasTransform}
              />
            </div>

            {hasTransform && (
              <>
                <Separator />
                
                <div>
                  <Label className="text-xs mb-2">Field Mappings</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="source.field"
                        className="h-8 text-xs flex-1 font-mono"
                      />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Input 
                        placeholder="target.field"
                        className="h-8 text-xs flex-1 font-mono"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="email.from"
                        className="h-8 text-xs flex-1 font-mono"
                        defaultValue="email.from"
                      />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Input 
                        placeholder="sender"
                        className="h-8 text-xs flex-1 font-mono"
                        defaultValue="sender"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-8 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Mapping
                  </Button>
                </div>

                <div>
                  <Label htmlFor="transform-code" className="text-xs">Custom Transform (JavaScript)</Label>
                  <Textarea
                    id="transform-code"
                    placeholder="return { ...data, processed: true };"
                    className="mt-2 font-mono text-xs min-h-24 resize-none"
                    defaultValue="// Transform incoming data\nreturn {\n  ...data,\n  timestamp: new Date().toISOString()\n};"
                  />
                </div>
              </>
            )}

            {!hasTransform && (
              <div className="text-center py-8 text-muted-foreground">
                <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Enable transformation to map fields</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="p-4 space-y-4 m-0">
            {/* Conditional Routing */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-normal">Enable Conditions</Label>
                <p className="text-xs text-muted-foreground">Route based on criteria</p>
              </div>
              <Switch 
                checked={hasCondition}
                onCheckedChange={setHasCondition}
              />
            </div>

            {hasCondition && (
              <>
                <Separator />

                <div>
                  <Label className="text-xs mb-2">Condition Rules</Label>
                  <div className="space-y-3 mt-2">
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Input 
                          placeholder="Field"
                          className="h-8 text-xs font-mono"
                          defaultValue="status"
                        />
                        <select className="h-8 text-xs px-2 rounded-md border border-border bg-background">
                          <option>equals</option>
                          <option>contains</option>
                          <option>greater than</option>
                          <option>less than</option>
                        </select>
                        <Input 
                          placeholder="Value"
                          className="h-8 text-xs"
                          defaultValue="success"
                        />
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-red-600">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove Rule
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-8 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rule
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Condition Logic</Label>
                  <select className="w-full mt-2 h-9 text-xs px-3 rounded-md border border-border bg-background">
                    <option>Match ALL rules (AND)</option>
                    <option>Match ANY rule (OR)</option>
                  </select>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-900">Fallback Route</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        If no conditions match, data will be dropped
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!hasCondition && (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Enable conditions for smart routing</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4 m-0">
            {/* Advanced Settings */}
            <div>
              <Label className="text-xs mb-3">Execution Settings</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-normal">Add Delay</Label>
                    <p className="text-xs text-muted-foreground">Wait before executing</p>
                  </div>
                  <Switch 
                    checked={hasDelay}
                    onCheckedChange={setHasDelay}
                  />
                </div>

                {hasDelay && (
                  <div className="pl-4 border-l-2 border-blue-200">
                    <Label htmlFor="delay-time" className="text-xs">Delay Duration</Label>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        id="delay-time"
                        type="number"
                        defaultValue="5"
                        className="h-8 text-xs flex-1"
                      />
                      <select className="h-8 text-xs px-2 rounded-md border border-border bg-background">
                        <option>seconds</option>
                        <option>minutes</option>
                        <option>hours</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs mb-3">Error Handling</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-normal">Retry on Failure</Label>
                    <p className="text-xs text-muted-foreground">Auto-retry failed executions</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div>
                  <Label htmlFor="retry-count" className="text-xs">Max Retries</Label>
                  <Input 
                    id="retry-count"
                    type="number"
                    defaultValue="3"
                    className="mt-2 h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs mb-2">Rate Limiting</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="rate-limit" className="text-xs text-muted-foreground">Max per minute</Label>
                  <Input 
                    id="rate-limit"
                    type="number"
                    defaultValue="60"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="burst-limit" className="text-xs text-muted-foreground">Burst limit</Label>
                  <Input 
                    id="burst-limit"
                    type="number"
                    defaultValue="10"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button className="w-full h-9 bg-blue-500 hover:bg-blue-600 text-white">
          Save Connection
        </Button>
        {onDelete && (
          <Button 
            variant="outline" 
            className="w-full h-9 text-red-600 border-red-200 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete Connection
          </Button>
        )}
      </div>
    </div>
  );
}
