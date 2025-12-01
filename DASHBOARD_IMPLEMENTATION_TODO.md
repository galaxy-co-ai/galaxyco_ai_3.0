# Dashboard Implementation TODO

## 🎯 Objective
Replace the current Dashboard (`src/pages/Dashboard.tsx`) with the exact design shown in the provided Figma screenshots. The Dashboard has 6 tabs with unique content for each tab.

## 📂 Files to Modify
- **Primary File**: `src/pages/Dashboard.tsx` - Replace entirely with new implementation
- **Reference File**: `Figma Make Project/extracted/components/landing/showcases/DashboardShowcase.tsx` - Use as starting point
- **Keep**: All existing UI components in `src/components/ui/` - reuse these

## 🎨 Design Requirements

### Top Section (Fixed across all tabs)
1. **Title**: "Dashboard" (centered, large text)
2. **Subtitle**: "Welcome back! Here's an overview of your AI agents and workflows." (centered, muted color)
3. **Three Stat Badges** (horizontal row, centered):
   - "4 Active Agents" - blue background, Activity icon
   - "1,247 Tasks Completed" - green background, CheckCircle2 icon
   - "342 Hours Saved" - purple background, Clock icon
   - Style: Rounded pills with gradient backgrounds

### Floating Tab Bar
**Location**: Below the stat badges, centered
**Style**: 
- White background with backdrop blur (`bg-background/80 backdrop-blur-lg`)
- Rounded full (`rounded-full`)
- Shadow: `shadow-[0_8px_30px_rgb(0,0,0,0.12)]`
- 6 tabs in a horizontal grid

**Tabs** (left to right):
1. **Tips** - Lightbulb icon, purple badge with "4", purple active state
2. **Snapshot** - Sparkles icon, blue badge with "?", blue active state
3. **Automations** - Bot icon, green active state
4. **Planner** - CalendarDays icon, orange badge with "4", orange active state
5. **Messages** - MessageSquare icon, cyan active state
6. **Agents** - Bot icon, emerald badge with "3", emerald active state

**Tab Styling**:
- Inactive: Gray text, transparent background
- Active: White text, colored background (color varies by tab)
- Icon + text layout, small icons (h-3 w-3)
- Rounded full shape

### Content Area
**Location**: Below the tab bar
**Style**: Large white card with shadow, rounded corners
**Padding**: `p-6` to `p-8`

---

## 📋 Tab Content Specifications

### Tab 1: Tips
**Layout**: Two-column grid

**Left Column - "Ask Your AI Assistant"**:
- Purple gradient icon (message square/chat)
- Title: "Ask Your AI Assistant"
- Subtitle: "Get instant help with blockers, questions, or needs"
- Example questions section with purple text:
  - "How can I automate my email follow-ups?"
  - "What's blocking my lead conversion?"
  - "Show me what I should focus on today"
- Text input at bottom: "Ask me anything about your workflows, tasks, or data..."
- Small note: "AI analyzes your data in real-time to provide personalized insights"

**Right Column - "Quick Actions"**:
- Cyan/teal gradient icon (lightning bolt)
- Title: "Quick Actions"
- Subtitle: "One-click solutions to solve your needs instantly"
- 5 Action Cards (each with colored icon + text):
  1. **Auto-respond to 12 emails** - Light blue icon (Mail)
     - "Save ~45 min • Drafts ready for review"
  2. **Generate meeting brief for 3pm call** - Green icon (FileText)
     - "TechCorp • Context from 8 sources"
  3. **Score and prioritize 5 new leads** - Purple icon (Target)
     - "AI confidence: High • Ready to assign"
  4. **Sync 24 contacts to Salesforce** - Blue icon (Database)
     - "Updated data • Resolve duplicates"
  5. **Create daily action digest** - Orange icon (List)
     - "Top 10 priorities • Morning summary"

### Tab 2: Snapshot
**Layout**: Single column with sections

**Header**: "AI Intelligence Brief"
- Subtitle: "Live analysis • Updated just now"
- Info icon on right

