export interface ActionItem {
  text: string;
  completed: boolean;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  lastContact: string;
  status: "hot" | "warm" | "cold";
  value: string;
  interactions: number;
  aiHealthScore: number;
  aiInsight: string;
  nextAction: string;
  sentiment?: "positive" | "neutral" | "concerned";
}

export interface ProjectTask {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "pending";
  assignee: string;
  dueDate: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface ProjectUpdate {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: "planning" | "active" | "completed";
  progress: number;
  dueDate: string;
  startDate: string;
  team: string[];
  budget: string;
  spent: string;
  description: string;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  updates: ProjectUpdate[];
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  value: string;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed";
  probability: number;
  closeDate: string;
  aiRisk: "low" | "medium" | "high";
}

export interface Interaction {
  id: string;
  type: "call" | "email" | "meeting";
  contactId: string;
  contact: string;
  date: string;
  duration?: string;
  summary: string;
  actionItems: ActionItem[];
  status: "completed" | "transcribing";
  sentiment?: "positive" | "neutral" | "negative";
  transcript?: string;
}

