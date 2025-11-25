# File Reorganization Guide

## Overview

This document tracks the reorganization of GalaxyCo.ai from a flat structure to a feature-based architecture.

## New Structure

```
├── docs/                          # ✅ All documentation
│   ├── README.md                 # ✅ Main documentation
│   ├── CHANGELOG.md              # ✅ Version history
│   ├── FEATURES.md               # ✅ Feature list
│   ├── PROJECT_SUMMARY.md        # → To be moved
│   ├── QUICK_START.md            # → To be moved
│   ├── LUNAR_LABS.md             # → To be moved
│   ├── Attributions.md           # → To be moved
│   └── guidelines/
│       └── Guidelines.md         # → To be moved
│
├── components/
│   ├── landing/                  # Landing page components
│   │   ├── HeroSection.tsx
│   │   ├── Footer.tsx
│   │   ├── FooterCTA.tsx
│   │   ├── EnhancedBenefits.tsx
│   │   ├── EnhancedThreePillars.tsx
│   │   ├── EnhancedShowcaseWrapper.tsx
│   │   ├── StockTicker.tsx
│   │   └── showcases/
│   │       ├── DashboardShowcase.tsx
│   │       ├── StudioShowcase.tsx
│   │       ├── CRMShowcase.tsx
│   │       ├── KnowledgeShowcase.tsx
│   │       ├── MarketingShowcase.tsx
│   │       └── index.ts
│   │
│   ├── dashboard/                # Dashboard components
│   │   ├── DashboardStats.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── LiveActivityFeed.tsx
│   │   ├── QuickActions.tsx
│   │   └── AgentStatusCard.tsx
│   │
│   ├── studio/                   # Studio/Workflow components
│   │   ├── WorkflowVisualizer.tsx
│   │   ├── WorkflowMinimap.tsx
│   │   ├── WorkflowTemplates.tsx
│   │   ├── VisualGridBuilder.tsx
│   │   ├── NodePalette.tsx
│   │   ├── NodeInspector.tsx
│   │   └── TestResultsPanel.tsx
│   │
│   ├── knowledge-base/           # Knowledge Base components
│   │   └── DocumentsPanel.tsx
│   │
│   ├── integrations/             # Integration components
│   │   ├── IntegrationCard.tsx
│   │   ├── QuickIntegrationCard.tsx
│   │   └── ConnectionConfig.tsx
│   │
│   ├── lunar-labs/               # Lunar Labs components (renamed from LunarLabs)
│   │   ├── AchievementBadges.tsx
│   │   ├── ContentStage.tsx
│   │   ├── LabNotebook.tsx
│   │   ├── LearningStats.tsx
│   │   ├── QuickActionPanel.tsx
│   │   ├── RoleSelector.tsx
│   │   ├── SearchCommand.tsx
│   │   ├── SmartSuggestions.tsx
│   │   ├── TopicExplorer.tsx
│   │   └── WhatsNewFeed.tsx
│   │
│   ├── demos/                    # Demo components (renamed from SandboxDemos)
│   │   ├── CRMContactDemo.tsx
│   │   ├── EmailComposerDemo.tsx
│   │   └── WorkflowBuilderDemo.tsx
│   │
│   ├── shared/                   # Shared components
│   │   ├── AppSidebar.tsx
│   │   ├── SmartNavigation.tsx
│   │   ├── FloatingAIAssistant.tsx
│   │   ├── CosmicBackground.tsx
│   │   ├── SectionDivider.tsx
│   │   ├── KeyboardShortcuts.tsx
│   │   ├── OnboardingFlow.tsx
│   │   ├── DemoWrapper.tsx
│   │   └── Resources.tsx
│   │
│   ├── ui/                       # shadcn/ui components (unchanged)
│   │   └── (all existing files)
│   │
│   └── figma/                    # Figma utilities (unchanged)
│       └── ImageWithFallback.tsx
│
├── lib/                          # NEW: Utilities & helpers
│   └── utils.ts                  # Move from components/ui/utils.ts
│
├── data/
│   └── lunarLabsContent.ts       # (unchanged)
│
├── pages/
│   └── (all existing pages unchanged)
│
└── styles/
    └── globals.css               # (unchanged)
```

## Migration Steps

### Phase 1: Documentation (COMPLETED)
- [x] Create `/docs` directory
- [x] Move README.md → /docs/README.md
- [x] Move CHANGELOG.md → /docs/CHANGELOG.md
- [x] Move FEATURES.md → /docs/FEATURES.md
- [ ] Move PROJECT_SUMMARY.md → /docs/PROJECT_SUMMARY.md
- [ ] Move QUICK_START.md → /docs/QUICK_START.md
- [ ] Move LUNAR_LABS.md → /docs/LUNAR_LABS.md
- [ ] Move Attributions.md → /docs/Attributions.md
- [ ] Move guidelines/Guidelines.md → /docs/guidelines/Guidelines.md
- [ ] Delete old markdown files from root

