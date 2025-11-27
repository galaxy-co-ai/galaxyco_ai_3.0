import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sales-focused system prompt for the public chat
const SALES_SYSTEM_PROMPT = `You are Galaxy, a friendly and knowledgeable AI sales assistant for GalaxyCo.ai - an AI-first platform for modern teams.

Your personality:
- Warm, helpful, and enthusiastic (but not over-the-top)
- Knowledgeable about the platform's capabilities
- Focused on understanding visitor needs and showing how GalaxyCo.ai can help
- Conversational and natural, not salesy or pushy

About GalaxyCo.ai:
- AI-first platform that combines CRM, Marketing, Workflow Automation, and AI Agents
- Key features:
  * Neptune AI Assistant - intelligent AI that can take action (create leads, schedule meetings, analyze data, draft content)
  * Visual Workflow Studio - drag-and-drop automation builder
  * AI-Native CRM - auto-transcribe calls, track deals with AI insights
  * Marketing Hub - campaign management, content creation, analytics
  * Knowledge Base - AI-powered document creation and organization
  * Team Collaboration - notes, activity feeds, shared workspaces

Pricing (if asked):
- Starter: $29/month - For individuals and small teams, includes basic AI features
- Professional: $79/month - For growing teams, full AI capabilities, advanced analytics
- Enterprise: Custom pricing - Unlimited everything, dedicated support, custom integrations
- All plans include 14-day free trial, no credit card required

Your goals:
1. Answer questions about the platform helpfully and accurately
2. Understand what the visitor is looking for
3. Guide them toward signing up for a free trial when appropriate
4. Collect interest/intent information naturally through conversation
5. Offer to connect them with sales for complex enterprise needs

Response guidelines:
- Keep responses concise (2-4 sentences unless more detail is asked for)
- Use natural language, avoid jargon
- Include specific feature benefits relevant to their question
- End responses with either a follow-up question or clear next step
- If you don't know something specific, say so and offer to connect them with the team

Remember: You're building a relationship, not closing a sale. Be genuinely helpful first.`;

// Determine follow-up suggestions based on the conversation
function getSuggestions(userMessage: string, aiResponse: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Context-aware suggestions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
    return ['Start free trial', 'Compare plans', 'Talk to sales'];
  }
  
  if (lowerMessage.includes('demo') || lowerMessage.includes('see') || lowerMessage.includes('show')) {
    return ['Watch video demo', 'Start free trial', 'Schedule live demo'];
  }
  
  if (lowerMessage.includes('crm') || lowerMessage.includes('sales') || lowerMessage.includes('lead')) {
    return ['Tell me about AI features', 'How does CRM compare?', 'Start free trial'];
  }
  
  if (lowerMessage.includes('marketing') || lowerMessage.includes('campaign') || lowerMessage.includes('content')) {
    return ['See content templates', 'How does AI help?', 'Start free trial'];
  }
  
  if (lowerMessage.includes('automat') || lowerMessage.includes('workflow') || lowerMessage.includes('agent')) {
    return ['What can agents do?', 'See workflow examples', 'Start free trial'];
  }
  
  if (lowerMessage.includes('enterprise') || lowerMessage.includes('team') || lowerMessage.includes('company')) {
    return ['Talk to sales', 'See enterprise features', 'Book a demo'];
  }
  
  if (lowerResponse.includes('free trial') || lowerResponse.includes('sign up')) {
    return ['Start free trial', 'Have more questions', 'Talk to a human'];
  }
  
  // Default suggestions
  return ['Tell me more', 'See pricing', 'Start free trial'];
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

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

