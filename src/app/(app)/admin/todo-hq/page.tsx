'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle, AlertCircle, Rocket, ListTodo } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TodoHQPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/todo-hq/epics', fetcher);
  const [bootstrapping, setBootstrapping] = useState(false);

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-8 w-8 text-pink-600" />
            To-Do HQ
          </h1>
          <p className="text-muted-foreground mt-1">
            Track feature completion and manage development tasks
          </p>
        </div>
      </div>

      {/* Epics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {epics.map((epic: any) => (
          <Card key={epic.id} className="p-6">
            {/* Epic Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{epic.name}</h3>
                {epic.description && (
                  <p className="text-sm text-muted-foreground">{epic.description}</p>
                )}
              </div>
              <Badge
                variant={epic.status === 'completed' ? 'default' : 'secondary'}
                className="ml-2"
              >
                {epic.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Completion Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  {epic.completedTaskCount} of {epic.taskCount} tasks completed
                </span>
                <span className="font-semibold">{epic.completionPercent}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-600 transition-all duration-300"
                  style={{ width: `${epic.completionPercent}%` }}
                />
              </div>
            </div>

            {/* Open Tasks */}
            {epic.openItems && epic.openItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Open Items:</h4>
                {epic.openItems.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-secondary/50 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                        <Badge
                          variant={
                            task.priority === 'urgent'
                              ? 'destructive'
                              : task.priority === 'high'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No open tasks message */}
            {(!epic.openItems || epic.openItems.length === 0) && epic.completionPercent === 100 && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>All tasks completed!</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
