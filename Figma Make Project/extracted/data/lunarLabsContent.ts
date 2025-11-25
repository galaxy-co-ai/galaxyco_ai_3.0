// Lunar Labs Content Structure
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  instant: boolean;
  action: string;
  category: 'enable' | 'add' | 'import' | 'bookmark';
}

export interface FAQ {
  question: string;
  answer: string;
  relatedTopics?: string[];
}

export interface SandboxDemo {
  id: string;
  title: string;
  description: string;
  component: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  guided: boolean;
}

export interface TopicSection {
  type: 'overview' | 'sandbox' | 'documentation' | 'faqs' | 'video';
  title: string;
  content?: string;
  demo?: SandboxDemo;
  faqs?: FAQ[];
  videoUrl?: string;
  codeSnippet?: string;
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  category: 'getting-started' | 'crm' | 'integrations' | 'ai-agents' | 'workflows' | 'pro-tips' | 'knowledge-base';
  description: string;
  sections: TopicSection[];
  quickActions: QuickAction[];
  relatedTopics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
}

export interface WhatsNew {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'feature' | 'integration' | 'improvement' | 'tip';
  demoId?: string;
  topicId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
  xp: number;
}

// What's New Feed
export const whatsNewFeed: WhatsNew[] = [
  {
    id: 'wn-1',
    title: 'Smart Lead Scoring Now Live',
    description: 'AI automatically scores leads based on engagement, demographics, and behavior patterns.',
    date: '2025-11-04',
    category: 'feature',
    topicId: 'crm-deep-dive'
  },
  {
    id: 'wn-2',
    title: 'Gmail Integration Enhanced',
    description: 'Auto-categorize emails, extract action items, and create CRM contacts automatically.',
    date: '2025-11-03',
    category: 'integration',
    topicId: 'integrations-gmail'
  },
  {
    id: 'wn-3',
    title: 'Pro Tip: Workflow Shortcuts',
    description: 'Press Cmd+K in Studio to quick-add nodes without dragging from palette.',
    date: '2025-11-01',
    category: 'tip',
    topicId: 'workflows-advanced'
  }
];

// Achievements
export const achievements: Achievement[] = [
  { id: 'first-demo', title: 'Explorer', description: 'Completed your first demo', icon: '🚀', requirement: 'Complete 1 demo', xp: 10 },
  { id: 'integration-master', title: 'Integration Master', description: 'Connected 3+ integrations', icon: '🔗', requirement: 'Connect 3 integrations', xp: 50 },
  { id: 'crm-expert', title: 'CRM Expert', description: 'Mastered all CRM features', icon: '📊', requirement: 'Complete all CRM demos', xp: 100 },
  { id: 'workflow-wizard', title: 'Workflow Wizard', description: 'Created 5+ workflows', icon: '⚡', requirement: 'Create 5 workflows', xp: 75 },
  { id: 'ai-commander', title: 'AI Commander', description: 'Trained and deployed custom AI agents', icon: '🤖', requirement: 'Deploy 3 AI agents', xp: 150 },
  { id: 'speed-learner', title: 'Speed Learner', description: 'Completed 10 demos in one session', icon: '⚡', requirement: 'Complete 10 demos', xp: 200 }
];

