'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle, Rocket, ListTodo, Trash2, Layers, ChevronRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Categories for organizing epics (derived from tags in bootstrap template)
const CATEGORIES = [
  { id: 'core', name: 'Core Platform', color: 'blue' },
  { id: 'crm', name: 'CRM & Sales', color: 'green' },
  { id: 'marketing', name: 'Marketing', color: 'purple' },
  { id: 'support', name: 'Customer Support', color: 'orange' },
  { id: 'finance', name: 'Finance & Billing', color: 'yellow' },
  { id: 'analytics', name: 'Analytics & Reports', color: 'indigo' },
  { id: 'integrations', name: 'Integrations', color: 'pink' },
  { id: 'automation', name: 'Automation & Workflows', color: 'teal' },
  { id: 'all', name: 'All Epics', color: 'gray' },
];

export default function TodoHQPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/todo-hq/epics', fetcher);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const epics = data?.epics || [];

  const handleBootstrap = async () => {
    setBootstrapping(true);
    try {
      const res = await fetch('/api/admin/todo-hq/bootstrap', {
        method: 'POST',
      });

      if (res.ok) {
        mutate(); // Refresh the data
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to bootstrap');
      }
    } catch (err) {
      alert('Failed to bootstrap To-Do HQ');
    } finally {
      setBootstrapping(false);
    }
  };

  const handleClearAndRebootstrap = async () => {
    if (!confirm('Are you sure? This will delete all current epics and tasks and re-create them from the template. This cannot be undone!')) {
      return;
    }

    setClearing(true);
    try {
      // Step 1: Clear existing data
      const clearRes = await fetch('/api/admin/todo-hq/clear', {
        method: 'DELETE',
      });

      if (!clearRes.ok) {
        const error = await clearRes.json();
        alert(error.error || 'Failed to clear data');
        return;
      }

      // Step 2: Bootstrap with fresh data
      const bootstrapRes = await fetch('/api/admin/todo-hq/bootstrap', {
        method: 'POST',
      });

      if (bootstrapRes.ok) {
        mutate(); // Refresh the data
        alert('Successfully cleared and re-bootstrapped To-Do HQ!');
      } else {
        const error = await bootstrapRes.json();
        alert(error.error || 'Failed to bootstrap after clearing');
      }
    } catch (err) {
      alert('Failed to clear and re-bootstrap');
    } finally {
      setClearing(false);
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

      mutate(); // Refresh the data
    } catch (err) {
      alert('Failed to update task');
    }
  };

  if (error) {
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

  if (epics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md p-8 text-center">
          <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Welcome to To-Do HQ</h2>
          <p className="text-muted-foreground mb-6">
            Get started by bootstrapping your To-Do HQ with initial epics and tasks from the Features Map.
          </p>
          <Button onClick={handleBootstrap} disabled={bootstrapping} size="lg">
            {bootstrapping ? 'Bootstrapping...' : 'Bootstrap To-Do HQ'}
          </Button>
        </Card>
      </div>
    );
  }

  const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory);
  const filteredEpics = selectedCategory === 'all'
    ? epics
    : epics.filter((e: any) => e.tags?.includes(selectedCategory));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Categories */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-pink-600" />
            To-Do HQ
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Epic Categories</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {CATEGORIES.map((cat) => {
            const categoryEpicsList = cat.id === 'all' ? epics : epics.filter((e: any) => e.tags?.includes(cat.id));
            const totalTasks = categoryEpicsList.reduce((sum: number, e: any) => sum + (e.taskCount || 0), 0);
            const completedTasks = categoryEpicsList.reduce((sum: number, e: any) => sum + (e.completedTaskCount || 0), 0);
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-pink-50 border border-pink-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedCategory === cat.id ? 'rotate-90' : ''}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{completedTasks}/{totalTasks} tasks</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-2 border-t space-y-1">
          <Button
            onClick={handleClearAndRebootstrap}
            disabled={clearing}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {clearing ? 'Clearing...' : 'Reset All'}
          </Button>
        </div>
      </div>

      {/* Main Content - Phase Tasks */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{selectedCategoryData?.name}</h2>
            <p className="text-muted-foreground mt-1">
              {filteredEpics.length} epic{filteredEpics.length !== 1 ? 's' : ''} • {filteredEpics.reduce((sum: number, e: any) => sum + (e.taskCount || 0), 0)} total tasks
            </p>
          </div>

          {filteredEpics.length === 0 ? (
            <Card className="p-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No epics in this category yet</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEpics.map((epic: any) => (
                <Card key={epic.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{epic.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {epic.completedTaskCount}/{epic.taskCount} tasks • {epic.completionPercent}% complete
                      </p>
                    </div>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600" style={{ width: `${epic.completionPercent}%` }} />
                    </div>
                  </div>

                  {epic.tasks && epic.tasks.length > 0 && (
                    <div className="space-y-1">
                      {epic.tasks.map((task: any) => {
                        const isCompleted = task.status === 'done';
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 ${
                              isCompleted ? 'opacity-50' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className="flex-shrink-0"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                            <span className={`text-sm flex-1 ${isCompleted ? 'line-through' : ''}`}>
                              {task.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