**Section 1 - Two Columns**:
- **Left: "Quick Wins"** (green icon)
  - "Ready to act on now"
  - 3 action items with green buttons:
    1. "3 high-value leads need follow-up" → "Review Leads" button
    2. "12 emails can be auto-responded" → "Review Drafts" button
    3. "Meeting prep brief ready for 3pm call" → "View Brief" button

- **Right: "Key Insights"** (purple sparkles icon)
  - "What the AI sees"
  - 5 bullet points (purple dots):
    1. "Lead qualification rate improved 28% after implementing new scoring criteria"
    2. "Meeting notes agent detected 5 action items across today's calls — all assigned"
    3. "CRM data quality score: 94% (up from 87% last month)"
    4. "Invoice processing time reduced to avg. 4.2 minutes (down from 12 minutes)"
    5. "Workflow automation saved 2.5 hours today — on track for 62 hours this month"

**Section 2 - "AI Suggestions"**:
- Cyan/blue icon with target
- "Click to let AI do it"
- 4 suggestion pills:
  1. "Auto follow-up sequence" (blue)
  2. "Daily action digest" (purple)
  3. "Auto meeting prep" (light blue)
  4. "Smart lead scoring" (green)

### Tab 3: Automations
**Layout**: 4 rows, each row has 2 cards (problem → solution)

**Row 1**:
- **Left**: Red alert icon, "Inbox Overwhelm"
  - "47 unread high-priority emails are piling up, causing response delays and potentially missed opportunities"
- **Right**: Green lightning icon, "Email Triage Agent"
  - "Auto-categorize, draft responses, and queue for your review — save ~2 hours"

**Row 2**:
- **Left**: Yellow/orange clock icon, "Manual Lead Scoring"
  - "15 new leads need qualification, but manually researching each takes 20+ minutes per lead"
- **Right**: Blue target/bullseye icon, "Smart Lead Qualifier"
  - "AI enriches data, scores leads by fit, and prioritizes — ready in 3 minutes"

**Row 3**:
- **Left**: Purple document icon, "Meeting Prep Takes Forever"
  - "Upcoming client call in 1 hour — need to review emails, past notes, and CRM history"
- **Right**: Purple/indigo building icon, "Meeting Prep Agent"
  - "Auto-generate context brief from 8 sources — delivered in 2 minutes"

**Row 4**:
- **Left**: Orange/red database icon, "CRM Data is Messy"
  - "34 duplicate contacts, missing fields, and outdated info — data quality at 67%"
- **Right**: Cyan/teal sparkles icon, "CRM Data Cleaner"
  - "Merge duplicates, enrich fields, update info — boost to 94% quality"

### Tab 4: Planner
**Layout**: Two-column grid

**Left Column - "Monthly Overview"**:
- Title: "Monthly Overview"
- Subtitle: "Select a day to view details"
- Calendar component showing November 2025:
  - Full month view with days in grid
  - Current day (7th) highlighted in blue
  - Some days have underlines/dots indicating events (e.g., 6th, 10th, 12th)
  - Previous/Next month arrows
  - Standard Su-Sa week layout

**Right Column - "November 7"**:
- Title: "November 7"
- Subtitle: "All events, tasks, and opportunities"
- Section title: "Morning"
- 4 Events listed:
  1. **Product Strategy Meeting** (blue icon)
     - "10:00 AM - 11:00 AM • Conference Room A"
     - Blue "Meeting" badge
  2. **Update sales pipeline** (green icon)
     - "11:30 AM • CRM cleanup"
     - Green "Task" badge
  3. **StartupXYZ - Seed Round** (purple icon)
     - "2:00 PM • $500K opportunity"
     - Purple "Opportunity" badge
  4. **Prepare weekly report** (green chart icon)
     - "4:00 PM • Analytics review"
     - Green "Task" badge

### Tab 5: Messages
**Layout**: Two-column split (30/70)

