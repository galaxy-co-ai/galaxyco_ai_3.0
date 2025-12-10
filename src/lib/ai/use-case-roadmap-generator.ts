import { getOpenAI } from "@/lib/ai-providers";
import { logger } from "@/lib/logger";
import type { UseCaseCategory } from "@/db/schema";

/**
 * Persona type for use case input
 */
interface Persona {
  name: string;
  role: string;
  goals: string[];
  painPoints: string[];
}

/**
 * Journey stage type for use case input
 */
interface JourneyStage {
  name: string;
  description: string;
  actions: string[];
  tools: string[];
}

/**
 * Messaging configuration
 */
interface Messaging {
  tagline?: string;
  valueProposition?: string;
  targetChannels?: string[];
}

/**
 * Roadmap step output from AI
 */
export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  tools: string[];
}

/**
 * Input for roadmap generation
 */
interface UseCaseInput {
  name: string;
  description: string;
  category: UseCaseCategory;
  personas: Persona[];
  platformTools: string[];
  journeyStages: JourneyStage[];
  messaging: Messaging | null;
  workspaceName: string;
}

/**
 * Platform tools available in GalaxyCo
 */
export const PLATFORM_TOOLS = {
  // AI Assistant
  neptune_chat: {
    name: "Neptune AI Chat",
    description: "AI-powered assistant for business guidance",
    category: "AI Assistant",
  },
  smart_recommendations: {
    name: "Smart Recommendations",
    description: "AI-driven suggestions for growth",
    category: "AI Assistant",
  },
  // CRM & Contacts
  contact_manager: {
    name: "Contact Manager",
    description: "Organize and manage business contacts",
    category: "CRM",
  },
  lead_scoring: {
    name: "Lead Scoring",
    description: "Prioritize leads with AI analysis",
    category: "CRM",
  },
  pipeline_management: {
    name: "Pipeline Management",
    description: "Visual deal and project pipelines",
    category: "CRM",
  },
  // Marketing
  content_studio: {
    name: "Content Studio",
    description: "Create and manage content",
    category: "Marketing",
  },
  email_campaigns: {
    name: "Email Campaigns",
    description: "Design and send marketing emails",
    category: "Marketing",
  },
  social_scheduler: {
    name: "Social Scheduler",
    description: "Schedule social media posts",
    category: "Marketing",
  },
  seo_tools: {
    name: "SEO Tools",
    description: "Optimize content for search",
    category: "Marketing",
  },
  // Finance
  invoice_generator: {
    name: "Invoice Generator",
    description: "Create professional invoices",
    category: "Finance",
  },
  expense_tracking: {
    name: "Expense Tracking",
    description: "Track business expenses",
    category: "Finance",
  },
  financial_reports: {
    name: "Financial Reports",
    description: "Generate financial insights",
    category: "Finance",
  },
  // Operations
  task_management: {
    name: "Task Management",
    description: "Organize work and projects",
    category: "Operations",
  },
  calendar_sync: {
    name: "Calendar Sync",
    description: "Sync meetings and events",
    category: "Operations",
  },
  document_storage: {
    name: "Document Storage",
    description: "Store and share documents",
    category: "Operations",
  },
  // Analytics
  dashboard_analytics: {
    name: "Dashboard Analytics",
    description: "Monitor key metrics",
    category: "Analytics",
  },
  customer_insights: {
    name: "Customer Insights",
    description: "Understand customer behavior",
    category: "Analytics",
  },
} as const;

/**
 * Generate a personalized onboarding roadmap for a use case
 * using GPT-4o with structured output.
 */
