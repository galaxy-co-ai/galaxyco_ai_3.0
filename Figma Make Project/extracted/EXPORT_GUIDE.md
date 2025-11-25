# GalaxyCo.ai Project Export Guide

This guide helps you export all files from your Figma Make project to share with your Cursor agent.

## Project Structure

Your project contains approximately 150+ files organized as follows:

### Root Files
- `/App.tsx` - Main application component
- `/styles/globals.css` - Global styles and CSS variables

### Documentation Files (Root)
- `/README.md`
- `/PROJECT_SUMMARY.md`
- `/FEATURES.md`
- `/CHANGELOG.md`
- `/Attributions.md`
- `/QUICK_START.md`
- `/LUNAR_LABS.md`
- `/REORGANIZATION_STATUS.md`
- `/REORGANIZATION_SUMMARY.md`
- `/REORGANIZATION_DONE.md`
- `/REORGANIZATION_COMPLETION_SCRIPT.md`
- `/COMPLETE_REORGANIZATION_NOW.md`

### Documentation Files (/docs)
- `/docs/README.md`
- `/docs/FEATURES.md`
- `/docs/CHANGELOG.md`
- `/docs/Attributions.md`
- `/docs/REORGANIZATION_GUIDE.md`

### Guidelines
- `/guidelines/Guidelines.md`

### Data Files
- `/data/lunarLabsContent.ts`

### Page Components (/pages)
- `/pages/Landing.tsx` - Landing page with hero, showcases
- `/pages/Dashboard.tsx` - Main dashboard with AI agents, activity feed
- `/pages/CRM.tsx` - CRM page with contacts, deals, projects
- `/pages/Studio.tsx` - Workflow builder studio
- `/pages/KnowledgeBase.tsx` - Knowledge base page
- `/pages/Marketing.tsx` - Marketing dashboard
- `/pages/Integrations.tsx` - Integrations page
- `/pages/LunarLabs.tsx` - Interactive learning platform

### Landing Page Components (/components/landing)
- `/components/landing/HeroSection.tsx` - Hero with rotating carousel
- `/components/landing/EnhancedBenefits.tsx` - Benefits section
- `/components/landing/EnhancedShowcaseWrapper.tsx` - Showcase wrapper
- `/components/landing/EnhancedThreePillars.tsx` - Three pillars section
- `/components/landing/Footer.tsx` - Footer component
- `/components/landing/FooterCTA.tsx` - Footer CTA section
- `/components/landing/SectionDivider.tsx` - Section dividers
- `/components/landing/SmartNavigation.tsx` - Smart navigation bar
- `/components/landing/StockTicker.tsx` - Stock ticker animation

### Landing Showcases (/components/landing/showcases)
- `/components/landing/showcases/index.ts` - Exports
- `/components/landing/showcases/CRMShowcase.tsx`
- `/components/landing/showcases/DashboardShowcase.tsx`
- `/components/landing/showcases/KnowledgeShowcase.tsx`
- `/components/landing/showcases/MarketingShowcase.tsx`
- `/components/landing/showcases/StudioShowcase.tsx`

### Legacy Landing Components (/components/LandingShowcase)
- `/components/LandingShowcase/index.ts`
- `/components/LandingShowcase/CRMShowcase.tsx`
- `/components/LandingShowcase/DashboardShowcase.tsx`
- `/components/LandingShowcase/KnowledgeShowcase.tsx`
- `/components/LandingShowcase/MarketingShowcase.tsx`
- `/components/LandingShowcase/StudioShowcase.tsx`

### Dashboard Components (/components/dashboard)
- `/components/dashboard/ActivityFeed.tsx`
- `/components/dashboard/DashboardStats.tsx`

### LunarLabs Components (/components/LunarLabs)
- `/components/LunarLabs/AchievementBadges.tsx`
- `/components/LunarLabs/ContentStage.tsx`
- `/components/LunarLabs/LabNotebook.tsx`
- `/components/LunarLabs/LearningStats.tsx`
- `/components/LunarLabs/QuickActionPanel.tsx`
- `/components/LunarLabs/RoleSelector.tsx`
- `/components/LunarLabs/SearchCommand.tsx`
- `/components/LunarLabs/SmartSuggestions.tsx`
- `/components/LunarLabs/TopicExplorer.tsx`
- `/components/LunarLabs/WhatsNewFeed.tsx`

### Sandbox Demos (/components/SandboxDemos)
- `/components/SandboxDemos/CRMContactDemo.tsx`
- `/components/SandboxDemos/EmailComposerDemo.tsx`
- `/components/SandboxDemos/WorkflowBuilderDemo.tsx`

### Shared Components (/components) - TO BE REORGANIZED
- `/components/ActivityFeed.tsx` (duplicate - to be removed)
- `/components/AgentStatusCard.tsx`
- `/components/AppSidebar.tsx` - Main sidebar navigation
- `/components/ConnectionConfig.tsx`
- `/components/CosmicBackground.tsx`
- `/components/DashboardStats.tsx` (duplicate - to be removed)
- `/components/DemoWrapper.tsx`
- `/components/DocumentsPanel.tsx`
- `/components/EnhancedBenefits.tsx` (duplicate - to be removed)
- `/components/EnhancedShowcaseWrapper.tsx` (duplicate - to be removed)
- `/components/EnhancedThreePillars.tsx` (duplicate - to be removed)
- `/components/FloatingAIAssistant.tsx` - Floating AI assistant
- `/components/Footer.tsx` (duplicate - to be removed)
- `/components/FooterCTA.tsx` (duplicate - to be removed)
- `/components/HeroSection.tsx` (duplicate - to be removed)
- `/components/IntegrationCard.tsx`
- `/components/KeyboardShortcuts.tsx`
- `/components/LiveActivityFeed.tsx`
- `/components/NodeInspector.tsx`
- `/components/NodePalette.tsx`
- `/components/OnboardingFlow.tsx` - Onboarding wizard
- `/components/QuickActions.tsx`
- `/components/QuickIntegrationCard.tsx`
- `/components/Resources.tsx`
- `/components/SectionDivider.tsx` (duplicate - to be removed)
- `/components/SmartNavigation.tsx` (duplicate - to be removed)
- `/components/StockTicker.tsx` (duplicate - to be removed)
- `/components/TestResultsPanel.tsx`
- `/components/VisualGridBuilder.tsx`
- `/components/WorkflowMinimap.tsx`
- `/components/WorkflowTemplates.tsx`
- `/components/WorkflowVisualizer.tsx`

