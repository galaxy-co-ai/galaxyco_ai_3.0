/**
 * Database Seed Script
 * 
 * Seeds the database with starter data including:
 * - Creator templates (email, social, document templates)
 * 
 * Run with: npm run db:seed
 */

import 'dotenv/config';
import { db } from '@/lib/db';
import { creatorTemplates, blogVoiceProfiles, workspaces } from '@/db/schema';

// Helper to create section with correct type
function section(
  id: string, 
  type: 'title' | 'heading' | 'paragraph' | 'list' | 'cta', 
  content: string
) {
  return { id, type, content, editable: true as const };
}

// Template definitions
const STARTER_TEMPLATES = [
  // Email Templates
  {
    name: 'Product Launch Email',
    description: 'Announce a new product or feature to your audience with impact',
    type: 'newsletter',
    category: 'email',
    isPremium: false,
    content: {
      sections: [
        section('title', 'title', '🚀 Introducing [Product Name]'),
        section('greeting', 'paragraph', 'Hi [First Name],\n\nWe have exciting news to share!'),
        section('announcement', 'heading', "What's New"),
        section('details', 'paragraph', "We've been working hard to bring you [Product Name], and it's finally here."),
        section('features', 'list', 'Feature 1: [Description]\nFeature 2: [Description]\nFeature 3: [Description]'),
        section('cta', 'cta', 'Try It Now →'),
      ],
      variables: { productName: '', firstName: '' },
    },
  },
  {
    name: 'Weekly Newsletter',
    description: 'Keep your audience engaged with regular updates',
    type: 'newsletter',
    category: 'email',
    isPremium: false,
    content: {
      sections: [
        section('title', 'title', 'Your Weekly Update'),
        section('intro', 'paragraph', "Here's what you missed this week:"),
        section('highlights', 'heading', 'Highlights'),
        section('content', 'list', 'Update 1\nUpdate 2\nUpdate 3'),
        section('upcoming', 'heading', 'Coming Up'),
        section('preview', 'paragraph', 'Next week, look forward to...'),
        section('cta', 'cta', 'Read More on Our Blog →'),
      ],
    },
  },
  {
    name: 'Welcome Email Sequence',
    description: 'Onboard new subscribers with a warm welcome series',
    type: 'newsletter',
    category: 'email',
    isPremium: true,
    content: {
      sections: [
        section('title', 'title', 'Welcome to [Company]! 🎉'),
        section('greeting', 'paragraph', "Hi [First Name],\n\nWe're thrilled to have you join us!"),
        section('what', 'heading', "Here's What You Can Expect"),
        section('benefits', 'list', 'Exclusive tips and insights\nFirst access to new features\nPersonalized recommendations'),
        section('next', 'heading', 'Your Next Steps'),
        section('steps', 'list', '1. Complete your profile\n2. Explore our resources\n3. Connect with our community'),
        section('cta', 'cta', 'Get Started Now →'),
      ],
    },
  },

  // Social Media Templates
  {
    name: 'LinkedIn Thought Leadership',
    description: 'Establish authority with professional insights',
    type: 'social',
    category: 'social',
    isPremium: false,
    content: {
      sections: [
        section('hook', 'paragraph', '[Bold statement or question that stops the scroll]'),
        section('story', 'paragraph', "Here's what I've learned:\n\n[Share your insight in 2-3 sentences]"),
        section('takeaways', 'list', '→ Key takeaway 1\n→ Key takeaway 2\n→ Key takeaway 3'),
        section('cta', 'cta', 'What are your thoughts? Comment below 👇'),
        section('hashtags', 'paragraph', '#Leadership #Business #Growth'),
      ],
    },
  },
  {
    name: 'Twitter Thread',
    description: 'Share knowledge in an engaging thread format',
    type: 'social',
    category: 'social',
    isPremium: false,
    content: {
      sections: [
        section('hook', 'paragraph', '🧵 [Topic]: Everything you need to know\n\nA thread:'),
        section('point1', 'paragraph', '1/ [First point]\n\n[Explanation]'),
        section('point2', 'paragraph', '2/ [Second point]\n\n[Explanation]'),
        section('point3', 'paragraph', '3/ [Third point]\n\n[Explanation]'),
        section('cta', 'cta', 'If you found this helpful:\n• Like & RT the first tweet\n• Follow for more\n• Drop a question below'),
      ],
    },
  },
  {
    name: 'Instagram Carousel',
    description: 'Educational content for swipe-through engagement',
    type: 'social',
    category: 'social',
    isPremium: true,
    content: {
      sections: [
        section('slide1', 'heading', 'Slide 1: [Eye-catching Title]'),
        section('slide2', 'paragraph', 'Slide 2: Problem\n[What problem does your audience face?]'),
        section('slide3', 'paragraph', 'Slide 3-5: Solution Steps\n[Break down the solution]'),
        section('slide6', 'paragraph', 'Slide 6: Summary\n[Quick recap of key points]'),
        section('slide7', 'cta', "Slide 7: CTA\n'Save this post for later!' or 'Share with a friend who needs this'"),
        section('caption', 'paragraph', 'Caption: [Hook] + [Value] + [CTA] + [Hashtags]'),
      ],
    },
  },

  // Document Templates
  {
    name: 'Meeting Notes',
    description: 'Structure your meeting notes for clarity and action',
    type: 'document',
    category: 'document',
    isPremium: false,
    content: {
      sections: [
        section('title', 'title', 'Meeting Notes: [Meeting Title]'),
        section('meta', 'paragraph', 'Date: [Date]\nAttendees: [Names]\nObjective: [Meeting goal]'),
        section('agenda', 'heading', 'Agenda'),
        section('items', 'list', '1. [Topic 1]\n2. [Topic 2]\n3. [Topic 3]'),
        section('discussion', 'heading', 'Discussion Notes'),
        section('notes', 'paragraph', '[Key discussion points and decisions]'),
        section('actions', 'heading', 'Action Items'),
        section('tasks', 'list', '☐ [Task] - [Owner] - Due: [Date]\n☐ [Task] - [Owner] - Due: [Date]'),
        section('next', 'paragraph', 'Next meeting: [Date/Time]'),
      ],
    },
  },
  {
    name: 'Project Brief',
    description: 'Define project scope and objectives clearly',
    type: 'document',
    category: 'document',
    isPremium: false,
    content: {
      sections: [
        section('title', 'title', 'Project Brief: [Project Name]'),
        section('overview', 'heading', 'Overview'),
        section('summary', 'paragraph', '[1-2 sentence project summary]'),
        section('objectives', 'heading', 'Objectives'),
        section('goals', 'list', '1. [Primary objective]\n2. [Secondary objective]\n3. [Tertiary objective]'),
        section('scope', 'heading', 'Scope'),
        section('inclusions', 'paragraph', 'In scope:\n[List what is included]\n\nOut of scope:\n[List what is NOT included]'),
        section('timeline', 'heading', 'Timeline'),
        section('dates', 'list', 'Start: [Date]\nMilestone 1: [Date]\nMilestone 2: [Date]\nEnd: [Date]'),
        section('team', 'heading', 'Team & Resources'),
        section('members', 'list', '[Name] - [Role]\n[Name] - [Role]'),
      ],
    },
  },

  // Proposal Templates
  {
    name: 'Business Proposal',
    description: 'Win new clients with a professional proposal',
    type: 'proposal',
    category: 'proposal',
    isPremium: true,
    content: {
      sections: [
        section('title', 'title', 'Proposal for [Client Name]'),
        section('exec', 'heading', 'Executive Summary'),
        section('summary', 'paragraph', "[Brief overview of your understanding of their needs and your proposed solution]"),
        section('problem', 'heading', 'Understanding Your Challenges'),
        section('challenges', 'list', '• [Challenge 1]\n• [Challenge 2]\n• [Challenge 3]'),
        section('solution', 'heading', 'Our Solution'),
        section('approach', 'paragraph', '[Detailed description of your solution and approach]'),
        section('deliverables', 'heading', 'Deliverables'),
        section('items', 'list', '✓ [Deliverable 1]\n✓ [Deliverable 2]\n✓ [Deliverable 3]'),
        section('timeline', 'heading', 'Timeline & Milestones'),
        section('schedule', 'paragraph', 'Week 1-2: [Phase 1]\nWeek 3-4: [Phase 2]\nWeek 5-6: [Phase 3]'),
        section('investment', 'heading', 'Investment'),
        section('pricing', 'paragraph', 'Total Investment: $[Amount]\n\n[Payment terms and conditions]'),
        section('why', 'heading', 'Why Choose Us'),
        section('differentiators', 'list', '• [Unique value prop 1]\n• [Unique value prop 2]\n• [Unique value prop 3]'),
        section('cta', 'cta', 'Ready to get started? Contact us at [email/phone]'),
      ],
    },
  },

  // Blog Templates
  {
    name: 'How-To Guide',
    description: 'Step-by-step tutorial format for teaching',
    type: 'blog',
    category: 'blog',
    isPremium: false,
    content: {
      sections: [
        section('title', 'title', 'How to [Achieve Result]: A Complete Guide'),
        section('intro', 'paragraph', "[Hook the reader with the problem they're trying to solve and promise a solution]"),
        section('what', 'heading', 'What You Will Learn'),
        section('preview', 'list', '• [Learning outcome 1]\n• [Learning outcome 2]\n• [Learning outcome 3]'),
        section('step1', 'heading', 'Step 1: [First Action]'),
        section('step1content', 'paragraph', '[Detailed explanation of step 1]'),
        section('step2', 'heading', 'Step 2: [Second Action]'),
        section('step2content', 'paragraph', '[Detailed explanation of step 2]'),
        section('step3', 'heading', 'Step 3: [Third Action]'),
        section('step3content', 'paragraph', '[Detailed explanation of step 3]'),
        section('tips', 'heading', 'Pro Tips'),
        section('tipslist', 'list', '💡 [Tip 1]\n💡 [Tip 2]\n💡 [Tip 3]'),
        section('conclusion', 'heading', 'Conclusion'),
        section('outro', 'paragraph', '[Summarize the key steps and encourage action]'),
        section('cta', 'cta', '[What should readers do next?]'),
      ],
    },
  },
  {
    name: 'Listicle',
    description: 'Numbered list format for easy reading',
    type: 'blog',
    category: 'blog',
    isPremium: false,
    content: {
      sections: [
        section('title', 'title', '[Number] [Topic] That Will [Benefit]'),
        section('intro', 'paragraph', '[Set the stage for why this list matters]'),
        section('item1', 'heading', '1. [First Item]'),
        section('item1content', 'paragraph', '[Explanation and examples]'),
        section('item2', 'heading', '2. [Second Item]'),
        section('item2content', 'paragraph', '[Explanation and examples]'),
        section('item3', 'heading', '3. [Third Item]'),
        section('item3content', 'paragraph', '[Explanation and examples]'),
        section('bonus', 'heading', 'Bonus: [Extra Item]'),
        section('bonuscontent', 'paragraph', '[Something extra to delight readers]'),
        section('conclusion', 'paragraph', '[Wrap up and call to action]'),
      ],
    },
  },
];