// Topics Content
export const topics: Topic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    category: 'getting-started',
    description: 'Welcome to GalaxyCo.ai! Learn the basics and get your first quick wins.',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    tags: ['onboarding', 'basics', 'setup'],
    sections: [
      {
        type: 'overview',
        title: 'Welcome to GalaxyCo.ai',
        content: `GalaxyCo.ai is your AI-native workspace that integrates intelligent agents and automated workflows directly into your company ecosystem.

**Three Core Pillars:**

1. **Knowledge Base** - Centralized company documentation with AI-powered search
2. **AI-Native CRM** - Auto-transcribes calls, meetings, and emails into actionable data
3. **AI Assistant** - Orchestrates tasks to specialized agents

**Your First Quick Wins:**
- Connect your Gmail account (2 min)
- Import your first contacts (1 min)
- Create your first automated workflow (5 min)

Let's get you up and running!`
      },
      {
        type: 'sandbox',
        title: 'Try It: Dashboard Overview',
        demo: {
          id: 'dashboard-tour',
          title: 'Interactive Dashboard Tour',
          description: 'Explore your command center',
          component: 'DashboardDemo',
          difficulty: 'beginner',
          estimatedTime: '3 min',
          guided: true
        }
      },
      {
        type: 'faqs',
        title: 'Common Questions',
        faqs: [
          {
            question: 'What makes GalaxyCo.ai different from other CRMs?',
            answer: 'GalaxyCo.ai is AI-native from the ground up. Every feature is designed to save you time through automation, not just organize data. Our AI agents actively work for you - transcribing calls, scoring leads, drafting emails, and more.'
          },
          {
            question: 'Is my data secure?',
            answer: 'Absolutely. We use enterprise-grade encryption, SOC 2 compliance, and never share your data. All AI processing happens in secure, isolated environments.'
          },
          {
            question: 'How long does setup take?',
            answer: 'Most users are up and running in under 15 minutes. Our AI-guided onboarding walks you through each step, and you can skip sections you don\'t need right away.'
          }
        ]
      }
    ],
    quickActions: [
      {
        id: 'qa-onboarding',
        label: 'Start Guided Setup',
        description: 'AI walks you through setup',
        icon: '🎯',
        instant: true,
        action: 'start-onboarding',
        category: 'enable'
      },
      {
        id: 'qa-dashboard-widget',
        label: 'Add Quick Stats Widget',
        description: 'See your key metrics at a glance',
        icon: '📊',
        instant: true,
        action: 'add-widget-stats',
        category: 'add'
      }
    ],
    relatedTopics: ['crm-deep-dive', 'integrations-gmail', 'ai-agents-intro']
  },
  {
    id: 'crm-deep-dive',
    title: 'CRM Deep Dive',
    icon: '📊',
    category: 'crm',
    description: 'Master contact management, lead scoring, and sales pipeline automation.',
    difficulty: 'intermediate',
    estimatedTime: '20 min',
    tags: ['crm', 'contacts', 'leads', 'sales'],
    sections: [
      {
        type: 'overview',
        title: 'AI-Native CRM Overview',
        content: `Our CRM isn't just a contact database - it's an intelligent system that actively works for you.

**Key Features:**

**Smart Contact Management**
- Auto-enrichment from public data sources
- Duplicate detection and merging
- Relationship mapping and org charts
- Custom fields and tags

**Lead Scoring**
- AI analyzes engagement patterns
- Behavioral scoring (email opens, clicks, meeting attendance)
- Demographic scoring (company size, role, industry)
- Real-time score updates

**Sales Pipeline**
- Visual deal tracking
- Automated stage progression
- Win/loss analysis
- Revenue forecasting

**Activity Tracking**
- Auto-logged emails and meetings
- Call transcription and summarization
- Task automation
- Follow-up reminders`
      },
      {
        type: 'sandbox',
        title: 'Try It: Manage Contacts',
        demo: {
          id: 'crm-contact-demo',
          title: 'CRM Contact Management',
          description: 'Create, edit, and enrich contacts',
          component: 'CRMContactDemo',
          difficulty: 'beginner',
          estimatedTime: '5 min',
          guided: true
        }
      },
      {
        type: 'sandbox',
        title: 'Try It: Email Composer',
        demo: {
          id: 'email-composer-demo',
          title: 'AI Email Composer',
          description: 'Draft emails with AI assistance',
          component: 'EmailComposerDemo',
          difficulty: 'beginner',
          estimatedTime: '5 min',
          guided: true
        }
      },
      {
        type: 'faqs',
        title: 'CRM FAQs',
        faqs: [
          {
            question: 'How does AI lead scoring work?',
            answer: 'Our AI analyzes dozens of signals including email engagement, website visits, meeting attendance, company data, and historical patterns. Scores update in real-time as new data comes in. You can also customize scoring criteria to match your sales process.'
          },
          {
            question: 'Can I import contacts from other CRMs?',
            answer: 'Yes! We support imports from Salesforce, HubSpot, Pipedrive, and CSV files. Our AI automatically maps fields and detects duplicates during import.'
          },
          {
            question: 'How does call transcription work?',
            answer: 'When you connect your calendar and meeting tools (Zoom, Google Meet, etc.), our AI automatically joins calls, transcribes them, extracts action items, and logs everything to the contact record. No manual work required.'
          }
        ]
      }
    ],
    quickActions: [
      {
        id: 'qa-crm-widget',
        label: 'Add CRM Widget to Dashboard',
        description: 'Quick access to contacts and deals',
        icon: '📊',
        instant: true,
        action: 'add-widget-crm',
        category: 'add'
      },
      {
        id: 'qa-import-contacts',
        label: 'Import Sample Contacts',
        description: 'Try CRM with demo data',
        icon: '📥',
        instant: true,
        action: 'import-sample-contacts',
        category: 'import'
      },
      {
        id: 'qa-enable-lead-scoring',
        label: 'Enable AI Lead Scoring',
        description: 'Auto-score all contacts',
        icon: '⭐',
        instant: true,
        action: 'enable-lead-scoring',
        category: 'enable'
      }
    ],
    relatedTopics: ['integrations-gmail', 'workflows-sales', 'ai-agents-sales']
  },
  {
    id: 'integrations-gmail',
    title: 'Gmail Integration',
    icon: '📧',
    category: 'integrations',
    description: 'Connect Gmail to auto-sync emails, create contacts, and draft messages.',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    tags: ['integration', 'gmail', 'email', 'setup'],
    sections: [
      {
        type: 'overview',
        title: 'Gmail Integration Setup',
        content: `Connect your Gmail account to unlock powerful email automation.

**What You'll Get:**

**Auto-Sync Emails**
- All emails automatically logged to CRM
- Smart categorization (Lead, Customer, Internal)
- Thread tracking and conversation history

**Contact Creation**
- New email senders auto-added as contacts
- Email signatures parsed for company info
- LinkedIn and social profiles auto-linked

**AI Email Assistant**
- Draft emails with AI
- Smart reply suggestions
- Sentiment analysis
- Follow-up reminders

**Setup Steps:**
1. Click "Connect Gmail" in Integrations page
2. Authorize GalaxyCo.ai access
3. Choose sync settings (all mail or specific labels)
4. Done! Emails start syncing immediately`
      },
      {
        type: 'faqs',
        title: 'Gmail Integration FAQs',
        faqs: [
          {
            question: 'Is my email data private?',
            answer: 'Yes. We only access emails you explicitly grant permission for. Your emails are encrypted in transit and at rest. We never sell or share your data, and you can revoke access anytime.'
          },
          {
            question: 'Will GalaxyCo.ai send emails from my account?',
            answer: 'Only when you explicitly click "Send" in our email composer. We never send emails automatically. You have full control.'
          },
          {
            question: 'What happens to existing emails?',
            answer: 'During initial sync, we can import historical emails (you choose how far back). This helps build a complete contact history and trains the AI on your communication style.'
          }
        ]
      }
    ],
    quickActions: [
      {
        id: 'qa-connect-gmail',
        label: 'Connect Gmail Now',
        description: 'One-click authorization',
        icon: '🔗',
        instant: true,
        action: 'connect-gmail',
        category: 'enable'
      },
      {
        id: 'qa-email-templates',
        label: 'Import Email Templates',
        description: 'Pre-built templates for common scenarios',
        icon: '📝',
        instant: true,
        action: 'import-email-templates',
        category: 'import'
      }
    ],
    relatedTopics: ['crm-deep-dive', 'integrations-calendar', 'workflows-email']
  },
  {
    id: 'ai-agents-intro',
    title: 'AI Agents Introduction',
    icon: '🤖',
    category: 'ai-agents',
    description: 'Learn how AI agents work autonomously to complete tasks and save you time.',
    difficulty: 'intermediate',
    estimatedTime: '15 min',
    tags: ['ai', 'agents', 'automation', 'workflows'],
    sections: [
      {
        type: 'overview',
        title: 'Understanding AI Agents',
        content: `AI Agents are specialized workers that handle specific tasks autonomously.

**How Agents Work:**

**1. Specialized Expertise**
Each agent is trained for specific tasks:
- **Lead Qualifier Agent** - Researches and scores leads
- **Email Drafter Agent** - Writes personalized emails
- **Meeting Scheduler Agent** - Finds times and sends invites
- **Data Enrichment Agent** - Finds company and contact info
- **Content Summarizer Agent** - Summarizes docs and calls

**2. Autonomous Operation**
- Agents work 24/7 in the background
- No manual triggers needed
- Multi-step reasoning and decision making
- Error handling and retry logic

**3. Team Orchestration**
Agents work together on complex tasks:
- Lead Qualifier → Email Drafter → Scheduler
- Each agent passes results to the next
- Full audit trail of all actions

**4. Human-in-the-Loop**
- Agents can ask for approval on important actions
- You set confidence thresholds
- Override or redirect agent decisions anytime`
      },
      {
        type: 'sandbox',
        title: 'Try It: Create Your First Agent',
        demo: {
          id: 'agent-builder-demo',
          title: 'Agent Builder Sandbox',
          description: 'Build and test an AI agent',
          component: 'WorkflowBuilderDemo',
          difficulty: 'intermediate',
          estimatedTime: '8 min',
          guided: true
        }
      },
      {
        type: 'faqs',
        title: 'AI Agent FAQs',
        faqs: [
          {
            question: 'Can agents make mistakes?',
            answer: 'Agents are highly accurate but not perfect. That\'s why we have confidence scores and approval workflows. You can set thresholds - agents only take action when confidence is above your chosen level. Everything is logged and can be undone.'
          },
          {
            question: 'How do I train agents for my specific use case?',
            answer: 'Agents learn from your feedback. When an agent completes a task, you can approve or reject the result. Over time, agents learn your preferences and improve accuracy. You can also provide examples and guidelines in the agent settings.'
          },
          {
            question: 'What tasks should I automate with agents?',
            answer: 'Start with repetitive, high-volume tasks: lead qualification, email follow-ups, data entry, meeting scheduling. Once comfortable, move to complex workflows like multi-step sales sequences or customer onboarding.'
          }
        ]
      }
    ],
    quickActions: [
      {
        id: 'qa-enable-agents',
        label: 'Enable AI Agents',
        description: 'Turn on autonomous automation',
        icon: '🤖',
        instant: true,
        action: 'enable-ai-agents',
        category: 'enable'
      },
      {
        id: 'qa-agent-templates',
        label: 'Browse Agent Templates',
        description: 'Pre-built agents for common tasks',
        icon: '📚',
        instant: true,
        action: 'browse-agent-templates',
        category: 'import'
      }
    ],
    relatedTopics: ['workflows-advanced', 'studio-overview', 'integrations-overview']
  },
  {
    id: 'workflows-basics',
    title: 'Workflow Basics',
    icon: '⚡',
    category: 'workflows',
    description: 'Create your first automated workflow with our visual Studio builder.',
    difficulty: 'beginner',
    estimatedTime: '12 min',
    tags: ['workflows', 'automation', 'studio', 'no-code'],
    sections: [
      {
        type: 'overview',
        title: 'Building Your First Workflow',
        content: `Workflows automate multi-step processes without code.

**Workflow Anatomy:**

**Triggers** - What starts the workflow
- New contact created
- Email received
- Form submitted
- Time-based (daily, weekly)
- Webhook from external service

**Actions** - What happens next
- Send email
- Create task
- Update CRM field
- Call AI agent
- HTTP request to external API

**Conditions** - Logic and branching
- If lead score > 80 → Notify sales
- If company size > 500 → Assign to enterprise team
- If no response in 3 days → Send follow-up

**Visual Builder:**
- Drag and drop nodes
- Connect with arrows
- Live testing and debugging
- Version control and rollback`
      },
      {
        type: 'sandbox',
        title: 'Try It: Build a Workflow',
        demo: {
          id: 'workflow-builder-basic',
          title: 'Workflow Builder Sandbox',
          description: 'Create a simple automation',
          component: 'WorkflowBuilderDemo',
          difficulty: 'beginner',
          estimatedTime: '7 min',
          guided: true
        }
      },
      {
        type: 'faqs',
        title: 'Workflow FAQs',
        faqs: [
          {
            question: 'How do I test workflows before going live?',
            answer: 'Use the "Test Run" feature in Studio. You can simulate triggers with sample data, step through each node, and see outputs in real-time. No real actions are taken until you publish the workflow.'
          },
          {
            question: 'Can workflows call external APIs?',
            answer: 'Yes! Use HTTP Request nodes to call any REST API. You can authenticate with API keys, OAuth, or custom headers. Great for integrating with tools we don\'t have native integrations for yet.'
          },
          {
            question: 'What happens if a workflow fails?',
            answer: 'Failed workflows appear in the Activity Feed with error details. You can retry them, or set up automatic retry logic with exponential backoff. We also send alerts if critical workflows fail.'
          }
        ]
      }
    ],
    quickActions: [
      {
        id: 'qa-workflow-templates',
        label: 'Browse Workflow Templates',
        description: 'Pre-built workflows you can customize',
        icon: '📋',
        instant: true,
        action: 'browse-workflow-templates',
        category: 'import'
      },
      {
        id: 'qa-create-workflow',
        label: 'Create Your First Workflow',
        description: 'Open Studio and start building',
        icon: '⚡',
        instant: true,
        action: 'create-first-workflow',
        category: 'add'
      }
    ],
    relatedTopics: ['studio-overview', 'ai-agents-intro', 'workflows-advanced']
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    icon: '📚',
    category: 'knowledge-base',
    description: 'Centralize company docs with AI-powered search and automatic organization.',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    tags: ['knowledge', 'documentation', 'search', 'wiki'],
    sections: [
      {
        type: 'overview',
        title: 'Smart Knowledge Management',
        content: `Your Knowledge Base is more than a file storage - it's an intelligent documentation hub.

**Key Features:**

**Unified Search**
- Natural language queries: "How do we handle refunds?"
- Search across all documents, not just titles
- AI understands context and synonyms
- Instant results with relevant snippets

**Auto-Organization**
- AI suggests categories and tags
- Duplicate detection
- Version control
- Related document linking

**Collaboration**
- Real-time editing
- Comments and mentions
- Change tracking
- Access controls per document

**AI Features**
- Automatic summarization
- Key points extraction
- Q&A over documents
- "Ask about this document" chat

**Import From:**
- Google Drive
- Notion
- Confluence
- Dropbox
- Local files (PDF, DOCX, MD, TXT)`
      },
      {
        type: 'faqs',
        title: 'Knowledge Base FAQs',
        faqs: [
          {
            question: 'Can I import existing documentation?',
            answer: 'Yes! Bulk import from Google Drive, Notion, Confluence, or upload files directly. Our AI automatically organizes, tags, and indexes everything for search.'
          },
          {
            question: 'How does AI search work?',
            answer: 'Instead of keyword matching, our AI understands the meaning of your query. Ask "refund policy" and it finds documents about returns, money-back guarantees, etc. - even if those exact words aren\'t in the title.'
          },
          {
            question: 'Can I control who sees what?',
            answer: 'Absolutely. Set permissions per document or folder. Options include: Public (everyone), Team (specific teams), Private (only you), or Custom (specific users). Admins can override for audit purposes.'
          }
        ]
      }
    ],
    quickActions: [
      {
        id: 'qa-import-docs',
        label: 'Import Documentation',
        description: 'Bulk import from Google Drive or files',
        icon: '📥',
        instant: true,
        action: 'import-knowledge-base',
        category: 'import'
      },
      {
        id: 'qa-kb-widget',
        label: 'Add Search Widget',
        description: 'Quick access to KB search',
        icon: '🔍',
        instant: true,
        action: 'add-widget-kb-search',
        category: 'add'
      }
    ],
    relatedTopics: ['ai-agents-intro', 'integrations-drive']
  }
];

