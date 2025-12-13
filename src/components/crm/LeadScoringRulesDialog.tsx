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
  Target, 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Settings2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LeadScoringRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Rule {
  id: string;
  name: string;
  description: string | null;
  type: 'property' | 'behavior' | 'engagement' | 'demographic' | 'firmographic';
  field: string;
  operator: string;
  value: string | null;
  valueSecondary: string | null;
  scoreChange: number;
  priority: number;
  isEnabled: boolean;
}

interface AvailableField {
  field: string;
  label: string;
  type: string;
  valueType: string;
  options?: string[];
}

export function LeadScoringRulesDialog({ open, onOpenChange }: LeadScoringRulesDialogProps) {
  const { data, error, mutate } = useSWR(open ? '/api/crm/scoring-rules' : null, fetcher);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState<{
    name: string;
    type: 'property' | 'behavior' | 'engagement' | 'demographic' | 'firmographic';
    field: string;
    operator: string;
    value: string;
    valueSecondary: string;
    scoreChange: number;
  }>({
    name: '',
    type: 'behavior',
    field: '',
    operator: 'greater_than',
    value: '',
    valueSecondary: '',
    scoreChange: 10,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rules: Rule[] = data?.rules || [];
  const availableFields: AvailableField[] = data?.availableFields || [];
  const tiers = data?.tiers || [];
  const baseScore = data?.baseScore || 50;

  const selectedField = availableFields.find((f) => f.field === newRule.field);

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.field) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crm/scoring-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create rule');
      }

      mutate();
      setShowAddRule(false);
      setNewRule({
        name: '',
        type: 'behavior',
        field: '',
        operator: 'greater_than',
        value: '',
        valueSecondary: '',
        scoreChange: 10,
      });
      toast.success('Rule created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/crm/scoring-rules/${ruleId}`, {
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
      await fetch(`/api/crm/scoring-rules/${ruleId}`, { method: 'DELETE' });
      mutate();
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Lead Scoring Rules
          </DialogTitle>
          <DialogDescription>
            Configure how leads are scored based on their properties and behavior.
            Base score: {baseScore} points.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Tier Overview */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Score Tiers
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {tiers.map((tier: { name: string; minScore: number; maxScore: number; color: string }) => (
                <Card 
                  key={tier.name} 
                  className="p-3 text-center"
                  style={{ borderColor: `var(--${tier.color}-500, gray)` }}
                >
                  <p className="font-medium text-sm">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tier.minScore}-{tier.maxScore} pts
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Scoring Rules ({rules.length})
              </h3>
              <Button size="sm" onClick={() => setShowAddRule(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </div>

            {rules.length === 0 && !showAddRule ? (
              <Card className="p-6 text-center">
                <Target className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No custom rules configured</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Using default scoring algorithm. Add rules to customize.
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
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          If <span className="font-mono">{rule.field}</span>{' '}
                          {rule.operator.replace('_', ' ')}{' '}
                          {rule.value && <span className="font-mono">{rule.value}</span>}
                          {rule.valueSecondary && ` - ${rule.valueSecondary}`}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          rule.scoreChange > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {rule.scoreChange > 0 ? (
                          <>
                            <ArrowUp className="h-3 w-3 mr-1" />
                            +{rule.scoreChange}
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {rule.scoreChange}
                          </>
                        )}
                      </Badge>
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
                <h4 className="font-medium text-sm mb-4">New Scoring Rule</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        placeholder="e.g., High email engagement"
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-type">Category</Label>
                      <Select
                        value={newRule.type}
                        onValueChange={(v) => setNewRule({ ...newRule, type: v as typeof newRule.type })}
                      >
                        <SelectTrigger id="rule-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="behavior">Behavior</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="property">Property</SelectItem>
                          <SelectItem value="demographic">Demographic</SelectItem>
                          <SelectItem value="firmographic">Firmographic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-field">Field</Label>
                      <Select
                        value={newRule.field}
                        onValueChange={(v) => setNewRule({ ...newRule, field: v })}
                      >
                        <SelectTrigger id="rule-field">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields
                            .filter((f) => f.type === newRule.type)
                            .map((f) => (
                              <SelectItem key={f.field} value={f.field}>
                                {f.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-operator">Condition</Label>
                      <Select
                        value={newRule.operator}
                        onValueChange={(v) => setNewRule({ ...newRule, operator: v })}
                      >
                        <SelectTrigger id="rule-operator">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedField?.valueType === 'boolean' ? (
                            <>
                              <SelectItem value="equals">Is True</SelectItem>
                              <SelectItem value="not_equals">Is False</SelectItem>
                            </>
                          ) : selectedField?.valueType === 'number' ? (
                            <>
                              <SelectItem value="greater_than">Greater than</SelectItem>
                              <SelectItem value="less_than">Less than</SelectItem>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="between">Between</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="not_equals">Not equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="not_contains">Does not contain</SelectItem>
                              <SelectItem value="is_set">Is set</SelectItem>
                              <SelectItem value="is_not_set">Is not set</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rule-value">Value</Label>
                      {selectedField?.options ? (
                        <Select
                          value={newRule.value}
                          onValueChange={(v) => setNewRule({ ...newRule, value: v })}
                        >
                          <SelectTrigger id="rule-value">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedField.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : selectedField?.valueType === 'boolean' ? (
                        <Input id="rule-value" disabled placeholder="N/A for boolean" />
                      ) : (
                        <Input
                          id="rule-value"
                          type={selectedField?.valueType === 'number' ? 'number' : 'text'}
                          placeholder="Enter value"
                          value={newRule.value}
                          onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                          disabled={['is_set', 'is_not_set'].includes(newRule.operator)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-score">Score Change</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNewRule({ ...newRule, scoreChange: newRule.scoreChange - 5 })}
                          className="h-9 w-9"
                        >
                          <TrendingDown className="h-4 w-4" />
                        </Button>
                        <Input
                          id="rule-score"
                          type="number"
                          value={newRule.scoreChange}
                          onChange={(e) => setNewRule({ ...newRule, scoreChange: parseInt(e.target.value) || 0 })}
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNewRule({ ...newRule, scoreChange: newRule.scoreChange + 5 })}
                          className="h-9 w-9"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {newRule.scoreChange > 0 ? 'Adds' : 'Subtracts'} {Math.abs(newRule.scoreChange)} points
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowAddRule(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRule} disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Rule'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

