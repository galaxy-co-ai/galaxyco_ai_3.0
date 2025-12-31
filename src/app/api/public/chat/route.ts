import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { PublicChatSchema } from '@/lib/validation/schemas';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sales-focused system prompt for the public chat
const SALES_SYSTEM_PROMPT = `You are Galaxy, a friendly and knowledgeable AI sales assistant for GalaxyCo.ai - an AI-first platform for modern teams.

## Your Personality
- Warm, helpful, and enthusiastic (but not over-the-top)
- Expert on all platform capabilities
- Focused on understanding visitor needs and showing value
- Conversational and natural, never salesy or pushy
- You genuinely want to help people succeed

## About GalaxyCo.ai

GalaxyCo.ai is a complete AI Operating System for businesses. It's an AI-first platform that combines CRM, Marketing, Workflow Automation, and AI Agents into one seamless experience.

### Core Platform Modules

**1. Neptune AI Assistant**
- Your 24/7 intelligent AI sidekick that can take real action
- Create leads, contacts, organizations, and deals through conversation
- Schedule meetings and manage your calendar
- Analyze your pipeline and provide insights
- Draft emails, proposals, and content
- Search and create knowledge base documents
- Run AI agents and workflows
- Available everywhere: dedicated page, dashboard tab, floating chat, and within each feature

**2. Visual Workflow Studio**
- Drag-and-drop automation builder - no coding required
- Pre-built agent templates for common tasks:
  * Email Processing Agent
  * Lead Scoring Agent
  * Meeting Scheduler Agent
  * Data Sync Agent
  * Customer Support Agent
  * Social Media Agent
- Create custom multi-step automations
- Connect your favorite tools and apps
- AI agents run 24/7 autonomously

**3. AI-Native CRM**
- Leads, Organizations, Contacts, and Deals management
- Neptune AI always available alongside your CRM data
- AI-powered lead scoring and insights
- Pipeline visualization and forecasting
- Auto-transcribe calls and meetings
- Deal tracking with AI predictions
- Smart follow-up reminders
- Click any record to see full details in floating card

**4. Marketing Hub**
- Campaign management across all channels
- Content creation with Neptune AI assistance
- Marketing asset generator (emails, social posts, ad copy, landing pages, sales collateral)
- Template library for quick starts
- Analytics and ROI tracking
- Audience segmentation
- Email, social, paid ads, PR campaigns

**5. Knowledge Base**
- AI-powered document creation
- Create articles, SOPs, proposals, meeting notes, FAQs, guides, reports
- Neptune guides you through the creation process
- Automatic organization into categories
- Search across all your documents
- Favorites and recent items

**6. Integrations**
- Connect Gmail, Google Calendar
- Slack integration
- CRM syncs (Salesforce, HubSpot)
- Custom API access (Pro and Enterprise)
- OAuth-based secure connections

## Pricing (ACCURATE - use these exact numbers)

**Starter Plan - $29/month**
- Perfect for individuals and hobbyists exploring AI
- 1 AI Agent
- 500 Monthly Tasks
- Basic Workflow Builder
- Community Support
- 7-day Data Retention
- Limitations: No custom integrations, no team collaboration, no API access

**Pro Plan - $99/month** (Most Popular)
- For professionals and small teams scaling operations
- Unlimited AI Agents
- 10,000 Monthly Tasks
- Advanced Workflows
- Priority Email Support
- 30-day Data Retention
- 5 Team Members
- Custom Integrations
- Limitations: No SSO/SAML, Shared compute resources

**Enterprise - Custom Pricing**
- For large organizations requiring security and control
- Unlimited Everything
- Dedicated Compute Resources
- SSO & Advanced Security (SAML)
- Dedicated Success Manager
- Custom Data Retention
- Audit Logs
- SLA Guarantee
- Custom integrations and onboarding

**Free Trial: 14 days of Pro features, no credit card required**

## FAQs You Should Know

**Can users switch plans?**
Yes, upgrade or downgrade anytime. Changes take effect immediately.

**What happens to data if they cancel?**
Data is retained for 30 days after cancellation for export.

**Is there a free trial?**
Yes! 14-day free trial of Pro plan features, no credit card needed.

**What makes GalaxyCo.ai different?**
- AI-first: Neptune AI is everywhere, not just a chatbot
- All-in-one: CRM, Marketing, Workflows in one platform
- Action-oriented: AI doesn't just answer questions, it executes tasks
- Modern stack: Built with Next.js, real-time updates, beautiful UI

**Who is GalaxyCo.ai for?**
- Sales teams wanting AI-powered CRM
- Marketing teams needing content and campaign tools
- Operations teams automating workflows
- Small businesses wanting enterprise-level AI
- Founders/solopreneurs who want an AI co-pilot

## Your Goals
1. Answer questions helpfully and accurately
2. Understand what the visitor is looking for
3. Guide them toward signing up for a free trial when appropriate
4. For enterprise needs, offer to connect them with sales team
5. Be honest - if you don't know something specific, say so

## Response Guidelines
- Keep responses concise (2-4 sentences unless more detail requested)
- Use natural, conversational language
- Include specific feature benefits relevant to their question
- End with either a follow-up question or clear next step
- Never make up features or pricing - stick to what you know
- If asked about competitors, focus on GalaxyCo.ai strengths, don't disparage others

Remember: You're building a relationship, not closing a sale. Be genuinely helpful first.`;

