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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trash2, Users, Shield, Building2 } from 'lucide-react';

// Validation schema
const teamConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.enum(['active', 'paused', 'archived']),
  autonomyLevel: z.enum(['supervised', 'semi_autonomous', 'autonomous']),
});

type TeamConfigForm = z.infer<typeof teamConfigSchema>;

interface TeamMember {
  id: string;
  agentId: string;
  role: string;
  priority: number;
  agent: {
    id: string;
    name: string;
    type: string;
    status: string;
    description: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  department: string;
  status: string;
  config: {
    autonomyLevel?: string;
    maxConcurrentTasks?: number;
    capabilities?: string[];
  } | null;
  memberCount: number;
  members?: TeamMember[];
}

interface TeamConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
  onSuccess: () => void;
}

// Department display info
const departmentInfo: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  sales: { label: 'Sales', icon: Building2, color: 'bg-green-100 text-green-700' },
  marketing: { label: 'Marketing', icon: Building2, color: 'bg-pink-100 text-pink-700' },
  support: { label: 'Support', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  operations: { label: 'Operations', icon: Building2, color: 'bg-orange-100 text-orange-700' },
  finance: { label: 'Finance', icon: Building2, color: 'bg-purple-100 text-purple-700' },
  engineering: { label: 'Engineering', icon: Building2, color: 'bg-cyan-100 text-cyan-700' },
  hr: { label: 'HR', icon: Building2, color: 'bg-amber-100 text-amber-700' },
  general: { label: 'General', icon: Building2, color: 'bg-gray-100 text-gray-700' },
};

// Autonomy level descriptions
const autonomyLevelInfo = {
  supervised: 'All actions require human approval',
  semi_autonomous: 'Low-risk actions auto-execute, others need approval',
  autonomous: 'Most actions auto-execute, only critical actions need review',
};

export function TeamConfigModal({
  open,
  onOpenChange,
  teamId,
  onSuccess,
}: TeamConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);

  const form = useForm<TeamConfigForm>({
    resolver: zodResolver(teamConfigSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      autonomyLevel: 'supervised',
    },
  });

  // Fetch team data when modal opens
  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId || !open) return;

      setIsFetching(true);
      try {
        const response = await fetch(`/api/orchestration/teams/${teamId}`);
        if (response.ok) {
          const data = await response.json();
          setTeam(data.team);
          form.reset({
            name: data.team.name,
            description: data.team.description || '',
            status: data.team.status as TeamConfigForm['status'],
            autonomyLevel: (data.team.config?.autonomyLevel || 'supervised') as TeamConfigForm['autonomyLevel'],
          });
        }
      } catch {
        toast.error('Failed to load team details');
      } finally {
        setIsFetching(false);
      }
    };

    fetchTeam();
  }, [teamId, open, form]);

  const handleClose = () => {
    form.reset();
    setTeam(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: TeamConfigForm) => {
    if (!teamId) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/orchestration/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          status: data.status,
          config: {
            autonomyLevel: data.autonomyLevel,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team');
      }

      toast.success('Team updated successfully');
      handleClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!teamId) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/orchestration/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      toast.success('Team deleted successfully');
      setShowDeleteDialog(false);
      handleClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete team');
    } finally {
      setIsDeleting(false);
    }
  };

  const deptInfo = team?.department
    ? departmentInfo[team.department] || { label: team.department, icon: Building2, color: 'bg-gray-100 text-gray-700' }
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100">
                <Users className="h-5 w-5 text-purple-600" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-xl">Configure Team</DialogTitle>
                <DialogDescription>
                  Update team settings, autonomy level, and configuration.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : team ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              {/* Department & Members Badge */}
              <div className="flex items-center gap-3">
                {deptInfo && (
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${deptInfo.color}`}>
                    {deptInfo.label}
                  </span>
                )}
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="Enter team name"
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
                  placeholder="Describe this team's purpose and responsibilities"
                  rows={2}
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
                  onValueChange={(value) => form.setValue('status', value as TeamConfigForm['status'])}
                >
                  <SelectTrigger id="status" aria-label="Select team status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Autonomy Level Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Label htmlFor="autonomyLevel">Autonomy Level</Label>
                </div>
                <Select
                  value={form.watch('autonomyLevel')}
                  onValueChange={(value) => form.setValue('autonomyLevel', value as TeamConfigForm['autonomyLevel'])}
                >
                  <SelectTrigger id="autonomyLevel" aria-label="Select autonomy level">
                    <SelectValue placeholder="Select autonomy level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supervised">
                      <div className="flex flex-col items-start">
                        <span>Supervised</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="semi_autonomous">
                      <div className="flex flex-col items-start">
                        <span>Semi-Autonomous</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="autonomous">
                      <div className="flex flex-col items-start">
                        <span>Autonomous</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {autonomyLevelInfo[form.watch('autonomyLevel')]}
                </p>
              </div>

              {/* Team Members Preview */}
              {team.members && team.members.length > 0 && (
                <div className="space-y-2">
                  <Label>Team Members</Label>
                  <div className="flex flex-wrap gap-2">
                    {team.members.slice(0, 5).map((member) => (
                      <Badge key={member.id} variant="outline" className="gap-1">
                        {member.agent?.name || 'Unknown'}
                        {member.role === 'coordinator' && (
                          <span className="text-[10px] text-amber-600">★</span>
                        )}
                      </Badge>
                    ))}
                    {team.members.length > 5 && (
                      <Badge variant="secondary">+{team.members.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              )}

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
                  Delete Team
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
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{team?.name}&quot;? This action cannot be undone.
              All team members will be removed and associated data will be permanently deleted.
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

export default TeamConfigModal;

