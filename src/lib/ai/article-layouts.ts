/**
 * Article Layout Templates for Article Studio
 * 
 * Defines 7 layout templates with section structures, AI prompts, 
 * word counts, and recommended elements for each article type.
 */

// Section types used across all layouts
export type SectionType = 'intro' | 'body' | 'conclusion' | 'cta' | 'step' | 'item' | 'background' | 'solution' | 'results' | 'verdict' | 'pros-cons';

// Section definition within a template
export interface LayoutSection {
  id: string;
  title: string;
  type: SectionType;
  description: string;
  suggestedWordCount: number;
  aiPrompt: string;
  isRequired: boolean;
  canHaveBullets: boolean;
  maxBullets?: number;
}

// Full layout template definition
export interface LayoutTemplate {
  id: 'standard' | 'how-to' | 'listicle' | 'case-study' | 'tool-review' | 'news' | 'opinion';
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  sections: LayoutSection[];
  totalWordCountTarget: number;
  recommendedElements: string[];
  bestFor: string[];
  exampleTitle: string;
}

// Generate unique section IDs
const generateId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

/**
 * Standard Article Layout
 * Classic blog post structure with intro, body sections, and conclusion
 */
export const standardLayout: LayoutTemplate = {
  id: 'standard',
  name: 'Standard Article',
  description: 'Classic blog post with introduction, body sections, and conclusion',
  icon: 'FileText',
  color: 'zinc',
  totalWordCountTarget: 1200,
  recommendedElements: ['Header image', 'Subheadings', 'Call-to-action'],
  bestFor: ['Thought leadership', 'Industry insights', 'Company news'],
  exampleTitle: 'Why Remote Work Is Here to Stay: 5 Data-Backed Reasons',
  sections: [
    {
      id: 'standard-intro',
      title: 'Introduction',
      type: 'intro',
      description: 'Hook the reader and preview what they\'ll learn',
      suggestedWordCount: 150,
      aiPrompt: 'Write an engaging introduction that hooks the reader with a surprising fact, question, or bold statement. Preview the main points without giving everything away.',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'standard-body-1',
      title: 'Main Point 1',
      type: 'body',
      description: 'First key argument or insight',
      suggestedWordCount: 250,
      aiPrompt: 'Develop the first main point with evidence, examples, or data. Make it specific and actionable.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'standard-body-2',
      title: 'Main Point 2',
      type: 'body',
      description: 'Second key argument or insight',
      suggestedWordCount: 250,
      aiPrompt: 'Develop the second main point. Build on the previous section while introducing new value.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'standard-body-3',
      title: 'Main Point 3',
      type: 'body',
      description: 'Third key argument or insight',
      suggestedWordCount: 250,
      aiPrompt: 'Develop the third main point. Consider addressing potential objections or providing deeper context.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'standard-conclusion',
      title: 'Conclusion',
      type: 'conclusion',
      description: 'Summarize and provide a call-to-action',
      suggestedWordCount: 150,
      aiPrompt: 'Wrap up with key takeaways and a clear next step for the reader. End with a memorable statement or question.',
      isRequired: true,
      canHaveBullets: false,
    },
  ],
};

/**
 * How-To Guide Layout
 * Step-by-step instructional content with numbered steps
 */