### Phase 2: Component Directories
- [ ] Create `/components/landing`
- [ ] Create `/components/dashboard`
- [ ] Create `/components/studio`
- [ ] Create `/components/knowledge-base`
- [ ] Create `/components/integrations`
- [ ] Create `/components/lunar-labs`
- [ ] Create `/components/demos`
- [ ] Create `/components/shared`

### Phase 3: Move Landing Components
- [ ] Move HeroSection.tsx → /components/landing/
- [ ] Move Footer.tsx → /components/landing/
- [ ] Move FooterCTA.tsx → /components/landing/
- [ ] Move EnhancedBenefits.tsx → /components/landing/
- [ ] Move EnhancedThreePillars.tsx → /components/landing/
- [ ] Move EnhancedShowcaseWrapper.tsx → /components/landing/
- [ ] Move StockTicker.tsx → /components/landing/
- [ ] Move LandingShowcase/* → /components/landing/showcases/

### Phase 4: Move Dashboard Components
- [ ] Move DashboardStats.tsx → /components/dashboard/
- [ ] Move ActivityFeed.tsx → /components/dashboard/
- [ ] Move LiveActivityFeed.tsx → /components/dashboard/
- [ ] Move QuickActions.tsx → /components/dashboard/
- [ ] Move AgentStatusCard.tsx → /components/dashboard/

### Phase 5: Move Studio Components
- [ ] Move WorkflowVisualizer.tsx → /components/studio/
- [ ] Move WorkflowMinimap.tsx → /components/studio/
- [ ] Move WorkflowTemplates.tsx → /components/studio/
- [ ] Move VisualGridBuilder.tsx → /components/studio/
- [ ] Move NodePalette.tsx → /components/studio/
- [ ] Move NodeInspector.tsx → /components/studio/
- [ ] Move TestResultsPanel.tsx → /components/studio/

### Phase 6: Move Knowledge Base Components
- [ ] Move DocumentsPanel.tsx → /components/knowledge-base/

### Phase 7: Move Integration Components
- [ ] Move IntegrationCard.tsx → /components/integrations/
- [ ] Move QuickIntegrationCard.tsx → /components/integrations/
- [ ] Move ConnectionConfig.tsx → /components/integrations/

### Phase 8: Move Lunar Labs Components
- [ ] Move LunarLabs/* → /components/lunar-labs/

### Phase 9: Move Demo Components
- [ ] Move SandboxDemos/* → /components/demos/

### Phase 10: Move Shared Components
- [ ] Move AppSidebar.tsx → /components/shared/
- [ ] Move SmartNavigation.tsx → /components/shared/
- [ ] Move FloatingAIAssistant.tsx → /components/shared/
- [ ] Move CosmicBackground.tsx → /components/shared/
- [ ] Move SectionDivider.tsx → /components/shared/
- [ ] Move KeyboardShortcuts.tsx → /components/shared/
- [ ] Move OnboardingFlow.tsx → /components/shared/
- [ ] Move DemoWrapper.tsx → /components/shared/
- [ ] Move Resources.tsx → /components/shared/

### Phase 11: Create Standard Directories
- [ ] Create `/lib` directory
- [ ] Move /components/ui/utils.ts → /lib/utils.ts
- [ ] Update utils imports across codebase

### Phase 12: Update All Imports
- [ ] Update App.tsx imports
- [ ] Update all page imports
- [ ] Update component cross-references
- [ ] Test all pages work correctly

### Phase 13: Cleanup
- [ ] Delete old markdown files from root
- [ ] Delete old component files from /components root
- [ ] Delete empty directories
- [ ] Verify no broken imports

## Import Path Changes

### Before → After

```typescript
// Landing
"./components/HeroSection" → "./components/landing/HeroSection"
"./components/Footer" → "./components/landing/Footer"
"./components/LandingShowcase" → "./components/landing/showcases"

// Dashboard
"./components/DashboardStats" → "./components/dashboard/DashboardStats"
"./components/ActivityFeed" → "./components/dashboard/ActivityFeed"

// Studio
"./components/WorkflowVisualizer" → "./components/studio/WorkflowVisualizer"
"./components/NodePalette" → "./components/studio/NodePalette"

// Shared
"./components/AppSidebar" → "./components/shared/AppSidebar"
"./components/FloatingAIAssistant" → "./components/shared/FloatingAIAssistant"

// Integrations
"./components/IntegrationCard" → "./components/integrations/IntegrationCard"

// Knowledge Base
"./components/DocumentsPanel" → "./components/knowledge-base/DocumentsPanel"

// Lunar Labs
"./components/LunarLabs/..." → "./components/lunar-labs/..."

// Demos
"./components/SandboxDemos/..." → "./components/demos/..."

// Utils
"./components/ui/utils" → "./lib/utils"
```

## Benefits

1. **Clear Feature Boundaries** - Each feature has its own directory
2. **Easier Navigation** - AI agents and developers can find components quickly
3. **Better Scalability** - Easy to add new features without cluttering root
4. **Standard Structure** - Follows industry best practices
5. **Improved Context** - AI can understand feature relationships better

## Status

🟡 **IN PROGRESS** - Phase 1 (Documentation) partially complete

Last Updated: 2025-11-07
