'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Rocket,
  ListTodo,
  Trash2,
  Layers,
  ChevronRight,
  Plus,
  Play,
  Pause,
  Flag,
  Calendar,
  Target,
  Archive,
  Inbox,
  Zap,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Sprint status icons and colors
const SPRINT_STATUS_CONFIG = {
  planned: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Planned' },
  in_progress: { icon: Play, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Completed' },
  cancelled: { icon: Pause, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Cancelled' },
};

// Priority colors
const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface Sprint {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  color: string;
  taskCount: number;
  completedTaskCount: number;
  completionPercent: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sortOrder: number;
  tags: string[];
  notes: string | null;
  epicId: string;
  epicName: string;
  sprintId: string | null;
}

interface Epic {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
  completedTaskCount: number;
  completionPercent: number;
  tasks: Task[];
  tags: string[];
}

export default function TodoHQPage() {
  const { data: sprintsData, error: sprintsError, mutate: mutateSprints } = useSWR('/api/admin/todo-hq/sprints', fetcher);
  const { data: epicsData, error: epicsError, mutate: mutateEpics } = useSWR('/api/admin/todo-hq/epics', fetcher);

  const [activeTab, setActiveTab] = useState<'sprints' | 'backlog' | 'all'>('sprints');
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [showCreateSprintDialog, setShowCreateSprintDialog] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sprints: Sprint[] = sprintsData?.sprints || [];
  const backlog = sprintsData?.backlog || { taskCount: 0, completedTaskCount: 0, completionPercent: 0 };
  const epics: Epic[] = epicsData?.epics || [];

  const isLoading = !sprintsData && !sprintsError;
  const hasNoData = epics.length === 0;

  // Get selected sprint details
  const { data: sprintDetail, mutate: mutateSprintDetail } = useSWR(
    selectedSprint ? `/api/admin/todo-hq/sprints/${selectedSprint}` : null,
    fetcher
  );

  const handleBootstrap = async () => {
    setBootstrapping(true);
    try {
      const res = await fetch('/api/admin/todo-hq/bootstrap', { method: 'POST' });
      if (res.ok) {
        mutateEpics();
        mutateSprints();
        toast.success('To-Do HQ initialized successfully!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to initialize');
      }
    } catch {
      toast.error('Failed to initialize To-Do HQ');
    } finally {
      setBootstrapping(false);
    }
  };

  const handleClearAndRebootstrap = async () => {
    setClearing(true);
    try {
      await fetch('/api/admin/todo-hq/clear', { method: 'DELETE' });
      const res = await fetch('/api/admin/todo-hq/bootstrap', { method: 'POST' });
      if (res.ok) {
        mutateEpics();
        mutateSprints();
        setSelectedSprint(null);
        setShowResetConfirm(false);
        toast.success('To-Do HQ reset successfully!');
      }
    } catch {
      toast.error('Failed to reset To-Do HQ');
    } finally {
      setClearing(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!newSprintName.trim()) return;
    setIsCreatingSprint(true);

    try {
      const res = await fetch('/api/admin/todo-hq/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSprintName, goal: newSprintGoal || null }),
      });

      if (res.ok) {
        mutateSprints();
        setNewSprintName('');
        setNewSprintGoal('');
        setShowCreateSprintDialog(false);
        toast.success('Sprint created!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create sprint');
      }
    } catch {
      toast.error('Failed to create sprint');
    } finally {
      setIsCreatingSprint(false);
    }
  };

  const handleUpdateSprintStatus = async (sprintId: string, status: string) => {
    try {
      await fetch(`/api/admin/todo-hq/sprints/${sprintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      mutateSprints();
      if (selectedSprint === sprintId) mutateSprintDetail();
      toast.success('Sprint status updated');
    } catch {
      toast.error('Failed to update sprint');
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await fetch('/api/admin/todo-hq/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      mutateEpics();
      mutateSprints();
      if (selectedSprint) mutateSprintDetail();
      toast.success(newStatus === 'done' ? 'Task completed!' : 'Task reopened');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleAssignToSprint = async (taskId: string, sprintId: string | null) => {
    try {
      await fetch('/api/admin/todo-hq/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, sprintId }),
      });
      mutateEpics();
      mutateSprints();
      if (selectedSprint) mutateSprintDetail();
      toast.success(sprintId ? 'Task assigned to sprint' : 'Task moved to backlog');
    } catch {
      toast.error('Failed to assign task');
    }
  };

  const refreshAll = () => {
    mutateEpics();
    mutateSprints();
    if (selectedSprint) mutateSprintDetail();
    toast.success('Data refreshed');
  };

  if (sprintsError || epicsError) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="p-6">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-center text-muted-foreground">Failed to load To-Do HQ data</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md p-8 text-center">
          <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Welcome to To-Do HQ</h2>
          <p className="text-muted-foreground mb-6">
            Initialize your project management system with all tasks organized into sprints.
          </p>
          <Button onClick={handleBootstrap} disabled={bootstrapping} size="lg">
            {bootstrapping ? 'Initializing...' : 'Initialize To-Do HQ'}
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate overall stats
  const totalTasks = epics.reduce((sum, e) => sum + e.taskCount, 0);
  const completedTasks = epics.reduce((sum, e) => sum + e.completedTaskCount, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get sprints by status
  const activeSprints = sprints.filter((s) => s.status === 'in_progress');
  const plannedSprints = sprints.filter((s) => s.status === 'planned');
  const completedSprints = sprints.filter((s) => s.status === 'completed');

  return (
    <TooltipProvider>
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-72 bg-white border-r flex flex-col shrink-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ListTodo className="h-6 w-6 text-pink-600" />
                To-Do HQ
              </h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={refreshAll} className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">{overallProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks complete</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); setSelectedSprint(null); }} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-2 mt-2 grid grid-cols-3">
              <TabsTrigger value="sprints" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Sprints
              </TabsTrigger>
              <TabsTrigger value="backlog" className="text-xs">
                <Inbox className="h-3 w-3 mr-1" />
                Backlog
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sprints" className="flex-1 overflow-y-auto p-2 m-0">
              {/* Create Sprint Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-3"
                onClick={() => setShowCreateSprintDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Sprint
              </Button>

              {/* Active Sprints */}
              {activeSprints.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-green-600 mb-2 px-1 flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    IN PROGRESS ({activeSprints.length})
                  </p>
                  {activeSprints.map((sprint) => (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      isSelected={selectedSprint === sprint.id}
                      onSelect={() => setSelectedSprint(sprint.id)}
                    />
                  ))}
                </div>
              )}

              {/* Planned Sprints */}
              {plannedSprints.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-blue-600 mb-2 px-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    PLANNED ({plannedSprints.length})
                  </p>
                  {plannedSprints.map((sprint) => (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      isSelected={selectedSprint === sprint.id}
                      onSelect={() => setSelectedSprint(sprint.id)}
                    />
                  ))}
                </div>
              )}

              {/* Completed Sprints */}
              {completedSprints.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 px-1 flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    COMPLETED ({completedSprints.length})
                  </p>
                  {completedSprints.map((sprint) => (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      isSelected={selectedSprint === sprint.id}
                      onSelect={() => setSelectedSprint(sprint.id)}
                    />
                  ))}
                </div>
              )}

              {sprints.length === 0 && (
                <div className="text-center p-4 text-muted-foreground text-sm">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No sprints yet</p>
                  <p className="text-xs">Create a sprint to organize your work</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="backlog" className="flex-1 overflow-y-auto p-2 m-0">
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-amber-800">Unassigned Tasks</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">{backlog.taskCount}</Badge>
                </div>
                <p className="text-xs text-amber-700">Tasks not yet assigned to a sprint</p>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Click on tasks in the main panel to assign them to sprints.
              </p>
            </TabsContent>

            <TabsContent value="all" className="flex-1 overflow-y-auto p-2 m-0">
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">ALL EPICS ({epics.length})</p>
              {epics.map((epic) => (
                <div
                  key={epic.id}
                  className="p-2 rounded-lg mb-1 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{epic.name}</span>
                    <span className="text-xs text-muted-foreground">{epic.completionPercent}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${epic.completionPercent}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{epic.completedTaskCount}/{epic.taskCount}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="p-2 border-t space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
              <Info className="h-3 w-3" />
              <span>Changes save automatically</span>
            </div>
            <Button
              onClick={() => setShowResetConfirm(true)}
              variant="outline"
              size="sm"
              className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Reset All Data
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6 max-w-5xl">
            {selectedSprint && sprintDetail ? (
              <SprintDetailView
                sprint={sprintDetail.sprint}
                tasks={sprintDetail.tasks}
                allSprints={sprints}
                onToggleTask={handleToggleTask}
                onUpdateStatus={handleUpdateSprintStatus}
                onAssignToSprint={handleAssignToSprint}
              />
            ) : activeTab === 'backlog' ? (
              <BacklogView
                epics={epics}
                sprints={sprints}
                onToggleTask={handleToggleTask}
                onAssignToSprint={handleAssignToSprint}
              />
            ) : (
              <OverviewView
                sprints={sprints}
                epics={epics}
                overallProgress={overallProgress}
                completedTasks={completedTasks}
                totalTasks={totalTasks}
                onSelectSprint={setSelectedSprint}
              />
            )}
          </div>
        </div>

        {/* Create Sprint Dialog */}
        <Dialog open={showCreateSprintDialog} onOpenChange={setShowCreateSprintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>Organize your work into focused sprints.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="sprint-name" className="text-sm font-medium">Sprint Name</label>
                <Input
                  id="sprint-name"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="e.g., Sprint 1: CRM Polish"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="sprint-goal" className="text-sm font-medium">Goal (optional)</label>
                <Input
                  id="sprint-goal"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder="e.g., Complete CRM CRUD operations"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateSprintDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSprint} disabled={isCreatingSprint || !newSprintName.trim()}>
                {isCreatingSprint ? 'Creating...' : 'Create Sprint'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Reset All Data?</DialogTitle>
              <DialogDescription>
                This will delete ALL sprints, epics, and tasks, then recreate them from the template.
                Any progress you&apos;ve made will be lost. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearAndRebootstrap} disabled={clearing}>
                {clearing ? 'Resetting...' : 'Yes, Reset Everything'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Sprint Card Component
function SprintCard({
  sprint,
  isSelected,
  onSelect,
}: {
  sprint: Sprint;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const config = SPRINT_STATUS_CONFIG[sprint.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
        isSelected ? `${config.bg} border ${config.border} shadow-sm` : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className={`h-4 w-4 ${config.color}`} />
        <span className="text-sm font-medium flex-1 truncate">{sprint.name}</span>
        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{sprint.completedTaskCount}/{sprint.taskCount} tasks</span>
          <span className="font-semibold">{sprint.completionPercent}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${sprint.completionPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
            style={{ width: `${sprint.completionPercent}%` }} 
          />
        </div>
      </div>
    </button>
  );
}

// Sprint Detail View Component
function SprintDetailView({
  sprint,
  tasks,
  allSprints,
  onToggleTask,
  onUpdateStatus,
  onAssignToSprint,
}: {
  sprint: Sprint;
  tasks: Task[];
  allSprints: Sprint[];
  onToggleTask: (taskId: string, status: string) => void;
  onUpdateStatus: (sprintId: string, status: string) => void;
  onAssignToSprint: (taskId: string, sprintId: string | null) => void;
}) {
  const config = SPRINT_STATUS_CONFIG[sprint.status];

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">{sprint.name}</h2>
          <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
            {config.label}
          </Badge>
        </div>
        {sprint.goal && <p className="text-muted-foreground">{sprint.goal}</p>}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${sprint.completionPercent === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} 
                style={{ width: `${sprint.completionPercent}%` }} 
              />
            </div>
          </div>
          <span className="text-lg font-semibold">{sprint.completionPercent}%</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {sprint.completedTaskCount} of {sprint.taskCount} tasks complete
        </p>

        {/* Status Controls */}
        <div className="flex gap-2 mt-4">
          {sprint.status === 'planned' && (
            <Button size="sm" onClick={() => onUpdateStatus(sprint.id, 'in_progress')}>
              <Play className="h-4 w-4 mr-1" />
              Start Sprint
            </Button>
          )}
          {sprint.status === 'in_progress' && (
            <>
              <Button size="sm" variant="outline" onClick={() => onUpdateStatus(sprint.id, 'completed')}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Complete Sprint
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdateStatus(sprint.id, 'planned')}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            </>
          )}
          {sprint.status === 'completed' && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(sprint.id, 'in_progress')}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reopen Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No tasks in this sprint yet</p>
          <p className="text-sm text-muted-foreground mt-1">Assign tasks from the backlog tab</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* To Do */}
          {todoTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Circle className="h-4 w-4" />
                TO DO ({todoTasks.length})
              </h3>
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    sprints={allSprints}
                    onToggle={() => onToggleTask(task.id, task.status)}
                    onAssignToSprint={onAssignToSprint}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {doneTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                COMPLETED ({doneTasks.length})
              </h3>
              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    sprints={allSprints}
                    onToggle={() => onToggleTask(task.id, task.status)}
                    onAssignToSprint={onAssignToSprint}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Backlog View Component
function BacklogView({
  epics,
  sprints,
  onToggleTask,
  onAssignToSprint,
}: {
  epics: Epic[];
  sprints: Sprint[];
  onToggleTask: (taskId: string, status: string) => void;
  onAssignToSprint: (taskId: string, sprintId: string | null) => void;
}) {
  // Get tasks without sprint assignment grouped by epic
  const epicBacklogs = epics
    .map((epic) => ({
      ...epic,
      backlogTasks: (epic.tasks || []).filter((task) => !task.sprintId),
    }))
    .filter((epic) => epic.backlogTasks.length > 0);

  const totalBacklogTasks = epicBacklogs.reduce((sum, e) => sum + e.backlogTasks.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="h-6 w-6" />
          Backlog
        </h2>
        <p className="text-muted-foreground mt-1">
          {totalBacklogTasks} unassigned tasks across {epicBacklogs.length} epics
        </p>
      </div>

      {totalBacklogTasks === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold">Backlog is empty!</p>
          <p className="text-sm text-muted-foreground">All tasks are assigned to sprints</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {epicBacklogs.map((epic) => (
            <div key={epic.id}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Flag className="h-4 w-4" />
                {epic.name} ({epic.backlogTasks.length})
              </h3>
              <div className="space-y-2">
                {epic.backlogTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={{ ...task, epicName: epic.name }}
                    sprints={sprints}
                    onToggle={() => onToggleTask(task.id, task.status)}
                    onAssignToSprint={onAssignToSprint}
                    showEpic={false}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Overview View Component
function OverviewView({
  sprints,
  epics,
  overallProgress,
  completedTasks,
  totalTasks,
  onSelectSprint,
}: {
  sprints: Sprint[];
  epics: Epic[];
  overallProgress: number;
  completedTasks: number;
  totalTasks: number;
  onSelectSprint: (id: string) => void;
}) {
  const activeSprint = sprints.find((s) => s.status === 'in_progress');
  const plannedSprints = sprints.filter((s) => s.status === 'planned');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Project Overview</h2>
        <p className="text-muted-foreground mt-1">Sprint progress and task distribution</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
          <p className="text-sm text-muted-foreground">Overall Progress</p>
          <p className="text-3xl font-bold text-pink-600">{overallProgress}%</p>
          <p className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Sprints</p>
          <p className="text-3xl font-bold">{sprints.filter((s) => s.status === 'in_progress').length}</p>
          <p className="text-xs text-muted-foreground">{sprints.length} total sprints</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Feature Areas</p>
          <p className="text-3xl font-bold">{epics.length}</p>
          <p className="text-xs text-muted-foreground">epics to complete</p>
        </Card>
      </div>

      {/* Active Sprint Highlight */}
      {activeSprint && (
        <Card className="p-4 mb-6 border-green-200 bg-green-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Active: {activeSprint.name}</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => onSelectSprint(activeSprint.id)}>
              View Tasks
            </Button>
          </div>
          {activeSprint.goal && <p className="text-sm text-muted-foreground mb-3">{activeSprint.goal}</p>}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${activeSprint.completionPercent}%` }} />
              </div>
            </div>
            <span className="text-sm font-semibold">{activeSprint.completionPercent}%</span>
          </div>
        </Card>
      )}

      {/* Upcoming Sprints */}
      {plannedSprints.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Sprints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plannedSprints.map((sprint) => (
              <Card
                key={sprint.id}
                className="p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-200 transition-all"
                onClick={() => onSelectSprint(sprint.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">{sprint.name}</span>
                </div>
                {sprint.goal && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{sprint.goal}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{sprint.taskCount} tasks</span>
                  <span>{sprint.completedTaskCount} done</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Active Sprint Warning */}
      {!activeSprint && plannedSprints.length > 0 && (
        <Card className="p-4 mt-6 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">No sprint is currently active</p>
          </div>
          <p className="text-sm text-amber-600 mt-1">
            Select a planned sprint and click &quot;Start Sprint&quot; to begin tracking progress.
          </p>
        </Card>
      )}
    </div>
  );
}

// Task Row Component
function TaskRow({
  task,
  sprints,
  onToggle,
  onAssignToSprint,
  showEpic = true,
}: {
  task: Task & { epicName?: string };
  sprints: Sprint[];
  onToggle: () => void;
  onAssignToSprint: (taskId: string, sprintId: string | null) => void;
  showEpic?: boolean;
}) {
  const isCompleted = task.status === 'done';
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <Card className={`p-3 transition-all ${isCompleted ? 'opacity-60 bg-gray-50' : 'hover:shadow-sm'}`}>
      <div className="flex items-start gap-3">
        <button 
          onClick={onToggle} 
          className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform" 
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
          {showEpic && task.epicName && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.epicName}</p>
          )}
          {task.description && !isCompleted && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`text-xs ${priorityColor}`}>{task.priority}</Badge>
          <select
            value={task.sprintId || ''}
            onChange={(e) => onAssignToSprint(task.id, e.target.value || null)}
            className="text-xs border rounded px-2 py-1 bg-white max-w-[120px]"
            aria-label="Assign to sprint"
          >
            <option value="">Backlog</option>
            {sprints.filter(s => s.status !== 'completed').map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
