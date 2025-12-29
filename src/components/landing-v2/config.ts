/**
 * Landing Page V2 Configuration
 * Trust-First UX — Question Flow & Content
 */

export interface QuestionNode {
  id: string;
  question: string;
  chips: {
    label: string;
    responseNodes: string[];
    followUp?: QuestionNode;
  }[];
}

export interface SolutionNode {
  label: string;
  icon?: string;
}

// Opening question with 3 paths
export const questionFlow: QuestionNode = {
  id: "opening",
  question: "What's quietly costing you the most time?",
  chips: [
    {
      label: "Leads slipping through the cracks",
      responseNodes: [
        "Lead comes in",
        "Neptune scores & prioritizes",
        "You focus on the right ones",
      ],
      followUp: {
        id: "leads-followup",
        question: "What happens to a lead after it comes in?",
        chips: [
          {
            label: "I try to remember to follow up",
            responseNodes: [
              "Lead captured",
              "Neptune tracks automatically",
              "You get reminded at the right time",
            ],
          },
          {
            label: "It sits in a spreadsheet somewhere",
            responseNodes: [
              "Scattered data",
              "Neptune centralizes everything",
              "One source of truth",
            ],
          },
          {
            label: "Honestly? It depends on the day",
            responseNodes: [
              "Inconsistent process",
              "Neptune creates consistency",
              "Every lead gets attention",
            ],
          },
        ],
      },
    },
    {
      label: "Follow-ups I keep forgetting",
      responseNodes: [
        "You mention it once",
        "Neptune remembers",
        "You get reminded at the right time",
      ],
      followUp: {
        id: "followups-followup",
        question: "How do you currently track what needs follow-up?",
        chips: [
          {
            label: "Mental notes (risky)",
            responseNodes: [
              "Mental load",
              "Neptune takes it off your plate",
              "Nothing slips",
            ],
          },
          {
            label: "Scattered across apps",
            responseNodes: [
              "Fragmented system",
              "Neptune unifies",
              "One place for everything",
            ],
          },
          {
            label: "I don't — things slip",
            responseNodes: [
              "Things fall through",
              "Neptune catches them",
              "Automatic safety net",
            ],
          },
        ],
      },
    },
    {
      label: "Jumping between too many tools",
      responseNodes: [
        "CRM here",
        "Notes there",
        "Neptune: One place",
      ],
      followUp: {
        id: "tools-followup",
        question: "How many tools are you using to run your business?",
        chips: [
          {
            label: "3-5 (manageable chaos)",
            responseNodes: [
              "Multiple logins",
              "Neptune consolidates",
              "One system, full picture",
            ],
          },
          {
            label: "6-10 (daily juggling)",
            responseNodes: [
              "Context switching",
              "Neptune eliminates it",
              "Everything in one flow",
            ],
          },
          {
            label: "I've lost count",
            responseNodes: [
              "Tool sprawl",
              "Neptune simplifies",
              "Start fresh, stay organized",
            ],
          },
        ],
      },
    },
  ],
};

// Value demonstration section content
export const valueExamples = [
  {
    before: "You said 'remind me to follow up with John'",
    action: "Neptune scheduled it",
    after: "You got reminded",
  },
  {
    before: "You added a lead",
    action: "Neptune scored and prioritized it",
    after: "You focused on the right one",
  },
  {
    before: "You asked about cash flow",
    action: "Neptune pulled the numbers",
    after: "You made an informed decision",
  },
];

// How it works steps
export const howItWorks = [
  {
    step: 1,
    title: "Tell Neptune what you need",
    description: "In plain language. No learning curve.",
  },
  {
    step: 2,
    title: "Neptune handles the details",
    description: "Tracks, reminds, organizes, executes.",
  },
  {
    step: 3,
    title: "You stay focused on what matters",
    description: "The work that actually moves the needle.",
  },
];

// Design tokens for landing page (light theme hero)
export const landingTokens = {
  hero: {
    background: "#FFFFFF",
    text: "#0D0D12",
    textSecondary: "#6B7280",
    chipBg: "#F3F4F6",
    chipHover: "#E5E7EB",
    chipSelected: "#0D0D12",
    chipSelectedText: "#FFFFFF",
    accent: "#00D4E8",
  },
  sections: {
    background: "#0D0D12",
    surface: "#161922",
    text: "rgba(245,245,247,0.95)",
    textSecondary: "rgba(245,245,247,0.6)",
    accent: "#00D4E8",
  },
};