### Figma Components (/components/figma) - PROTECTED
- `/components/figma/ImageWithFallback.tsx` - Do not modify

### UI Components (/components/ui) - ShadCN Components
All 41 ShadCN UI components:
- `/components/ui/accordion.tsx`
- `/components/ui/alert-dialog.tsx`
- `/components/ui/alert.tsx`
- `/components/ui/aspect-ratio.tsx`
- `/components/ui/avatar.tsx`
- `/components/ui/badge.tsx`
- `/components/ui/breadcrumb.tsx`
- `/components/ui/button.tsx`
- `/components/ui/calendar.tsx`
- `/components/ui/card.tsx`
- `/components/ui/carousel.tsx`
- `/components/ui/chart.tsx`
- `/components/ui/checkbox.tsx`
- `/components/ui/collapsible.tsx`
- `/components/ui/command.tsx`
- `/components/ui/context-menu.tsx`
- `/components/ui/dialog.tsx`
- `/components/ui/drawer.tsx`
- `/components/ui/dropdown-menu.tsx`
- `/components/ui/form.tsx`
- `/components/ui/hover-card.tsx`
- `/components/ui/input-otp.tsx`
- `/components/ui/input.tsx`
- `/components/ui/label.tsx`
- `/components/ui/menubar.tsx`
- `/components/ui/navigation-menu.tsx`
- `/components/ui/pagination.tsx`
- `/components/ui/popover.tsx`
- `/components/ui/progress.tsx`
- `/components/ui/radio-group.tsx`
- `/components/ui/resizable.tsx`
- `/components/ui/scroll-area.tsx`
- `/components/ui/select.tsx`
- `/components/ui/separator.tsx`
- `/components/ui/sheet.tsx`
- `/components/ui/sidebar.tsx`
- `/components/ui/skeleton.tsx`
- `/components/ui/slider.tsx`
- `/components/ui/sonner.tsx`
- `/components/ui/switch.tsx`
- `/components/ui/table.tsx`
- `/components/ui/tabs.tsx`
- `/components/ui/textarea.tsx`
- `/components/ui/toggle-group.tsx`
- `/components/ui/toggle.tsx`
- `/components/ui/tooltip.tsx`
- `/components/ui/use-mobile.ts`
- `/components/ui/utils.ts`

## Asset Files (Figma Imports)

The project uses Figma-imported images with paths like:
- `figma:asset/cc04d2539ffda459bf3d2080302ae324273ed6b1.png` (Dashboard screenshot)
- `figma:asset/21ae81cebebfb4c44ee0efeb66ff5dc44bb67ea1.png` (Studio screenshot)
- `figma:asset/2e7f68c1c01ae88c9a8060d3301b1c6005dba66a.png` (CRM screenshot)
- `figma:asset/2804fd75268c2fef42d38358d95f93af3791f7bb.png` (Marketing screenshot)

These are embedded in the Figma Make environment and may not export directly.

## How to Export for Cursor

Since this is a Figma Make project, the best way to export it is to:

### Option 1: Copy All Code Manually
1. Create the folder structure on your desktop: `Figma Make Project/`
2. Create subdirectories matching the structure above
3. Copy each file's content from Figma Make into corresponding files

### Option 2: Use Read Tool to Get File Contents
I can provide the content of each file systematically. Here's what to do:

1. **Ask me to provide files in batches** - I'll read and provide the content of files organized by category
2. **Create the files on your desktop** - Copy the content I provide into files matching the exact paths

### Option 3: Export Project Metadata
Create a `package.json` equivalent that lists:
- All React dependencies used (motion/react, lucide-react, recharts, shadcn components, etc.)
- Project structure
- Build configuration

## Priority Files for Cursor

If you want to start with the most important files:

### Essential Structure (Must Have)
1. `/App.tsx` - Main app entry point
2. `/styles/globals.css` - All styling and design tokens
3. `/pages/*.tsx` - All 8 page files
4. `/components/ui/*.tsx` - All ShadCN components (41 files)
5. `/components/AppSidebar.tsx` - Main navigation
6. `/components/FloatingAIAssistant.tsx` - AI assistant
7. `/components/OnboardingFlow.tsx` - Onboarding

### Landing Page Files (High Priority)
1. `/components/landing/*.tsx` - All 9 landing components
2. `/components/landing/showcases/*.tsx` - All 5 showcase components

### Documentation (Nice to Have)
1. `/README.md`
2. `/PROJECT_SUMMARY.md`
3. `/FEATURES.md`

## Next Steps

Let me know which approach you'd like to take:

1. **Batch Export** - I'll provide file contents in organized batches (recommended)
2. **Specific Files** - Tell me which files you need and I'll provide their content
3. **Complete Archive** - I'll systematically go through every single file

Would you like me to start with the essential files listed above?