async function seedTemplates() {
  console.log('🌱 Seeding creator templates...');
  
  try {
    // Check if templates already exist
    const existingTemplates = await db.query.creatorTemplates.findMany({
      limit: 1,
    });

    if (existingTemplates.length > 0) {
      console.log('  ℹ️  Templates already exist, skipping seed');
      return;
    }

    // Insert templates
    for (const template of STARTER_TEMPLATES) {
      await db.insert(creatorTemplates).values({
        name: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        content: template.content,
        isPremium: template.isPremium,
        usageCount: 0,
      });
      console.log(`  ✓ Created template: ${template.name}`);
    }

    console.log(`\n✅ Successfully seeded ${STARTER_TEMPLATES.length} templates!`);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
}

// Default voice profile for Article Studio
const DEFAULT_VOICE_PROFILE = {
  toneDescriptors: [
    'Professional',
    'Friendly',
    'Clear',
    'Actionable',
    'Engaging',
  ],
  examplePhrases: [
    "Here's what you need to know",
    "Let's dive in",
    "The key takeaway is",
    "In practice, this means",
    "To get started",
  ],
  avoidPhrases: [
    "Basically",
    "Obviously",
    "As you know",
    "It goes without saying",
    "To be honest",
  ],
  avgSentenceLength: 18,
  structurePreferences: {
    preferredIntroStyle: 'Hook with a question or bold statement, then preview what the reader will learn',
    preferredConclusionStyle: 'Summarize key points and include a clear call-to-action',
    usesSubheadings: true,
    usesBulletPoints: true,
    includesCallToAction: true,
  },
};

async function seedVoiceProfiles() {
  console.log('🎙️ Seeding default voice profiles...');
  
  try {
    // Get all workspaces that don't have a voice profile
    const allWorkspaces = await db.select().from(workspaces);
    
    if (allWorkspaces.length === 0) {
      console.log('  ℹ️  No workspaces found, skipping voice profile seed');
      return;
    }

    let created = 0;
    for (const workspace of allWorkspaces) {
      // Check if profile already exists for this workspace
      const existingProfile = await db.query.blogVoiceProfiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.workspaceId, workspace.id),
      });

      if (existingProfile) {
        console.log(`  ℹ️  Voice profile already exists for workspace: ${workspace.name}`);
        continue;
      }

      // Create default voice profile
      await db.insert(blogVoiceProfiles).values({
        workspaceId: workspace.id,
        ...DEFAULT_VOICE_PROFILE,
        analyzedPostCount: 0,
      });
      
      console.log(`  ✓ Created voice profile for workspace: ${workspace.name}`);
      created++;
    }

    if (created > 0) {
      console.log(`\n✅ Successfully seeded ${created} voice profile(s)!`);
    } else {
      console.log('  ℹ️  All workspaces already have voice profiles');
    }
  } catch (error) {
    console.error('❌ Error seeding voice profiles:', error);
    // Don't throw - voice profiles are optional
  }
}

async function main() {
  console.log('\n🚀 Starting database seed...\n');
  
  await seedTemplates();
  await seedVoiceProfiles();
  
  console.log('\n🎉 Seed complete!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
