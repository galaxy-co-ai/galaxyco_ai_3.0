/**
 * Bootstrap Template for To-Do HQ
 * 
 * This template contains initial epics and tasks representing features
 * that need work to reach 100% completion. Based on the Features Map.
 */

type EpicStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold';
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TaskTemplate {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  sortOrder: number;
  tags?: string[];
  notes?: string;
}

interface EpicTemplate {
  name: string;
  description?: string;
  status: EpicStatus;
  targetCompletionPercent: number;
  sortOrder: number;
  tags?: string[];
  tasks: TaskTemplate[];
}

interface BootstrapTemplate {
  epics: EpicTemplate[];
}

export const BOOTSTRAP_TEMPLATE: BootstrapTemplate = {
  epics: [
    {
      name: 'CRM & Customer Management',
      description: 'Customer relationship management features including contacts, prospects, and interactions',
      status: 'in_progress',
      targetCompletionPercent: 100,
      sortOrder: 1,
      tags: ['crm', 'customers'],
      tasks: [
        {
          title: 'Add bulk import functionality for contacts',
          description: 'Enable CSV/Excel import for bulk contact uploads',
          status: 'todo',
          priority: 'high',
          sortOrder: 1,
          tags: ['import', 'data'],
        },
        {
          title: 'Build advanced search and filtering for prospects',
          description: 'Multi-criteria search with saved filters',
          status: 'todo',
          priority: 'medium',
          sortOrder: 2,
          tags: ['search', 'ux'],
        },
        {
          title: 'Add email templates for customer communications',
          description: 'Pre-built templates for common email scenarios',
          status: 'todo',
          priority: 'medium',
          sortOrder: 3,
          tags: ['email', 'templates'],
        },
      ],
    },
    {
      name: 'Agent Orchestration',
      description: 'Multi-agent workflows, teams, and autonomous execution system',
      status: 'in_progress',
      targetCompletionPercent: 100,
      sortOrder: 2,
      tags: ['agents', 'automation'],
      tasks: [
        {
          title: 'Complete agent approval queue UI',
          description: 'Build interface for reviewing and approving pending agent actions',
          status: 'todo',
          priority: 'high',
          sortOrder: 1,
          tags: ['ui', 'approvals'],
        },
        {
          title: 'Implement agent-to-agent messaging',
          description: 'Enable agents to communicate and coordinate tasks',
          status: 'todo',
          priority: 'medium',
          sortOrder: 2,
          tags: ['messaging', 'coordination'],
        },
        {
          title: 'Add workflow execution monitoring dashboard',
          description: 'Real-time view of running workflows with metrics',
          status: 'todo',
          priority: 'medium',
          sortOrder: 3,
          tags: ['monitoring', 'dashboard'],
        },
      ],
    },
    {
      name: 'Content Cockpit',
      description: 'Article creation, sources management, and analytics platform',
      status: 'in_progress',
      targetCompletionPercent: 100,
      sortOrder: 3,
      tags: ['content', 'blog'],
      tasks: [
        {
          title: 'Build AI-powered article analytics insights',
          description: 'Generate actionable insights from article performance data',
          status: 'todo',
          priority: 'high',
          sortOrder: 1,
          tags: ['ai', 'analytics'],
        },
        {
          title: 'Add automated content source monitoring',
          description: 'Crawl and analyze bookmarked sources for new content',
          status: 'todo',
          priority: 'medium',
          sortOrder: 2,
          tags: ['automation', 'sources'],
        },
        {
          title: 'Complete use case studio with persona templates',
          description: 'Pre-built persona templates for different user types',
          status: 'todo',
          priority: 'low',
          sortOrder: 3,
          tags: ['personas', 'templates'],
        },
      ],
    },
    {
      name: 'Conversations Hub',
      description: 'Unified inbox for emails, SMS, calls, and social interactions',
      status: 'in_progress',
      targetCompletionPercent: 100,
      sortOrder: 4,
      tags: ['conversations', 'communications'],
      tasks: [
        {
          title: 'Integrate SignalWire for SMS and voice',
          description: 'Complete integration with SignalWire API',
          status: 'todo',
          priority: 'urgent',
          sortOrder: 1,
          tags: ['integration', 'signalwire'],
        },
        {
          title: 'Build conversation assignment and routing',
          description: 'Auto-assign conversations to team members based on rules',
          status: 'todo',
          priority: 'high',
          sortOrder: 2,
          tags: ['routing', 'assignments'],
        },
        {
          title: 'Add conversation tagging and categorization',
          description: 'Manual and auto-tagging for better organization',
          status: 'todo',
          priority: 'medium',
          sortOrder: 3,
          tags: ['tagging', 'organization'],
        },
      ],
    },
    {
      name: 'Galaxy Studio',
      description: 'Visual workflow builder with no-code automation',
      status: 'not_started',
      targetCompletionPercent: 100,
      sortOrder: 5,
      tags: ['studio', 'workflows'],
      tasks: [
        {
          title: 'Design and implement node-based editor UI',
          description: 'React Flow-based visual editor for workflows',
          status: 'todo',
          priority: 'urgent',
          sortOrder: 1,
          tags: ['ui', 'editor'],
        },
        {
          title: 'Create workflow execution engine',
          description: 'Backend engine to process and execute visual workflows',
          status: 'todo',
          priority: 'urgent',
          sortOrder: 2,
          tags: ['backend', 'execution'],
        },
        {
          title: 'Build library of pre-built workflow templates',
          description: 'Common workflow patterns ready to use',
          status: 'todo',
          priority: 'medium',
          sortOrder: 3,
          tags: ['templates', 'library'],
        },
      ],
    },
  ],
};
