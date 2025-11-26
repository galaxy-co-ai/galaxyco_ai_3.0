import 'dotenv/config';
import { db } from '@/lib/db';
import { 
  workspaces, 
  users, 
  workspaceMembers,
  agents, 
  tasks, 
  contacts, 
  prospects, 
  projects,
  knowledgeCollections,
  knowledgeItems,
} from '@/db/schema';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Create a demo workspace
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: 'Demo Workspace',
        slug: 'demo',
      })
      .onConflictDoNothing()
      .returning();

    if (!workspace) {
      console.log('✅ Workspace already exists');
      const existing = await db.query.workspaces.findFirst({
        where: (workspaces, { eq }) => eq(workspaces.slug, 'demo'),
      });
      if (!existing) throw new Error('Failed to create workspace');
      
      console.log('✅ Database seeding complete!');
      return existing.id;
    }

    console.log(`✅ Created workspace: ${workspace.name}`);

    // Create a demo user first (required for createdBy fields)
    const [demoUser] = await db
      .insert(users)
      .values({
        clerkUserId: 'demo_user_seed',
        email: 'demo@galaxyco.ai',
        firstName: 'Demo',
        lastName: 'User',
      })
      .onConflictDoNothing()
      .returning();

    const userId = demoUser?.id || (await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'demo@galaxyco.ai'),
    }))?.id;

    if (!userId) {
      throw new Error('Failed to create demo user');
    }

    // Add user to workspace as admin
    await db
      .insert(workspaceMembers)
      .values({
        workspaceId: workspace.id,
        userId: userId,
        role: 'admin',
      })
      .onConflictDoNothing();

    console.log(`✅ Created demo user and added to workspace`);

    // Create demo agents
    const agentData = [
      {
        workspaceId: workspace.id,
        createdBy: userId,
        name: 'Sales Assistant',
        type: 'sales' as const,
        description: 'Helps with lead qualification and follow-ups',
        status: 'active' as const,
        executionCount: 142,
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        name: 'Content Writer',
        type: 'content' as const,
        description: 'Generates blog posts and marketing copy',
        status: 'active' as const,
        executionCount: 89,
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        name: 'Data Analyzer',
        type: 'data' as const,
        description: 'Analyzes CRM data and provides insights',
        status: 'active' as const,
        executionCount: 56,
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        name: 'Email Agent',
        type: 'email' as const,
        description: 'Automates email campaigns and follow-ups',
        status: 'paused' as const,
        executionCount: 234,
      },
    ];

    await db.insert(agents).values(agentData);
    console.log(`✅ Created ${agentData.length} demo agents`);

    // Create demo tasks
    const taskData = [
      {
        workspaceId: workspace.id,
        createdBy: userId,
        title: 'Follow up with hot leads',
        description: 'Contact all leads with score > 80',
        status: 'done' as const,
        priority: 'high' as const,
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        title: 'Generate weekly report',
        description: 'Create analytics report for last week',
        status: 'done' as const,
        priority: 'medium' as const,
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        title: 'Update CRM data',
        description: 'Sync data from integrations',
        status: 'in_progress' as const,
        priority: 'medium' as const,
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        title: 'Draft product announcement',
        description: 'Write blog post for new feature launch',
        status: 'todo' as const,
        priority: 'high' as const,
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        title: 'Review automation workflows',
        description: 'Check and optimize existing workflows',
        status: 'todo' as const,
        priority: 'low' as const,
      },
    ];

    await db.insert(tasks).values(taskData);
    console.log(`✅ Created ${taskData.length} demo tasks`);

    // Create demo contacts
    const contactData = [
      {
        workspaceId: workspace.id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@techcorp.com',
        company: 'TechCorp Inc',
        title: 'VP of Sales',
        phone: '+1 (555) 123-4567',
        tags: ['enterprise', 'hot-lead'],
      },
      {
        workspaceId: workspace.id,
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@innovate.io',
        company: 'Innovate Solutions',
        title: 'CTO',
        phone: '+1 (555) 234-5678',
        tags: ['technical', 'decision-maker'],
      },
      {
        workspaceId: workspace.id,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.r@startup.com',
        company: 'StartupXYZ',
        title: 'CEO',
        phone: '+1 (555) 345-6789',
        tags: ['startup', 'warm-lead'],
      },
      {
        workspaceId: workspace.id,
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@enterprise.com',
        company: 'Enterprise Corp',
        title: 'Director of Operations',
        phone: '+1 (555) 456-7890',
        tags: ['enterprise', 'qualified'],
      },
      {
        workspaceId: workspace.id,
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.a@marketing.pro',
        company: 'Marketing Pros',
        title: 'Marketing Manager',
        phone: '+1 (555) 567-8901',
        tags: ['marketing', 'cold-lead'],
      },
    ];

    await db.insert(contacts).values(contactData);
    console.log(`✅ Created ${contactData.length} demo contacts`);

    // Create demo prospects/deals
    const prospectData = [
      {
        workspaceId: workspace.id,
        name: 'TechCorp Enterprise Deal',
        company: 'TechCorp Inc',
        estimatedValue: 150000,
        stage: 'proposal' as const,
        score: 85,
        notes: 'Very interested in enterprise plan. Decision in 2 weeks.',
      },
      {
        workspaceId: workspace.id,
        name: 'Innovate Solutions Implementation',
        company: 'Innovate Solutions',
        estimatedValue: 75000,
        stage: 'negotiation' as const,
        score: 92,
        notes: 'Technical requirements met. Negotiating contract terms.',
      },
      {
        workspaceId: workspace.id,
        name: 'StartupXYZ Trial',
        company: 'StartupXYZ',
        estimatedValue: 25000,
        stage: 'qualified' as const,
        score: 70,
        notes: 'Completed trial. Waiting for budget approval.',
      },
      {
        workspaceId: workspace.id,
        name: 'Enterprise Corp Expansion',
        company: 'Enterprise Corp',
        estimatedValue: 200000,
        stage: 'new' as const,
        score: 65,
        notes: 'Initial interest shown. Need to schedule demo.',
      },
    ];

    await db.insert(prospects).values(prospectData);
    console.log(`✅ Created ${prospectData.length} demo prospects`);

    // Create demo projects
    const projectData = [
      {
        workspaceId: workspace.id,
        name: 'Q4 Marketing Campaign',
        description: 'End of year marketing push',
        status: 'in_progress' as const,
        progress: 65,
        budget: 50000,
      },
      {
        workspaceId: workspace.id,
        name: 'Website Redesign',
        description: 'Update company website with new branding',
        status: 'planning' as const,
        progress: 20,
        budget: 75000,
      },
      {
        workspaceId: workspace.id,
        name: 'CRM Integration',
        description: 'Integrate Salesforce with internal tools',
        status: 'completed' as const,
        progress: 100,
        budget: 30000,
      },
    ];

    await db.insert(projects).values(projectData);
    console.log(`✅ Created ${projectData.length} demo projects`);

    // Create demo knowledge collections
    const [collection] = await db
      .insert(knowledgeCollections)
      .values({
        workspaceId: workspace.id,
        createdBy: userId,
        name: 'Product Documentation',
        description: 'Internal product docs and guides',
        color: '#3b82f6',
        icon: 'book',
        itemCount: 0,
      })
      .returning();

    console.log(`✅ Created knowledge collection: ${collection.name}`);

    // Create demo knowledge items
    const knowledgeData = [
      {
        workspaceId: workspace.id,
        createdBy: userId,
        collectionId: collection.id,
        title: 'Getting Started Guide',
        type: 'document' as const,
        content: 'This is a comprehensive guide to getting started with GalaxyCo.ai...',
        summary: 'A beginner-friendly guide covering setup, configuration, and first steps.',
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        collectionId: collection.id,
        title: 'API Documentation',
        type: 'document' as const,
        content: 'Complete API reference for developers...',
        summary: 'Technical documentation for integrating with our API.',
      },
      {
        workspaceId: workspace.id,
        createdBy: userId,
        collectionId: collection.id,
        title: 'Best Practices',
        type: 'document' as const,
        content: 'Learn the best practices for using GalaxyCo.ai effectively...',
        summary: 'Tips and tricks for power users.',
      },
    ];

    await db.insert(knowledgeItems).values(knowledgeData);
    console.log(`✅ Created ${knowledgeData.length} knowledge items`);

    // Update collection item count
    const { eq } = await import('drizzle-orm');
    await db
      .update(knowledgeCollections)
      .set({ itemCount: knowledgeData.length })
      .where(eq(knowledgeCollections.id, collection.id));

    console.log('\n✅ Database seeding complete!');
    console.log(`📊 Summary:
  - Agents: ${agentData.length}
  - Tasks: ${taskData.length}
  - Contacts: ${contactData.length}
  - Prospects: ${prospectData.length}
  - Projects: ${projectData.length}
  - Knowledge Items: ${knowledgeData.length}
`);

    return workspace.id;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

