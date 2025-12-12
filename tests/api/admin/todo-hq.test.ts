import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getEpics, POST as createEpic, PATCH as updateEpic } from '@/app/api/admin/todo-hq/epics/route';
import { GET as getTasks, POST as createTask, PATCH as updateTask } from '@/app/api/admin/todo-hq/tasks/route';
import { POST as bootstrap } from '@/app/api/admin/todo-hq/bootstrap/route';

// Mock auth module
vi.mock('@/lib/auth', () => ({
  isSystemAdmin: vi.fn(),
  getCurrentWorkspace: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      todoHqEpics: {
        findMany: vi.fn(),
      },
      todoHqTasks: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

describe('To-Do HQ API - Epics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/todo-hq/epics', () => {
    it('should return 403 if user is not admin', async () => {
      vi.mocked(isSystemAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/admin/todo-hq/epics');
      const response = await getEpics(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if workspace not found', async () => {
      vi.mocked(isSystemAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentWorkspace).mockRejectedValue(new Error('Not found'));

      const request = new NextRequest('http://localhost/api/admin/todo-hq/epics');
      const response = await getEpics(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Workspace not found');
    });

    it('should return epics with computed completion percentage', async () => {
      vi.mocked(isSystemAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentWorkspace).mockResolvedValue({
        workspace: { id: 'workspace-123', name: 'Test Workspace' },
      } as any);

      const mockEpics = [
        {
          id: 'epic-1',
          name: 'Test Epic',
          status: 'in_progress',
          tasks: [
            { id: 'task-1', status: 'done' },
            { id: 'task-2', status: 'todo' },
            { id: 'task-3', status: 'done' },
          ],
        },
      ];

      vi.mocked(db.query.todoHqEpics.findMany).mockResolvedValue(mockEpics as any);

      const request = new NextRequest('http://localhost/api/admin/todo-hq/epics');
      const response = await getEpics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.epics).toHaveLength(1);
      expect(data.epics[0].completionPercent).toBe(67); // 2/3 completed
      expect(data.epics[0].taskCount).toBe(3);
      expect(data.epics[0].completedTaskCount).toBe(2);
    });
  });

  describe('POST /api/admin/todo-hq/epics', () => {
    it('should create epic with valid data', async () => {
      vi.mocked(isSystemAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentWorkspace).mockResolvedValue({
        workspace: { id: 'workspace-123' },
      } as any);
      vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-123' } as any);

      const mockEpic = {
        id: 'epic-new',
        name: 'New Epic',
        status: 'not_started',
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockEpic]),
        }),
      } as any);

      const request = new NextRequest('http://localhost/api/admin/todo-hq/epics', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Epic', status: 'not_started' }),
      });

      const response = await createEpic(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.epic.name).toBe('New Epic');
    });

    it('should return 400 for invalid data', async () => {
      vi.mocked(isSystemAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentWorkspace).mockResolvedValue({
        workspace: { id: 'workspace-123' },
      } as any);
      vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-123' } as any);

      const request = new NextRequest('http://localhost/api/admin/todo-hq/epics', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Empty name should fail
      });

      const response = await createEpic(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
});

describe('To-Do HQ API - Tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/admin/todo-hq/tasks', () => {
    it('should set completedAt when status changes to done', async () => {
      vi.mocked(isSystemAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentWorkspace).mockResolvedValue({
        workspace: { id: 'workspace-123' },
      } as any);

      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        status: 'done',
        completedAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockTask]),
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost/api/admin/todo-hq/tasks', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'task-1', status: 'done' }),
      });

      const response = await updateTask(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.completedAt).toBeTruthy();
    });

    it('should clear completedAt when status changes from done', async () => {
      vi.mocked(isSystemAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentWorkspace).mockResolvedValue({
        workspace: { id: 'workspace-123' },
      } as any);

      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        status: 'todo',
        completedAt: null,
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockTask]),
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost/api/admin/todo-hq/tasks', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'task-1', status: 'todo' }),
      });

      const response = await updateTask(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.completedAt).toBeNull();
    });
  });
});

describe('To-Do HQ API - Bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 409 if data already exists', async () => {
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(getCurrentWorkspace).mockResolvedValue({
      workspace: { id: 'workspace-123' },
    } as any);

    vi.mocked(db.query.todoHqEpics.findMany).mockResolvedValue([{ id: 'existing' }] as any);

    const request = new NextRequest('http://localhost/api/admin/todo-hq/bootstrap', {
      method: 'POST',
    });

    const response = await bootstrap(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('already exists');
  });

  it('should create epics and tasks from template', async () => {
    vi.mocked(isSystemAdmin).mockResolvedValue(true);
    vi.mocked(getCurrentWorkspace).mockResolvedValue({
      workspace: { id: 'workspace-123' },
    } as any);
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-123' } as any);

    vi.mocked(db.query.todoHqEpics.findMany).mockResolvedValue([]);

    // Mock insert for epics
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-epic-id' }]),
      }),
    } as any);

    const request = new NextRequest('http://localhost/api/admin/todo-hq/bootstrap', {
      method: 'POST',
    });

    const response = await bootstrap(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toContain('bootstrapped');
    expect(data.created.epics).toBeGreaterThan(0);
    expect(data.created.tasks).toBeGreaterThan(0);
  });
});
