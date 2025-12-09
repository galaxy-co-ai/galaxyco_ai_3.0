'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Trash2, Bot, Sparkles } from 'lucide-react';

// Validation schema
const agentConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']),
});

type AgentConfigForm = z.infer<typeof agentConfigSchema>;

interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
}

interface AgentConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  onSuccess: () => void;
}

// Agent type display info
const agentTypeInfo: Record<string, { label: string; color: string }> = {
  scope: { label: 'Scope', color: 'bg-blue-100 text-blue-700' },
  call: { label: 'Call', color: 'bg-emerald-100 text-emerald-700' },
  email: { label: 'Email', color: 'bg-purple-100 text-purple-700' },
  note: { label: 'Note', color: 'bg-yellow-100 text-yellow-700' },
  task: { label: 'Task', color: 'bg-orange-100 text-orange-700' },
  roadmap: { label: 'Roadmap', color: 'bg-pink-100 text-pink-700' },
  content: { label: 'Content', color: 'bg-indigo-100 text-indigo-700' },
  custom: { label: 'Custom', color: 'bg-gray-100 text-gray-700' },
  browser: { label: 'Browser', color: 'bg-cyan-100 text-cyan-700' },
  knowledge: { label: 'Knowledge', color: 'bg-teal-100 text-teal-700' },
  sales: { label: 'Sales', color: 'bg-green-100 text-green-700' },
  research: { label: 'Research', color: 'bg-violet-100 text-violet-700' },
  meeting: { label: 'Meeting', color: 'bg-rose-100 text-rose-700' },
  code: { label: 'Code', color: 'bg-slate-100 text-slate-700' },
  data: { label: 'Data', color: 'bg-amber-100 text-amber-700' },
};

export function AgentConfigModal({
  open,
  onOpenChange,
  agent,
  onSuccess,
}: AgentConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<AgentConfigForm>({
    resolver: zodResolver(agentConfigSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
    },
  });

  // Update form when agent changes
  useEffect(() => {
    if (agent && open) {
      form.reset({
        name: agent.name,
        description: agent.description || '',
        status: agent.status as AgentConfigForm['status'],
      });
    }
  }, [agent, open, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: AgentConfigForm) => {
    if (!agent) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          status: data.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update agent');
      }

      toast.success('Agent updated successfully');
      handleClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete agent');
      }

      toast.success('Agent deleted successfully');
      setShowDeleteDialog(false);
      handleClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete agent');
    } finally {
      setIsDeleting(false);
    }
  };

  const typeInfo = agent ? agentTypeInfo[agent.type] || { label: agent.type, color: 'bg-gray-100 text-gray-700' } : null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                <Bot className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-xl">Configure Agent</DialogTitle>
                <DialogDescription>
                  Update settings and configuration for this agent.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {agent && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              {/* Agent Type Badge */}
              {typeInfo && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${typeInfo.color}`}>
                    {typeInfo.label} Agent
                  </span>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="Enter agent name"
                  {...form.register('name')}
                  aria-invalid={!!form.formState.errors.name}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this agent does"
                  rows={3}
                  {...form.register('description')}
                  aria-invalid={!!form.formState.errors.description}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Status Field */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as AgentConfigForm['status'])}
                >
                  <SelectTrigger id="status" aria-label="Select agent status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Delete Agent
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{agent?.name}&quot;? This action cannot be undone.
              All execution history and associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AgentConfigModal;