export const howToLayout: LayoutTemplate = {
  id: 'how-to',
  name: 'How-To Guide',
  description: 'Step-by-step instructional guide with clear actions',
  icon: 'ListOrdered',
  color: 'blue',
  totalWordCountTarget: 1500,
  recommendedElements: ['Numbered steps', 'Screenshots', 'Pro tips', 'Time estimate'],
  bestFor: ['Tutorials', 'Process explanations', 'Skill development'],
  exampleTitle: 'How to Set Up Your First Marketing Automation in 30 Minutes',
  sections: [
    {
      id: 'howto-intro',
      title: 'Introduction',
      type: 'intro',
      description: 'Explain what they\'ll achieve and why it matters',
      suggestedWordCount: 150,
      aiPrompt: 'Write an introduction that clearly states what the reader will accomplish. Include the time commitment and any prerequisites.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'howto-step-1',
      title: 'Step 1',
      type: 'step',
      description: 'First action step',
      suggestedWordCount: 200,
      aiPrompt: 'Write a clear, actionable first step. Include any setup or preparation needed. Be specific about what to click, type, or do.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'howto-step-2',
      title: 'Step 2',
      type: 'step',
      description: 'Second action step',
      suggestedWordCount: 200,
      aiPrompt: 'Continue with the next logical step. Build on the previous step and explain what the reader should see or expect.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'howto-step-3',
      title: 'Step 3',
      type: 'step',
      description: 'Third action step',
      suggestedWordCount: 200,
      aiPrompt: 'Write the third step. Include a pro tip or common mistake to avoid if relevant.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'howto-step-4',
      title: 'Step 4',
      type: 'step',
      description: 'Fourth action step',
      suggestedWordCount: 200,
      aiPrompt: 'Continue the process. Consider what questions the reader might have at this point.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'howto-step-5',
      title: 'Step 5',
      type: 'step',
      description: 'Fifth action step',
      suggestedWordCount: 200,
      aiPrompt: 'Write the final main step before wrapping up. Make sure the reader can verify they\'ve done it correctly.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'howto-tips',
      title: 'Pro Tips',
      type: 'body',
      description: 'Additional tips and best practices',
      suggestedWordCount: 150,
      aiPrompt: 'Provide 3-5 expert tips that will help the reader get even better results. Focus on things that aren\'t obvious from the steps.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'howto-conclusion',
      title: 'Wrap Up',
      type: 'conclusion',
      description: 'Summarize and suggest next steps',
      suggestedWordCount: 100,
      aiPrompt: 'Congratulate the reader on completing the guide. Suggest what they should do next or how to take it further.',
      isRequired: true,
      canHaveBullets: false,
    },
  ],
};

/**
 * Listicle Layout
 * Numbered list format with individual items
 */