**Left Column - "Messages"**:
- Message list with 5 contacts:
  1. **Sarah Chen** (SC - purple avatar)
     - "FYI - Lead Qualifier just scored 8 new leads..."
     - "2:28 PM"
     - Blue unread badge with "2"
  2. **Marcus Rodriguez** (MR - green avatar)
     - "The AI also suggested 12 additional fields..."
     - "10:17 AM"
  3. **Emily Park** (EP - orange avatar)
     - "Already done! Also created action items for follow-ups."
     - "11:05 AM"
  4. **Alex Thompson** (AT - cyan avatar)
     - "The automation workflow saved us 4 hours today."
     - "Yesterday"
  5. **Jordan Lee** (JL - pink avatar)
     - "Can you check the new integration settings?"
     - "Monday"
     - Blue unread badge with "1"

**Right Column - Conversation with Sarah Chen**:
- Header: "Sarah Chen" with "Active now" status
- Chat interface with messages:
  1. **Sarah** (9:42 AM): "Hey team! The Email Triage Agent just processed 47 high-priority emails in the last hour. Looking great! 🎉"
  2. **You** (9:43 AM - blue bubble right-aligned): "Awesome! Did it flag anything urgent?"
  3. **Sarah** (9:44 AM): "Yes. 3 emails from TechCorp about the enterprise deal. Already added to your high-priority list."
  4. **Sarah** (continued): "FYI - Lead Qualifier just scored 8 new leads from the website. 3 of them are..."
- Message input at bottom: "Message the team..."
- Send button (blue/purple gradient)

### Tab 6: Agents
**Layout**: Two-column split (30/70)

**Left Column - "AI Agents"**:
- Subtitle: "Chat with your autonomous agents"
- List of 5 agents:
  1. **Email Triage Agent** (ET - blue avatar)
     - "Daily Report: Processed 47 emails with 94% accuracy"
     - "10 min ago"
     - Green active dot
  2. **CRM Data Sync** (CD - cyan avatar)
     - "Maintenance: API rate limit approaching, optimizing..."
     - "30 min ago"
     - Green active dot
  3. **Meeting Notes Generator** (MN - purple/magenta avatar)
     - "Suggestion: I can now auto-create follow-up tasks"
     - "1 hour ago"
  4. **Lead Qualifier** (LQ - green avatar)
     - "Performance: Qualified 426 leads this month, 78% accuracy"
     - "Yesterday"
  5. **Invoice Processor** (IP - orange avatar)
     - "I've learned your approval patterns - automating more"
     - "2 days ago"

**Right Column - Chat with Email Triage Agent**:
- Header: "Email Triage Agent" with subtitle "Email Automation"
- Conversation:
  1. **Agent** (Yesterday 5:08 PM): "Great work! Can you be more aggressive with filtering promotional emails?"
  2. **You** (Yesterday 5:15 PM - green bubble): "Great work! Can you be more aggressive with filtering promotional emails?"
  3. **Agent** (Yesterday 5:16 PM): "Understood! I've adjusted my filtering rules to be more aggressive with promotional content. I'll learn from your preferences over the next few days and fine-tune automatically. 📊"
  4. **Agent** (10 min ago): "Daily Report: Processed 47 emails today with 94% accuracy. Applied your preference - filtered 15 promotional emails (up from usual 8). Would you like me to continue at this level?"
- Message input: "Message your agent..."
- Send button (emerald/green)

### Bottom Stats Bar
**Style**: Horizontal scrolling bar at the very bottom
**Animation**: Continuous auto-scroll/ticker effect
**Content**: Repeating stats with icons (light background, muted text)
- "Tasks Completed 1,247"
- "Hours Saved 342"
- "Success Rate 98.5%"
- "Active Agents 12"
- (repeats seamlessly)

---

## 🔧 Technical Implementation Notes

### State Management
```typescript
const [activeTab, setActiveTab] = useState<'tips' | 'snapshot' | 'automations' | 'planner' | 'messages' | 'agents'>('tips');
```

### Required Icons (from lucide-react)
- Activity, Bot, CheckCircle2, Clock, TrendingUp, Mail, Users, FileText
- Sparkles, Database, Bell, MessageSquare, CalendarDays, Zap, Lightbulb
- Target, List, Settings

### Required UI Components
- Card, Badge, Button, Tabs (TabsList, TabsTrigger, TabsContent)
- Input, Textarea (for message/search inputs)
- Calendar (for Planner tab - use shadcn/ui calendar component)
- Avatar (for Messages and Agents tabs)