// Search suggestions
export const searchSuggestions = [
  'How do I connect Gmail?',
  'Show me CRM features',
  'Create my first workflow',
  'What are AI agents?',
  'Import contacts from Salesforce',
  'Set up lead scoring',
  'Build an email sequence',
  'Auto-transcribe meetings',
  'Integrate with Slack',
  'Advanced workflow examples'
];

// Role-based personalization
export const rolePersonalization = {
  sales: {
    suggestedTopics: ['crm-deep-dive', 'integrations-gmail', 'workflows-basics', 'ai-agents-intro'],
    suggestedActions: ['enable-lead-scoring', 'import-email-templates', 'connect-gmail'],
    welcomeMessage: 'Welcome, Sales Pro! Let\'s get you closing deals faster with AI automation.'
  },
  support: {
    suggestedTopics: ['knowledge-base', 'ai-agents-intro', 'integrations-gmail'],
    suggestedActions: ['import-knowledge-base', 'enable-ai-agents', 'add-widget-kb-search'],
    welcomeMessage: 'Welcome, Support Hero! Learn how AI can help you resolve tickets faster.'
  },
  marketing: {
    suggestedTopics: ['crm-deep-dive', 'workflows-basics', 'ai-agents-intro'],
    suggestedActions: ['import-sample-contacts', 'browse-workflow-templates', 'enable-lead-scoring'],
    welcomeMessage: 'Welcome, Marketing Maestro! Let\'s automate campaigns and score leads with AI.'
  },
  operations: {
    suggestedTopics: ['workflows-basics', 'ai-agents-intro', 'knowledge-base'],
    suggestedActions: ['browse-workflow-templates', 'enable-ai-agents', 'import-knowledge-base'],
    welcomeMessage: 'Welcome, Operations Expert! Streamline processes with intelligent automation.'
  },
  developer: {
    suggestedTopics: ['workflows-basics', 'ai-agents-intro', 'integrations-overview'],
    suggestedActions: ['browse-workflow-templates', 'create-first-workflow'],
    welcomeMessage: 'Welcome, Developer! Build custom workflows and integrate with any API.'
  }
};
