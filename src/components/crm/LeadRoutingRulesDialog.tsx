'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Route, 
  Users,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LeadRoutingRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Rule {
  id: string;
  name: string;
  description: string | null;
  criteria: {
    conditions: Array<{
      field: string;
      operator: string;
      value: string | number | string[];
    }>;
    matchType: 'all' | 'any';
  };
  assignToUserId: string | null;
  roundRobinUserIds: string[];
  priority: number;
  isEnabled: boolean;
  matchCount: number;
  lastMatchedAt: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface AvailableField {
  field: string;
  label: string;
  valueType: string;
  options?: string[];
}

export function LeadRoutingRulesDialog({ open, onOpenChange }: LeadRoutingRulesDialogProps) {
  const { data, error, mutate } = useSWR(open ? '/api/crm/routing-rules' : null, fetcher);
  const [showAddRule, setShowAddRule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newRule, setNewRule] = useState({
    name: '',
    matchType: 'all' as 'all' | 'any',
    conditions: [{ field: 'source', operator: 'equals', value: '' }],
    assignmentType: 'direct' as 'direct' | 'round_robin',
    assignToUserId: '',
    roundRobinUserIds: [] as string[],
    priority: 0,
  });

  const rules: Rule[] = data?.rules || [];
  const teamMembers: TeamMember[] = data?.teamMembers || [];
  const availableFields: AvailableField[] = data?.availableFields || [];

  const handleAddCondition = () => {
    setNewRule({
      ...newRule,
      conditions: [...newRule.conditions, { field: 'source', operator: 'equals', value: '' }],
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (newRule.conditions.length > 1) {
      setNewRule({
        ...newRule,
        conditions: newRule.conditions.filter((_, i) => i !== index),
      });
    }
  };

  const handleConditionChange = (index: number, field: string, value: string) => {
    const conditions = [...newRule.conditions];
    conditions[index] = { ...conditions[index], [field]: value };
    setNewRule({ ...newRule, conditions });
  };

  const handleToggleRoundRobinUser = (userId: string) => {
    const current = newRule.roundRobinUserIds;
    if (current.includes(userId)) {
      setNewRule({ ...newRule, roundRobinUserIds: current.filter((id) => id !== userId) });
    } else {
      setNewRule({ ...newRule, roundRobinUserIds: [...current, userId] });
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name) {
      toast.error('Please enter a rule name');
      return;
    }
    if (newRule.conditions.some((c) => !c.value)) {
      toast.error('Please fill in all condition values');
      return;
    }
    if (newRule.assignmentType === 'direct' && !newRule.assignToUserId) {
      toast.error('Please select a user to assign leads to');
      return;
    }
    if (newRule.assignmentType === 'round_robin' && newRule.roundRobinUserIds.length === 0) {
      toast.error('Please select at least one user for round-robin');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crm/routing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRule.name,
          criteria: {
            conditions: newRule.conditions,
            matchType: newRule.matchType,
          },
          assignToUserId: newRule.assignmentType === 'direct' ? newRule.assignToUserId : null,
          roundRobinUserIds: newRule.assignmentType === 'round_robin' ? newRule.roundRobinUserIds : [],
          priority: newRule.priority,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create rule');
      }

      mutate();
      setShowAddRule(false);
      setNewRule({
        name: '',
        matchType: 'all',
        conditions: [{ field: 'source', operator: 'equals', value: '' }],
        assignmentType: 'direct',
        assignToUserId: '',
        roundRobinUserIds: [],
        priority: 0,
      });
      toast.success('Routing rule created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/crm/routing-rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: enabled }),
      });
      mutate();
      toast.success(enabled ? 'Rule enabled' : 'Rule disabled');
    } catch {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetch(`/api/crm/routing-rules/${ruleId}`, { method: 'DELETE' });
      mutate();
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const getFieldLabel = (field: string) => {
    return availableFields.find((f) => f.field === field)?.label || field;
  };

  const formatOperator = (op: string) => {
    const map: Record<string, string> = {
      equals: 'equals',
      not_equals: 'is not',
      contains: 'contains',
      greater_than: '>',
      less_than: '<',
      in: 'is one of',
    };
    return map[op] || op;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Lead Routing Rules
          </DialogTitle>
          <DialogDescription>
            Automatically assign new leads to team members based on criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Rules List */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Rules ({rules.filter(r => r.isEnabled).length})</h3>
            <Button size="sm" onClick={() => setShowAddRule(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>

          {rules.length === 0 && !showAddRule ? (
            <Card className="p-6 text-center">
              <Route className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">No routing rules configured</p>
              <p className="text-xs text-muted-foreground mb-4">
                Leads will not be auto-assigned until rules are created.
              </p>
              <Button size="sm" onClick={() => setShowAddRule(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Rule
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`p-3 ${!rule.isEnabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.isEnabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      aria-label="Toggle rule"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{rule.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          Priority: {rule.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        When{' '}
                        {rule.criteria.conditions.map((c, i) => (
                          <span key={i}>
                            {i > 0 && (
                              <span className="mx-1 text-primary font-medium">
                                {rule.criteria.matchType.toUpperCase()}
                              </span>
                            )}
                            <span className="font-mono">{getFieldLabel(c.field)}</span>{' '}
                            {formatOperator(c.operator)}{' '}
                            <span className="font-mono">{String(c.value)}</span>
                          </span>
                        ))}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {rule.assignToUserId ? (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {teamMembers.find((m) => m.id === rule.assignToUserId)?.name || 'User'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Round-robin ({rule.roundRobinUserIds.length} users)
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {rule.matchCount} leads routed
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      aria-label="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add Rule Form */}
          {showAddRule && (
            <Card className="p-4 border-primary">
              <h4 className="font-medium text-sm mb-4">New Routing Rule</h4>
              <div className="space-y-4">
                {/* Rule Name */}
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g., Enterprise leads to Sales Team"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  />
                </div>

                {/* Conditions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Conditions</Label>
                    <Select
                      value={newRule.matchType}
                      onValueChange={(v) => setNewRule({ ...newRule, matchType: v as 'all' | 'any' })}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Match ALL</SelectItem>
                        <SelectItem value="any">Match ANY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRule.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={condition.field}
                        onValueChange={(v) => handleConditionChange(index, 'field', v)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((f) => (
                            <SelectItem key={f.field} value={f.field}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(v) => handleConditionChange(index, 'operator', v)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">equals</SelectItem>
                          <SelectItem value="not_equals">is not</SelectItem>
                          <SelectItem value="contains">contains</SelectItem>
                          <SelectItem value="greater_than">greater than</SelectItem>
                          <SelectItem value="less_than">less than</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Value"
                        value={String(condition.value)}
                        onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                        className="flex-1"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCondition(index)}
                        disabled={newRule.conditions.length === 1}
                        className="h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" onClick={handleAddCondition}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {/* Assignment Type */}
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={newRule.assignmentType === 'direct' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewRule({ ...newRule, assignmentType: 'direct' })}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Direct Assignment
                    </Button>
                    <Button
                      variant={newRule.assignmentType === 'round_robin' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewRule({ ...newRule, assignmentType: 'round_robin' })}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Round Robin
                    </Button>
                  </div>
                </div>

                {/* User Selection */}
                {newRule.assignmentType === 'direct' ? (
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select
                      value={newRule.assignToUserId}
                      onValueChange={(v) => setNewRule({ ...newRule, assignToUserId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Team Members ({newRule.roundRobinUserIds.length} selected)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleToggleRoundRobinUser(member.id)}
                          className={`p-2 text-left text-sm rounded border ${
                            newRule.roundRobinUserIds.includes(member.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="rule-priority">Priority (higher = first to match)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setNewRule({ ...newRule, priority: newRule.priority - 1 })}
                      className="h-9 w-9"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Input
                      id="rule-priority"
                      type="number"
                      value={newRule.priority}
                      onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setNewRule({ ...newRule, priority: newRule.priority + 1 })}
                      className="h-9 w-9"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowAddRule(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRule} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Rule'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

