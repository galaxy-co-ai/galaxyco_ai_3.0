// Agent Laboratory Types

export type AgentTone = "professional" | "friendly" | "concise";

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface AgentTrigger {
  type: "manual" | "schedule" | "event";
  config?: {
    schedule?: string; // cron expression
    event?: string; // event type
  };
}

export interface AgentTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  type: AgentType;
  category: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  badgeText?: string;
  capabilities: string[];
  systemPrompt: string;
  kpis: {
    successRate?: number;
    avgTimeSaved?: string;
  };
}

export type AgentType =
  | "scope"
  | "call"
  | "email"
  | "note"
  | "task"
  | "roadmap"
  | "content"
  | "custom"
  | "browser"
  | "cross-app";

export interface AgentConfig {
  name: string;
  description: string;
  type: AgentType;
  tone: AgentTone;
  capabilities: string[];
  trigger: AgentTrigger;
  systemPrompt: string;
  templateId?: string;
  icon?: string;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: "",
  description: "",
  type: "custom",
  tone: "professional",
  capabilities: [],
  trigger: { type: "manual" },
  systemPrompt: "",
};

// Available capabilities that can be toggled
export const AVAILABLE_CAPABILITIES: AgentCapability[] = [
  {
    id: "crm",
    name: "CRM Access",
    description: "Read and update contacts, deals, and activities",
    icon: "Users",
    enabled: false,
  },
  {
    id: "email",
    name: "Email",
    description: "Send and read emails on your behalf",
    icon: "Mail",
    enabled: false,
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Check availability and schedule meetings",
    icon: "Calendar",
    enabled: false,
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    description: "Search and reference your company docs",
    icon: "BookOpen",
    enabled: false,
  },
  {
    id: "web",
    name: "Web Search",
    description: "Search the internet for information",
    icon: "Globe",
    enabled: false,
  },
];
