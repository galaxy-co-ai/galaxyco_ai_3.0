# GalaxyCo.ai - AI-Native Workspace Platform

A cutting-edge platform that natively integrates AI agents and automated workflows into company ecosystems to save employees hours of work each week.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)

## 🌟 Overview

GalaxyCo.ai is built on three main pillars:

1. **Knowledge Base** - Centralized company documentation with AI-powered search and organization
2. **AI-Native CRM** - Auto-transcribes and organizes calls, meetings, and emails into actionable data
3. **AI Assistant Hub** - Orchestrates tasks to specialized agents with visual workflow management

## ✨ Key Features

### 🎯 Landing Page
- Beautiful hero section with animated gradients
- Interactive platform showcase with live previews
- Comprehensive benefits section
- Conversion-optimized CTAs
- Smooth animations with Framer Motion

### 📊 Dashboard
- Real-time agent activity monitoring
- Live statistics with animated stock tickers
- Visual workflow status
- Activity feed with AI insights
- Quick actions panel

### 🎨 Studio (Visual Workflow Builder)
- Drag-and-drop workflow creation inspired by React Flow
- Visual grid builder with node-based interface
- Real-time workflow visualization
- Node palette with AI agents
- Workflow templates library
- Live minimap for large workflows
- Node inspector for detailed configuration

### 📚 Knowledge Base
- AI-powered document search
- Folder-based organization
- Document preview cards
- File type detection (PDF, video, images, docs)
- AI recommendations banner
- Thin horizontal stat cards
- Premium empty state design

### 💼 CRM
- AI-native customer relationship management
- Auto-transcription of calls and meetings
- Smart contact organization
- Pipeline visualization
- Deal tracking with AI insights
- Email and meeting integration

### 📢 Marketing
- Campaign performance tracking
- Visual analytics dashboard
- ROI monitoring
- Multi-channel campaign management
- AI-powered optimization suggestions

### 🔌 Integrations
- Pre-built connectors for popular tools
- OAuth-style connection flow
- Visual integration status
- Quick setup wizard
- Connection health monitoring

### 🎓 Onboarding Flow
- Beautiful 4-step guided setup
- Essential app connections (Gmail, Google Calendar)
- Additional app recommendations (Slack, Notion, Salesforce, HubSpot)
- Progress tracking
- Confetti celebrations on completion
- Responsive design

### 🤖 AI Assistant
- Floating assistant widget
- Context-aware suggestions
- Document generation
- Task automation
- Natural language commands

## 🏗️ Project Structure

```
├── App.tsx                          # Main application router
├── components/
│   ├── ActivityFeed.tsx             # Live activity stream
│   ├── AgentStatusCard.tsx          # Agent status display
│   ├── AppSidebar.tsx               # Main navigation sidebar
│   ├── ConnectionConfig.tsx         # Integration configuration
│   ├── DashboardStats.tsx           # Dashboard statistics cards
│   ├── DocumentsPanel.tsx           # Document management panel
│   ├── FloatingAIAssistant.tsx      # AI assistant widget
│   ├── IntegrationCard.tsx          # Integration connection cards
│   ├── KeyboardShortcuts.tsx        # Keyboard shortcuts overlay
│   ├── LiveActivityFeed.tsx         # Real-time activity feed
│   ├── NodeInspector.tsx            # Workflow node inspector
│   ├── NodePalette.tsx              # Workflow node palette
│   ├── OnboardingFlow.tsx           # User onboarding wizard
│   ├── QuickActions.tsx             # Quick action buttons
│   ├── QuickIntegrationCard.tsx     # Compact integration cards
│   ├── Resources.tsx                # Resource links
│   ├── StockTicker.tsx              # Animated statistics ticker
│   ├── TestResultsPanel.tsx         # Workflow testing panel
│   ├── VisualGridBuilder.tsx        # Visual workflow builder
│   ├── WorkflowMinimap.tsx          # Workflow minimap
│   ├── WorkflowTemplates.tsx        # Workflow templates
│   ├── WorkflowVisualizer.tsx       # Workflow visualization
│   ├── figma/
│   │   └── ImageWithFallback.tsx    # Image component with fallback
│   └── ui/                          # Shadcn/ui components
├── pages/
│   ├── Landing.tsx                  # Landing page
│   ├── Dashboard.tsx                # Main dashboard
│   ├── Studio.tsx                   # Workflow studio
│   ├── KnowledgeBase.tsx            # Knowledge base
│   ├── CRM.tsx                      # CRM page
│   ├── Marketing.tsx                # Marketing page
│   └── Integrations.tsx             # Integrations page
└── styles/
    └── globals.css                  # Global styles and Tailwind config
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/galaxyco-ai.git
cd galaxyco-ai
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#007AFF) - Main actions and CTAs
- **Secondary**: Purple (#8B5CF6) - Accent and highlights
- **Success**: Green (#10B981) - Positive actions
- **Warning**: Orange (#F59E0B) - Warnings and alerts
- **Error**: Red (#EF4444) - Errors and destructive actions

### Typography
- Custom font sizing defined in `globals.css`
- Responsive typography with mobile-first approach
- Semantic heading hierarchy (h1-h6)

### Components
- Built with Shadcn/ui for consistency
- Custom variants for GalaxyCo.ai brand
- Rounded corners and modern shadows
- Gradient accents throughout

## 🔧 Tech Stack

- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4.0** - Styling
- **Shadcn/ui** - Component library
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Canvas Confetti** - Celebration effects
- **React Slick** - Carousels
- **Vite** - Build tool

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🎯 Key User Flows

### First-Time User
1. Land on Landing page
2. Click "Enter App" or "Start Free Trial"
3. Complete 4-step onboarding wizard
4. Connect essential apps (Gmail, Calendar)
5. Optionally connect additional apps
6. See completion celebration
7. Enter Dashboard with AI already learning

### Workflow Creation
1. Navigate to Studio
2. Choose template or start from scratch
3. Drag nodes from palette to canvas
4. Connect nodes to create workflow
5. Configure each node
6. Test workflow
7. Deploy and monitor

### Document Management
1. Navigate to Knowledge Base
2. Browse folders or search
3. Upload new documents
4. AI automatically categorizes and tags
5. View AI-generated summaries
6. Access from anywhere in platform

## 🔐 Security & Privacy

- No PII collection in demo mode
- Enterprise-grade encryption ready
- OAuth 2.0 for integrations
- Role-based access control (RBAC) ready
- Audit logging capability

## 🎓 Onboarding

Reset onboarding:
```javascript
localStorage.removeItem("galaxyco_onboarding_completed")
```

Or click "Guided Setup" in the Integrations page.

## 🤝 Contributing

This is a demo project showcasing modern React patterns and UI/UX best practices.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Shadcn/ui for the component library
- Tailwind CSS for the utility-first CSS framework
- React Flow for workflow inspiration
- Make.com for grid visualization inspiration
- Lucide for the icon set

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ for the future of work**

GalaxyCo.ai - Transform your company into an AI-powered operation
