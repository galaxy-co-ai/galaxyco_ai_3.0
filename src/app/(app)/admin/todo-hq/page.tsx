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
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Sprint status icons and colors
const SPRINT_STATUS_CONFIG = {
  planned: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  in_progress: { icon: Play, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  completed: { icon: CheckCircle2, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  cancelled: { icon: Pause, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
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
        toast.success('To-Do HQ bootstrapped successfully!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to bootstrap');
      }
    } catch {
      toast.error('Failed to bootstrap To-Do HQ');
    } finally {
      setBootstrapping(false);
    }
  };

  const handleClearAndRebootstrap = async () => {
    if (!confirm('Are you sure? This will delete all data and re-create from template.')) return;

    setClearing(true);
    try {
      await fetch('/api/admin/todo-hq/clear', { method: 'DELETE' });
      const res = await fetch('/api/admin/todo-hq/bootstrap', { method: 'POST' });
      if (res.ok) {
        mutateEpics();
        mutateSprints();
        setSelectedSprint(null);
        toast.success('Successfully reset To-Do HQ!');
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

  if (sprintsError || epicsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-center text-muted-foreground">Failed to load To-Do HQ data</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
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
            Get started by bootstrapping your To-Do HQ with initial epics and tasks.
          </p>
          <Button onClick={handleBootstrap} disabled={bootstrapping} size="lg">
            {bootstrapping ? 'Bootstrapping...' : 'Bootstrap To-Do HQ'}
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate overall stats
  const totalTasks = epics.reduce((sum, e) => sum + e.taskCount, 0);
  const completedTasks = epics.reduce((sum, e) => sum + e.completedTaskCount, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get active/in-progress sprints
  const activeSprints = sprints.filter((s) => s.status === 'in_progress');
  const plannedSprints = sprints.filter((s) => s.status === 'planned');
  const completedSprints = sprints.filter((s) => s.status === 'completed');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-pink-600" />
              To-Do HQ
            </h1>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
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
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">IN PROGRESS</p>
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
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">PLANNED</p>
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
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1 flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  COMPLETED
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
            <div className="mb-3 p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Backlog</span>
                <Badge variant="secondary">{backlog.taskCount} tasks</Badge>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-500" style={{ width: `${backlog.completionPercent}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground px-1">
              Tasks not assigned to any sprint. View in the main panel.
            </p>
          </TabsContent>

          <TabsContent value="all" className="flex-1 overflow-y-auto p-2 m-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">ALL EPICS</p>
            {epics.map((epic) => (
              <button
                key={epic.id}
                className="w-full text-left p-2 rounded-lg mb-1 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{epic.name}</span>
                  <span className="text-xs text-muted-foreground">{epic.completionPercent}%</span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${epic.completionPercent}%` }} />
                </div>
              </button>
            ))}
          </TabsContent>
        </Tabs>

        <div className="p-2 border-t">
          <Button
            onClick={handleClearAndRebootstrap}
            disabled={clearing}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {clearing ? 'Resetting...' : 'Reset All'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
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
    </div>
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
      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
        isSelected ? `${config.bg} border ${config.border}` : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className={`h-4 w-4 ${config.color}`} />
        <span className="text-sm font-medium flex-1 truncate">{sprint.name}</span>
        <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{sprint.completedTaskCount}/{sprint.taskCount} tasks</span>
          <span className="font-semibold">{sprint.completionPercent}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${sprint.completionPercent}%` }} />
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">{sprint.name}</h2>
          <Badge className={config.bg + ' ' + config.color + ' border ' + config.border}>
            {sprint.status.replace('_', ' ')}
          </Badge>
        </div>
        {sprint.goal && <p className="text-muted-foreground">{sprint.goal}</p>}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style={{ width: `${sprint.completionPercent}%` }} />
            </div>
          </div>
          <span className="text-sm font-semibold">{sprint.completionPercent}%</span>
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
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <Card className="p-8 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tasks in this sprint yet</p>
            <p className="text-sm text-muted-foreground">Assign tasks from the backlog</p>
          </Card>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              sprints={allSprints}
              onToggle={() => onToggleTask(task.id, task.status)}
              onAssignToSprint={onAssignToSprint}
            />
          ))
        )}
      </div>
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
  // Get tasks without sprint assignment
  const backlogTasks: Task[] = [];
  epics.forEach((epic) => {
    epic.tasks?.forEach((task) => {
      if (!task.sprintId) {
        backlogTasks.push({ ...task, epicName: epic.name });
      }
    });
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="h-6 w-6" />
          Backlog
        </h2>
        <p className="text-muted-foreground mt-1">
          {backlogTasks.length} unassigned tasks. Drag or assign to a sprint.
        </p>
      </div>

      <div className="space-y-2">
        {backlogTasks.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold">Backlog is empty!</p>
            <p className="text-sm text-muted-foreground">All tasks are assigned to sprints</p>
          </Card>
        ) : (
          backlogTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              sprints={sprints}
              onToggle={() => onToggleTask(task.id, task.status)}
              onAssignToSprint={onAssignToSprint}
              showEpic
            />
          ))
        )}
      </div>
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground mt-1">Project progress and sprint summary</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Overall Progress</p>
          <p className="text-3xl font-bold">{overallProgress}%</p>
          <p className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Sprints</p>
          <p className="text-3xl font-bold">{sprints.filter((s) => s.status === 'in_progress').length}</p>
          <p className="text-xs text-muted-foreground">{sprints.length} total sprints</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Epics</p>
          <p className="text-3xl font-bold">{epics.length}</p>
          <p className="text-xs text-muted-foreground">feature areas</p>
        </Card>
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <Card className="p-4 mb-6 border-green-200 bg-green-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Active Sprint: {activeSprint.name}</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => onSelectSprint(activeSprint.id)}>
              View Details
            </Button>
          </div>
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

      {/* Quick Actions */}
      <h3 className="font-semibold mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {sprints.filter((s) => s.status === 'planned').slice(0, 2).map((sprint) => (
          <Card
            key={sprint.id}
            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onSelectSprint(sprint.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">{sprint.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{sprint.taskCount} tasks planned</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Task Row Component
function TaskRow({
  task,
  sprints,
  onToggle,
  onAssignToSprint,
  showEpic = false,
}: {
  task: Task;
  sprints: Sprint[];
  onToggle: () => void;
  onAssignToSprint: (taskId: string, sprintId: string | null) => void;
  showEpic?: boolean;
}) {
  const isCompleted = task.status === 'done';
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <Card className={`p-3 ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="flex-shrink-0" aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}>
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
          {showEpic && task.epicName && (
            <p className="text-xs text-muted-foreground">{task.epicName}</p>
          )}
        </div>
        <Badge className={`text-xs ${priorityColor}`}>{task.priority}</Badge>
        <select
          value={task.sprintId || ''}
          onChange={(e) => onAssignToSprint(task.id, e.target.value || null)}
          className="text-xs border rounded px-2 py-1 bg-white"
          aria-label="Assign to sprint"
        >
          <option value="">Backlog</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
    </Card>
  );
}