export async function generateUseCaseRoadmap(
  input: UseCaseInput
): Promise<RoadmapStep[]> {
  const openai = getOpenAI();

  // Build context about the personas
  const personasContext = input.personas
    .map((p) => {
      const goals = p.goals.length > 0 ? `Goals: ${p.goals.join(", ")}` : "";
      const pains =
        p.painPoints.length > 0
          ? `Pain Points: ${p.painPoints.join(", ")}`
          : "";
      return `- ${p.name} (${p.role}): ${goals}. ${pains}`;
    })
    .join("\n");

  // Build context about journey stages
  const journeyContext =
    input.journeyStages.length > 0
      ? input.journeyStages
          .map(
            (s) =>
              `- ${s.name}: ${s.description} (Tools: ${s.tools.join(", ") || "TBD"})`
          )
          .join("\n")
      : "No specific journey stages defined.";

  // Build tools context
  const toolsContext =
    input.platformTools.length > 0
      ? input.platformTools
          .map((t) => {
            const tool = PLATFORM_TOOLS[t as keyof typeof PLATFORM_TOOLS];
            return tool ? `- ${tool.name}: ${tool.description}` : `- ${t}`;
          })
          .join("\n")
      : "All platform tools available.";

  const systemPrompt = `You are an expert onboarding strategist for ${input.workspaceName}, a business management platform.
Your task is to create a personalized onboarding roadmap that guides new users to value quickly.

CONTEXT:
- Use Case: ${input.name}
- Category: ${input.category.replace("_", " ")}
- Description: ${input.description || "Not provided"}
${input.messaging?.valueProposition ? `- Value Proposition: ${input.messaging.valueProposition}` : ""}

TARGET PERSONAS:
${personasContext}

USER JOURNEY STAGES:
${journeyContext}

AVAILABLE PLATFORM TOOLS:
${toolsContext}

GUIDELINES:
1. Create 5-10 onboarding steps that progressively build user competency
2. Start with quick wins (5-15 min) to build momentum
3. Address the specific pain points of the target personas
4. Incorporate the relevant platform tools naturally
5. Each step should have a clear action and outcome
6. Estimate realistic time in minutes (5-60 min per step)
7. End with advanced features that drive retention

Return a JSON object with exactly this structure:
{
  "roadmap": [
    {
      "step": 1,
      "title": "Clear action title",
      "description": "2-3 sentence explanation of what to do and why",
      "estimatedMinutes": 10,
      "tools": ["tool_id_1", "tool_id_2"]
    }
  ]
}

Return ONLY valid JSON, no other text.`;

  const userPrompt = `Create a personalized onboarding roadmap for the "${input.name}" use case targeting ${input.personas.map((p) => p.name).join(", ")}.

Focus on:
1. Quick initial wins that demonstrate value
2. Addressing their key pain points: ${input.personas.flatMap((p) => p.painPoints).slice(0, 3).join(", ") || "general business challenges"}
3. Building towards their goals: ${input.personas.flatMap((p) => p.goals).slice(0, 3).join(", ") || "business growth"}

Generate the roadmap now.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    const roadmap = sanitizeRoadmap(parsed.roadmap || parsed);

    logger.info("Generated use case roadmap", {
      useCaseName: input.name,
      stepCount: roadmap.length,
    });

    return roadmap;
  } catch (error) {
    logger.error("Failed to generate use case roadmap", error);

    // Return a fallback roadmap
    return generateFallbackRoadmap(input);
  }
}

/**
 * Sanitize and validate the AI-generated roadmap
 */
function sanitizeRoadmap(raw: unknown): RoadmapStep[] {
  if (!Array.isArray(raw)) {
    throw new Error("Invalid roadmap format");
  }

  return raw
    .slice(0, 15)
    .map((item: Record<string, unknown>, index: number) => ({
      step: typeof item.step === "number" ? item.step : index + 1,
      title:
        typeof item.title === "string"
          ? item.title.slice(0, 200)
          : `Step ${index + 1}`,
      description:
        typeof item.description === "string"
          ? item.description.slice(0, 1000)
          : "Complete this step to progress.",
      estimatedMinutes:
        typeof item.estimatedMinutes === "number" &&
        item.estimatedMinutes > 0 &&
        item.estimatedMinutes <= 480
          ? item.estimatedMinutes
          : 15,
      tools: Array.isArray(item.tools)
        ? item.tools
            .filter((t): t is string => typeof t === "string")
            .slice(0, 10)
        : [],
    }));
}

/**
 * Generate a basic fallback roadmap if AI fails
 */
function generateFallbackRoadmap(input: UseCaseInput): RoadmapStep[] {
  const tools = input.platformTools.slice(0, 5);

  return [
    {
      step: 1,
      title: "Welcome & Profile Setup",
      description:
        "Complete your profile and configure your workspace settings to personalize your experience.",
      estimatedMinutes: 10,
      tools: [],
    },
    {
      step: 2,
      title: "Explore the Dashboard",
      description:
        "Take a quick tour of your dashboard to understand where key features are located.",
      estimatedMinutes: 5,
      tools: ["dashboard_analytics"],
    },
    {
      step: 3,
      title: "Add Your First Contact",
      description:
        "Import or manually add your first contact to start building your CRM.",
      estimatedMinutes: 10,
      tools: ["contact_manager"],
    },
    {
      step: 4,
      title: "Try Neptune AI",
      description:
        "Ask Neptune a question about your business to see how AI can help you make better decisions.",
      estimatedMinutes: 5,
      tools: ["neptune_chat"],
    },
    {
      step: 5,
      title: "Explore Key Features",
      description: `Discover the tools most relevant to your ${input.category.replace("_", " ")} workflow.`,
      estimatedMinutes: 15,
      tools: tools.length > 0 ? tools : ["task_management", "content_studio"],
    },
    {
      step: 6,
      title: "Set Up Integrations",
      description:
        "Connect your existing tools to streamline your workflow and centralize your data.",
      estimatedMinutes: 20,
      tools: ["calendar_sync"],
    },
    {
      step: 7,
      title: "Complete Your First Task",
      description:
        "Create and complete your first task to experience the full workflow.",
      estimatedMinutes: 10,
      tools: ["task_management"],
    },
  ];
}