export const listicleLayout: LayoutTemplate = {
  id: 'listicle',
  name: 'Listicle',
  description: 'Numbered list of items, tools, tips, or ideas',
  icon: 'List',
  color: 'purple',
  totalWordCountTarget: 1800,
  recommendedElements: ['Numbered items', 'Quick summaries', 'Links to resources'],
  bestFor: ['Resource roundups', 'Tip collections', 'Tool comparisons'],
  exampleTitle: '10 AI Tools Every Marketer Should Know in 2025',
  sections: [
    {
      id: 'listicle-intro',
      title: 'Introduction',
      type: 'intro',
      description: 'Set up the list and explain the selection criteria',
      suggestedWordCount: 150,
      aiPrompt: 'Write an introduction that explains why this list matters and how items were selected. Build anticipation for what\'s coming.',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'listicle-item-1',
      title: 'Item 1',
      type: 'item',
      description: 'First list item with description',
      suggestedWordCount: 180,
      aiPrompt: 'Describe the first item in detail. Explain what it is, why it\'s included, and key benefits. Include a specific example if possible.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'listicle-item-2',
      title: 'Item 2',
      type: 'item',
      description: 'Second list item',
      suggestedWordCount: 180,
      aiPrompt: 'Describe the second item. Differentiate it from the first while maintaining consistent depth.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'listicle-item-3',
      title: 'Item 3',
      type: 'item',
      description: 'Third list item',
      suggestedWordCount: 180,
      aiPrompt: 'Describe the third item. Keep the energy up and provide unique value with each entry.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'listicle-item-4',
      title: 'Item 4',
      type: 'item',
      description: 'Fourth list item',
      suggestedWordCount: 180,
      aiPrompt: 'Continue with item four. Consider varying the angle slightly to keep content fresh.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'listicle-item-5',
      title: 'Item 5',
      type: 'item',
      description: 'Fifth list item',
      suggestedWordCount: 180,
      aiPrompt: 'Describe item five. This is the middle of the list - keep momentum strong.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'listicle-item-6',
      title: 'Item 6',
      type: 'item',
      description: 'Sixth list item',
      suggestedWordCount: 180,
      aiPrompt: 'Continue with item six. Consider saving a particularly impressive item for near the end.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'listicle-item-7',
      title: 'Item 7',
      type: 'item',
      description: 'Seventh list item',
      suggestedWordCount: 180,
      aiPrompt: 'Describe item seven. If this is the last item, make it memorable.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'listicle-conclusion',
      title: 'Conclusion',
      type: 'conclusion',
      description: 'Summarize key takeaways',
      suggestedWordCount: 120,
      aiPrompt: 'Wrap up the list with key takeaways. Help the reader decide which items to explore first based on their needs.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
  ],
};

/**
 * Case Study Layout
 * Narrative format showcasing a success story with measurable results
 */
export const caseStudyLayout: LayoutTemplate = {
  id: 'case-study',
  name: 'Case Study',
  description: 'Success story with background, challenge, solution, and results',
  icon: 'TrendingUp',
  color: 'green',
  totalWordCountTarget: 1400,
  recommendedElements: ['Company context', 'Before/after comparison', 'Metrics', 'Quotes'],
  bestFor: ['Customer success stories', 'Implementation examples', 'ROI demonstrations'],
  exampleTitle: 'How Acme Corp Increased Sales by 150% Using AI-Powered Lead Scoring',
  sections: [
    {
      id: 'casestudy-intro',
      title: 'Overview',
      type: 'intro',
      description: 'Quick summary of the success story',
      suggestedWordCount: 120,
      aiPrompt: 'Write a compelling overview that teases the impressive results achieved. Include the company name, industry, and headline metric.',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'casestudy-background',
      title: 'Background',
      type: 'background',
      description: 'Context about the company and situation',
      suggestedWordCount: 180,
      aiPrompt: 'Provide context about the company, their industry, size, and the business environment. Help readers understand the starting point.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'casestudy-challenge',
      title: 'The Challenge',
      type: 'body',
      description: 'The problem they faced',
      suggestedWordCount: 200,
      aiPrompt: 'Describe the specific challenges and pain points the company was experiencing. Make it relatable to similar businesses.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'casestudy-solution',
      title: 'The Solution',
      type: 'solution',
      description: 'How they solved the problem',
      suggestedWordCount: 250,
      aiPrompt: 'Explain the solution implemented, including specific tools, processes, or strategies. Be detailed enough that readers could follow a similar approach.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'casestudy-implementation',
      title: 'Implementation',
      type: 'body',
      description: 'How they rolled out the solution',
      suggestedWordCount: 200,
      aiPrompt: 'Describe the implementation process, timeline, and any obstacles overcome. Include lessons learned.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'casestudy-results',
      title: 'Results',
      type: 'results',
      description: 'The measurable outcomes achieved',
      suggestedWordCount: 200,
      aiPrompt: 'Present the specific, measurable results achieved. Use numbers, percentages, and before/after comparisons. Include both quantitative and qualitative outcomes.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 6,
    },
    {
      id: 'casestudy-conclusion',
      title: 'Key Takeaways',
      type: 'conclusion',
      description: 'Lessons for the reader',
      suggestedWordCount: 150,
      aiPrompt: 'Summarize the key lessons that readers can apply to their own situations. End with an inspiring note about what\'s possible.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 4,
    },
  ],
};

/**
 * Tool Review Layout
 * In-depth evaluation of a product, software, or service
 */
export const toolReviewLayout: LayoutTemplate = {
  id: 'tool-review',
  name: 'Tool Review',
  description: 'In-depth evaluation with features, pros, cons, and verdict',
  icon: 'Star',
  color: 'amber',
  totalWordCountTarget: 1600,
  recommendedElements: ['Feature breakdown', 'Pricing info', 'Screenshots', 'Rating'],
  bestFor: ['Product reviews', 'Software comparisons', 'Buying guides'],
  exampleTitle: 'Notion Review 2025: Is It Still the Best All-in-One Workspace?',
  sections: [
    {
      id: 'toolreview-intro',
      title: 'Introduction',
      type: 'intro',
      description: 'Overview of the tool and what you\'ll cover',
      suggestedWordCount: 150,
      aiPrompt: 'Write an introduction that explains what tool you\'re reviewing, who it\'s for, and what you\'ll evaluate. Mention your testing methodology briefly.',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'toolreview-overview',
      title: 'Quick Overview',
      type: 'body',
      description: 'What the tool is and who it\'s for',
      suggestedWordCount: 180,
      aiPrompt: 'Provide a quick summary of what the tool does, who made it, and its target audience. Include basic pricing tiers.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'toolreview-features-1',
      title: 'Key Feature 1',
      type: 'body',
      description: 'First major feature deep-dive',
      suggestedWordCount: 200,
      aiPrompt: 'Deep-dive into the first key feature. Explain what it does, how well it works, and how it compares to alternatives.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'toolreview-features-2',
      title: 'Key Feature 2',
      type: 'body',
      description: 'Second major feature deep-dive',
      suggestedWordCount: 200,
      aiPrompt: 'Analyze the second key feature. Be specific about what works well and what could be improved.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'toolreview-features-3',
      title: 'Key Feature 3',
      type: 'body',
      description: 'Third major feature deep-dive',
      suggestedWordCount: 200,
      aiPrompt: 'Cover the third key feature. Include real examples from your testing if possible.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'toolreview-proscons',
      title: 'Pros and Cons',
      type: 'pros-cons',
      description: 'Balanced list of advantages and disadvantages',
      suggestedWordCount: 200,
      aiPrompt: 'Create a balanced list of pros and cons. Be honest about limitations while fair about strengths. Group by Pros and Cons subheadings.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 10,
    },
    {
      id: 'toolreview-pricing',
      title: 'Pricing',
      type: 'body',
      description: 'Pricing breakdown and value analysis',
      suggestedWordCount: 150,
      aiPrompt: 'Break down the pricing tiers and what you get at each level. Analyze value for money compared to alternatives.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 4,
    },
    {
      id: 'toolreview-verdict',
      title: 'Final Verdict',
      type: 'verdict',
      description: 'Your recommendation and rating',
      suggestedWordCount: 150,
      aiPrompt: 'Give your final verdict with a clear recommendation. Who should buy this? Who should look elsewhere? Rate it if appropriate.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
  ],
};

/**
 * News Update Layout
 * Timely news article with journalistic structure
 */
export const newsLayout: LayoutTemplate = {
  id: 'news',
  name: 'News Update',
  description: 'Timely news with lead, background, and expert analysis',
  icon: 'Newspaper',
  color: 'red',
  totalWordCountTarget: 800,
  recommendedElements: ['Lead paragraph', 'Quotes', 'Timeline', 'Related links'],
  bestFor: ['Industry news', 'Product announcements', 'Market updates'],
  exampleTitle: 'OpenAI Announces GPT-5: What It Means for Business AI',
  sections: [
    {
      id: 'news-lead',
      title: 'Lead Paragraph',
      type: 'intro',
      description: 'The most important information upfront',
      suggestedWordCount: 80,
      aiPrompt: 'Write a strong lead paragraph answering Who, What, When, Where, and Why. Front-load the most newsworthy information.',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'news-background',
      title: 'Background',
      type: 'background',
      description: 'Context for readers unfamiliar with the topic',
      suggestedWordCount: 150,
      aiPrompt: 'Provide essential background context. What led to this news? What does the reader need to know to understand its significance?',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'news-details',
      title: 'Details',
      type: 'body',
      description: 'The full story with specifics',
      suggestedWordCount: 200,
      aiPrompt: 'Expand on the news with specific details, numbers, and facts. Answer any remaining questions a reader might have.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 5,
    },
    {
      id: 'news-quotes',
      title: 'Expert Perspective',
      type: 'body',
      description: 'Quotes or analysis from experts',
      suggestedWordCount: 150,
      aiPrompt: 'Include expert perspectives or official statements. Provide analysis of what this means for the industry or readers.',
      isRequired: false,
      canHaveBullets: false,
    },
    {
      id: 'news-impact',
      title: 'What This Means',
      type: 'conclusion',
      description: 'Impact analysis and next steps',
      suggestedWordCount: 120,
      aiPrompt: 'Analyze the impact of this news on readers. What should they do? What happens next? End with forward-looking perspective.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
  ],
};

/**
 * Opinion Piece Layout
 * Persuasive essay with thesis, arguments, and call-to-action
 */
export const opinionLayout: LayoutTemplate = {
  id: 'opinion',
  name: 'Opinion Piece',
  description: 'Persuasive essay with clear thesis and supporting arguments',
  icon: 'MessageSquare',
  color: 'indigo',
  totalWordCountTarget: 1200,
  recommendedElements: ['Clear thesis', 'Evidence', 'Counterarguments', 'Call-to-action'],
  bestFor: ['Thought leadership', 'Hot takes', 'Industry commentary'],
  exampleTitle: 'Why Every Company Should Stop Chasing Viral Content',
  sections: [
    {
      id: 'opinion-hook',
      title: 'Hook',
      type: 'intro',
      description: 'Provocative opening that grabs attention',
      suggestedWordCount: 100,
      aiPrompt: 'Write a provocative hook that immediately grabs attention. Use a bold statement, surprising statistic, or controversial opinion.',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'opinion-thesis',
      title: 'Thesis',
      type: 'body',
      description: 'Your main argument clearly stated',
      suggestedWordCount: 120,
      aiPrompt: 'State your main argument clearly and concisely. Make your position unmistakable. Briefly preview your supporting points.',
      isRequired: true,
      canHaveBullets: false,
    },
    {
      id: 'opinion-argument-1',
      title: 'Argument 1',
      type: 'body',
      description: 'First supporting argument with evidence',
      suggestedWordCount: 200,
      aiPrompt: 'Present your first and strongest supporting argument. Use evidence, examples, or data to back it up.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'opinion-argument-2',
      title: 'Argument 2',
      type: 'body',
      description: 'Second supporting argument with evidence',
      suggestedWordCount: 200,
      aiPrompt: 'Present your second supporting argument. Build on the previous point while introducing new evidence.',
      isRequired: true,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'opinion-argument-3',
      title: 'Argument 3',
      type: 'body',
      description: 'Third supporting argument with evidence',
      suggestedWordCount: 200,
      aiPrompt: 'Present your third supporting argument. Consider using a different type of evidence (anecdote, data, expert opinion).',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'opinion-counter',
      title: 'Counterarguments',
      type: 'body',
      description: 'Address opposing views fairly',
      suggestedWordCount: 150,
      aiPrompt: 'Acknowledge the strongest counterarguments and address them honestly. This builds credibility. Explain why your position still stands.',
      isRequired: false,
      canHaveBullets: true,
      maxBullets: 3,
    },
    {
      id: 'opinion-conclusion',
      title: 'Conclusion & Call-to-Action',
      type: 'conclusion',
      description: 'Reinforce thesis and inspire action',
      suggestedWordCount: 120,
      aiPrompt: 'Reinforce your thesis with conviction. End with a clear call-to-action that tells readers what to do with this perspective.',
      isRequired: true,
      canHaveBullets: false,
    },
  ],
};

// All layouts as a map for easy access
export const layoutTemplates: Record<LayoutTemplate['id'], LayoutTemplate> = {
  'standard': standardLayout,
  'how-to': howToLayout,
  'listicle': listicleLayout,
  'case-study': caseStudyLayout,
  'tool-review': toolReviewLayout,
  'news': newsLayout,
  'opinion': opinionLayout,
};

// Get layout by ID
export function getLayout(id: LayoutTemplate['id']): LayoutTemplate {
  const layout = layoutTemplates[id];
  if (!layout) {
    throw new Error(`Layout "${id}" not found`);
  }
  return layout;
}

// Get all layouts as array
export function getAllLayouts(): LayoutTemplate[] {
  return Object.values(layoutTemplates);
}

// Get layout color classes for UI
export const layoutColorClasses: Record<LayoutTemplate['id'], { bg: string; text: string; border: string }> = {
  'standard': { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200' },
  'how-to': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'listicle': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'case-study': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'tool-review': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'news': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'opinion': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

// Get section type display name
export function getSectionTypeLabel(type: SectionType): string {
  const labels: Record<SectionType, string> = {
    'intro': 'Introduction',
    'body': 'Body Section',
    'conclusion': 'Conclusion',
    'cta': 'Call to Action',
    'step': 'Step',
    'item': 'List Item',
    'background': 'Background',
    'solution': 'Solution',
    'results': 'Results',
    'verdict': 'Verdict',
    'pros-cons': 'Pros & Cons',
  };
  return labels[type] || type;
}

