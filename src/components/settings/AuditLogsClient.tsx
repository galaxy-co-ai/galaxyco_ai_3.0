"use client";

/**
 * Audit Logs Client Component
 * 
 * Features:
 * - Filterable audit log entries
 * - Expandable rows for details
 * - Date range filtering
 * - Export to CSV
 * - Real-time refresh
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Filter,
  Calendar,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';

interface AuditEntry {
  id: string;
  actionType: string;
  agentId?: string;
  agentName?: string;
  teamId?: string;
  teamName?: string;
  userId?: string;
  userName?: string;
  wasAutomatic: boolean;
  success: boolean;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  createdAt: string;
}

interface AuditLogsClientProps {
  initialEntries: AuditEntry[];
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'agent:execution', label: 'Agent Execution' },
  { value: 'agent:created', label: 'Agent Created' },
  { value: 'agent:updated', label: 'Agent Updated' },
  { value: 'agent:deleted', label: 'Agent Deleted' },
  { value: 'contact:created', label: 'Contact Created' },
  { value: 'contact:updated', label: 'Contact Updated' },
  { value: 'deal:created', label: 'Deal Created' },
  { value: 'deal:updated', label: 'Deal Updated' },
  { value: 'workflow:triggered', label: 'Workflow Triggered' },
  { value: 'approval:requested', label: 'Approval Requested' },
  { value: 'approval:granted', label: 'Approval Granted' },
  { value: 'approval:denied', label: 'Approval Denied' },
];

export default function AuditLogsClient({ initialEntries }: AuditLogsClientProps) {
  const [entries, setEntries] = useState<AuditEntry[]>(initialEntries);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [actionType, setActionType] = useState('all');
  const [automationFilter, setAutomationFilter] = useState<'all' | 'automatic' | 'manual'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionType !== 'all') params.set('actionType', actionType);
      if (automationFilter === 'automatic') params.set('wasAutomatic', 'true');
      if (automationFilter === 'manual') params.set('wasAutomatic', 'false');
      if (statusFilter === 'success') params.set('success', 'true');
      if (statusFilter === 'failed') params.set('success', 'false');
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('limit', '100');

      const response = await fetch(`/api/orchestration/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setIsLoading(false);
    }
  }, [actionType, automationFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Action', 'Agent', 'User', 'Type', 'Status', 'Duration'];
    const rows = entries.map((entry) => [
      new Date(entry.createdAt).toISOString(),
      entry.actionType,
      entry.agentName || '-',
      entry.userName || '-',
      entry.wasAutomatic ? 'Automatic' : 'Manual',
      entry.success ? 'Success' : 'Failed',
      entry.durationMs ? `${entry.durationMs}ms` : '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('agent')) return <Bot className="h-4 w-4" />;
    if (actionType.includes('contact') || actionType.includes('deal')) return <User className="h-4 w-4" />;
    if (actionType.includes('workflow')) return <Zap className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchEntries}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={automationFilter}
                onValueChange={(v) => setAutomationFilter(v as typeof automationFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Log
              </CardTitle>
              <CardDescription>
                {entries.length} entries found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground mb-1">No audit entries</h3>
                  <p className="text-sm text-muted-foreground">
                    No entries match your current filters
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <Collapsible
                    key={entry.id}
                    open={expandedIds.has(entry.id)}
                    onOpenChange={() => toggleExpanded(entry.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="shrink-0">
                          {expandedIds.has(entry.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            {getActionIcon(entry.actionType)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {entry.actionType.replace(/[.:]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                              {entry.agentName && (
                                <span className="text-muted-foreground text-sm">
                                  • {entry.agentName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(entry.createdAt)}
                              {entry.userName && (
                                <>
                                  <span>•</span>
                                  <User className="h-3 w-3" />
                                  {entry.userName}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="soft"
                            tone={entry.wasAutomatic ? 'violet' : 'neutral'}
                            size="sm"
                          >
                            {entry.wasAutomatic ? (
                              <>
                                <Zap className="h-3 w-3" />
                                Auto
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3" />
                                Manual
                              </>
                            )}
                          </Badge>

                          <Badge
                            variant="soft"
                            tone={entry.success ? 'success' : 'danger'}
                            size="sm"
                          >
                            {entry.success ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Success
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Failed
                              </>
                            )}
                          </Badge>

                          {entry.durationMs && (
                            <Badge variant="soft" tone="neutral" size="sm">
                              <Clock className="h-3 w-3" />
                              {entry.durationMs}ms
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-6 pb-4 pt-2 ml-12 space-y-4 bg-muted/30 border-t">
                        {entry.input && Object.keys(entry.input).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Input
                            </h4>
                            <pre className="text-xs bg-background rounded-lg p-3 overflow-auto max-h-40 border">
                              {JSON.stringify(entry.input, null, 2)}
                            </pre>
                          </div>
                        )}

                        {entry.output && Object.keys(entry.output).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Output
                            </h4>
                            <pre className="text-xs bg-background rounded-lg p-3 overflow-auto max-h-40 border">
                              {JSON.stringify(entry.output, null, 2)}
                            </pre>
                          </div>
                        )}

                        {entry.error && (
                          <div>
                            <h4 className="text-xs font-semibold text-red-600 uppercase mb-2">
                              Error
                            </h4>
                            <pre className="text-xs bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-lg p-3 border border-red-200 dark:border-red-800">
                              {entry.error}
                            </pre>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                          <span>ID: {entry.id}</span>
                          {entry.teamId && <span>Team: {entry.teamName || entry.teamId}</span>}
                          {entry.agentId && <span>Agent: {entry.agentName || entry.agentId}</span>}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