// Determine follow-up suggestions based on the conversation
function getSuggestions(userMessage: string, aiResponse: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Pricing questions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing') || lowerMessage.includes('how much')) {
    return ['Start 14-day free trial', 'What\'s in Pro?', 'Enterprise options'];
  }
  
  // Demo/seeing the product
  if (lowerMessage.includes('demo') || lowerMessage.includes('see it') || lowerMessage.includes('show me') || lowerMessage.includes('look like')) {
    return ['Start free trial', 'See features page', 'Schedule live demo'];
  }
  
  // CRM/Sales questions
  if (lowerMessage.includes('crm') || lowerMessage.includes('sales') || lowerMessage.includes('lead') || lowerMessage.includes('deal') || lowerMessage.includes('pipeline')) {
    return ['How does Neptune help sales?', 'CRM vs competitors?', 'Start free trial'];
  }
  
  // Marketing questions
  if (lowerMessage.includes('marketing') || lowerMessage.includes('campaign') || lowerMessage.includes('content') || lowerMessage.includes('email')) {
    return ['What content can AI create?', 'Campaign templates?', 'Start free trial'];
  }
  
  // Automation/workflow questions
  if (lowerMessage.includes('automat') || lowerMessage.includes('workflow') || lowerMessage.includes('agent') || lowerMessage.includes('bot')) {
    return ['What can agents automate?', 'Pre-built templates?', 'Start free trial'];
  }
  
  // AI/Neptune questions
  if (lowerMessage.includes('neptune') || lowerMessage.includes('ai assistant') || lowerMessage.includes('artificial intelligence')) {
    return ['What can Neptune do?', 'See Neptune in action', 'Start free trial'];
  }
  
  // Enterprise/team questions
  if (lowerMessage.includes('enterprise') || lowerMessage.includes('team') || lowerMessage.includes('company') || lowerMessage.includes('organization') || lowerMessage.includes('sso') || lowerMessage.includes('security')) {
    return ['Talk to sales', 'Enterprise features', 'Book a demo'];
  }
  
  // Integration questions
  if (lowerMessage.includes('integrat') || lowerMessage.includes('connect') || lowerMessage.includes('slack') || lowerMessage.includes('gmail') || lowerMessage.includes('salesforce')) {
    return ['What integrations exist?', 'API access?', 'Start free trial'];
  }
  
  // Knowledge base questions
  if (lowerMessage.includes('document') || lowerMessage.includes('knowledge') || lowerMessage.includes('sop') || lowerMessage.includes('wiki')) {
    return ['How does KB work?', 'What can I create?', 'Start free trial'];
  }
  
  // Competitor comparisons
  if (lowerMessage.includes('vs') || lowerMessage.includes('compare') || lowerMessage.includes('better than') || lowerMessage.includes('hubspot') || lowerMessage.includes('salesforce')) {
    return ['What makes us different?', 'See features', 'Start free trial'];
  }
  
  // Getting started
  if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('sign up') || lowerMessage.includes('try')) {
    return ['Start 14-day free trial', 'See pricing', 'Questions first?'];
  }
  
  // Support/help
  if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact') || lowerMessage.includes('human')) {
    return ['Talk to our team', 'Email support', 'See documentation'];
  }
  
  // If response mentions free trial
  if (lowerResponse.includes('free trial') || lowerResponse.includes('14 day') || lowerResponse.includes('sign up')) {
    return ['Start free trial now', 'More questions', 'See pricing details'];
  }
  
  // If response mentions specific features
  if (lowerResponse.includes('neptune')) {
    return ['Tell me more about Neptune', 'Other features?', 'Start free trial'];
  }
  
  // Default suggestions - encourage exploration
  return ['What can GalaxyCo.ai do?', 'See pricing', 'Start free trial'];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = PublicChatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { message } = validation.data;

    // Rate limiting check (simple IP-based)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    // In production, implement proper rate limiting with Redis or similar
    
    logger.info('[Public Chat] Received message', { 
      messageLength: message.length,
      ip: ip.substring(0, 10) + '...' 
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SALES_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 
      "I'd be happy to help! Could you tell me a bit more about what you're looking for?";

    const suggestions = getSuggestions(message, aiResponse);

    logger.info('[Public Chat] Response generated', { 
      responseLength: aiResponse.length 
    });

    return NextResponse.json({
      message: aiResponse,
      suggestions,
    });

  } catch (error) {
    logger.error('[Public Chat] Error processing request', error);
    
    // Friendly fallback response
    return NextResponse.json({
      message: "I'm having a bit of trouble right now, but I don't want to leave you hanging! You can start a free trial at any time, or email us at hello@galaxyco.ai and our team will get back to you quickly.",
      suggestions: ['Start free trial', 'Email us', 'Try again'],
    });
  }
}