### Animation Requirements
- Tab transitions should be smooth
- Stat badges should have subtle hover effects
- Bottom stats bar should auto-scroll continuously
- Quick action cards should have hover lift effect
- Message bubbles should align left (them) and right (you)

### Color Palette
- Blue: `bg-blue-500`, `text-blue-600`, `from-blue-500/10 to-blue-500/20`
- Green: `bg-green-500`, `text-green-600`, `from-green-500/10 to-green-500/20`
- Purple: `bg-purple-500`, `text-purple-600`, `from-purple-500/10 to-purple-500/20`
- Orange: `bg-orange-500`, `text-orange-600`, `from-orange-500/10 to-orange-500/20`
- Cyan: `bg-cyan-500`, `text-cyan-600`, `from-cyan-500/10 to-cyan-500/20`
- Emerald: `bg-emerald-500`, `text-emerald-600`

### Layout Constraints
- Max width for content: ~1200px centered
- Responsive: Stack columns on mobile
- Tab bar should be sticky or fixed for easy navigation
- Bottom stats bar should be fixed to bottom of viewport

---

## ✅ Acceptance Criteria

1. ✅ All 6 tabs implemented with exact content from screenshots
2. ✅ Floating tab bar matches design (rounded, shadowed, colored active states)
3. ✅ Top stat badges display correctly (blue, green, purple)
4. ✅ Bottom scrolling stats bar animates continuously
5. ✅ Tab switching is smooth and functional
6. ✅ All icons match the screenshot designs
7. ✅ Color scheme matches screenshots exactly
8. ✅ Layout is responsive (mobile-friendly)
9. ✅ No console errors or linter warnings
10. ✅ Page loads at `http://localhost:3000/dashboard` successfully

---

## 🚀 Step-by-Step Implementation

1. **Read the reference file**: `Figma Make Project/extracted/components/landing/showcases/DashboardShowcase.tsx`
2. **Clear current Dashboard.tsx** and start with the basic structure
3. **Implement the fixed top section** (title, subtitle, stat badges)
4. **Build the floating tab bar** with all 6 tabs and proper styling
5. **Implement each tab content** one at a time:
   - Start with Tips (has two columns)
   - Then Snapshot (complex layout with sections)
   - Automations (4 rows of problem/solution pairs)
   - Planner (calendar + event list)
   - Messages (message list + conversation)
   - Agents (agent list + chat)
6. **Add the bottom scrolling stats bar**
7. **Test tab switching** - ensure all tabs display correctly
8. **Verify responsiveness** on different screen sizes
9. **Fix any linter errors**
10. **Test in browser** at `http://localhost:3000/dashboard`

---

## 📸 Reference Screenshots
The user will provide 6 screenshots showing:
1. Dashboard with Tips tab active
2. Dashboard with Snapshot tab active
3. Dashboard with Automations tab active
4. Dashboard with Planner tab active
5. Dashboard with Messages tab active
6. Dashboard with Agents tab active

**Important**: Match the screenshots EXACTLY. Pay attention to:
- Icon placement and colors
- Text content and formatting
- Spacing and padding
- Card shadows and borders
- Badge colors and positions
- Avatar colors in Messages/Agents tabs
- Calendar styling in Planner tab

---

## 🎯 Success Metrics
When complete, the Dashboard should:
- Look identical to the Figma screenshots
- Function smoothly with tab navigation
- Display all content correctly
- Be ready to showcase on the Landing page
- Have no visual bugs or layout issues

---

## ⚠️ Important Notes
- **DO NOT modify** the app layout wrapper or sidebar - those are working correctly
- **USE the existing** `"use client"` directive at the top of the file
- **REUSE existing** UI components from `src/components/ui/` - don't recreate them
- **FIX any** import errors by ensuring paths are correct (use `@/` alias for src)
- **KEEP** the file at `src/pages/Dashboard.tsx` - don't rename or move it
- The Dashboard is wrapped by `src/app/(app)/layout.tsx` which provides the sidebar - you only need to implement the main content area

---

Good luck! The screenshots provide all the visual details you need. Focus on matching the design exactly, and the result will be a beautiful, functional Dashboard ready to showcase! 🚀






















