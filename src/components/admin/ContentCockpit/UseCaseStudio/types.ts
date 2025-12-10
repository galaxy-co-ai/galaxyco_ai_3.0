import type { UseCaseCategory, UseCaseStatus } from "@/db/schema";

/**
 * Persona type for use case
 */
export interface Persona {
  name: string;
  role: string;
  goals: string[];
  painPoints: string[];
}

/**
 * Journey stage type
 */
export interface JourneyStage {
  name: string;
  description: string;
  actions: string[];
  tools: string[];
}

/**
 * Messaging configuration
 */
export interface Messaging {
  tagline?: string;
  valueProposition?: string;
  targetChannels?: string[];
}

/**
 * Onboarding question type
 */
export interface OnboardingQuestion {
  question: string;
  options: string[];
  matchingWeight: number;
}

/**
 * Roadmap step type
 */
export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  tools: string[];
}

/**
 * Full use case data
 */
export interface UseCase {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  category: UseCaseCategory;
  status: UseCaseStatus;
  personas: Persona[];
  platformTools: string[];
  journeyStages: JourneyStage[];
  messaging: Messaging | null;
  onboardingQuestions: OnboardingQuestion[];
  roadmap: RoadmapStep[];
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

/**
 * Wizard form data (for React Hook Form)
 */
export interface UseCaseFormData {
  name: string;
  description: string;
  category: UseCaseCategory;
  personas: Persona[];
  platformTools: string[];
  journeyStages: JourneyStage[];
  messaging: Messaging;
  onboardingQuestions: OnboardingQuestion[];
}

/**
 * Default form values
 */
export const defaultFormValues: UseCaseFormData = {
  name: "",
  description: "",
  category: "other",
  personas: [],
  platformTools: [],
  journeyStages: [
    { name: "Awareness", description: "", actions: [], tools: [] },
    { name: "Consideration", description: "", actions: [], tools: [] },
    { name: "Decision", description: "", actions: [], tools: [] },
    { name: "Onboarding", description: "", actions: [], tools: [] },
    { name: "Success", description: "", actions: [], tools: [] },
  ],
  messaging: {
    tagline: "",
    valueProposition: "",
    targetChannels: [],
  },
  onboardingQuestions: [],
};

/**
 * Category options for dropdown
 */
export const CATEGORY_OPTIONS: { value: UseCaseCategory; label: string }[] = [
  { value: "b2b_saas", label: "B2B SaaS" },
  { value: "b2c_app", label: "B2C App" },
  { value: "agency", label: "Agency" },
  { value: "enterprise", label: "Enterprise" },
  { value: "solopreneur", label: "Solopreneur" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "creator", label: "Creator/Influencer" },
  { value: "consultant", label: "Consultant" },
  { value: "internal_team", label: "Internal Team" },
  { value: "other", label: "Other" },
];

/**
 * Wizard steps configuration
 */
export const WIZARD_STEPS = [
  { id: "basic", title: "Basic Info", description: "Name and category" },
  { id: "personas", title: "Personas", description: "Target users" },
  { id: "platform", title: "Platform", description: "Tools mapping" },
  { id: "journey", title: "Journey", description: "User stages" },
  { id: "marketing", title: "Marketing", description: "Messaging" },
  { id: "questions", title: "Questions", description: "Onboarding quiz" },
  { id: "review", title: "Review", description: "Generate roadmap" },
] as const;

