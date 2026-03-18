# 13 — Settings & Admin (Mission Control)

> The control room. Neptune handles configuration conversationally, but Settings reflects every decision Neptune made and lets the user override anything. The source of truth the user can always inspect and control.

---

## Vision

Settings is the safety net, not the primary interface. Neptune configures the workspace through conversation — onboarding, calibration, and ongoing adjustments. But every configuration Neptune makes is reflected in Settings, fully visible, and overridable by the user.

The mental model: Neptune is the operations manager who set everything up. Settings is the file cabinet where every decision is documented. The user can open the cabinet, change anything, hit Save, and Neptune respects it.

---

## Core Principle: Neptune Acts, Settings Reflects

Every action Neptune takes that affects workspace configuration:

1. **Neptune executes** — changes the setting through the delegation layer
2. **Settings page updates** — the change appears immediately in the relevant section
3. **User can override** — any Neptune-configured setting has a manual override with a Save button
4. **Neptune respects overrides** — if the user manually sets something, Neptune won't change it back without asking

Settings shows a subtle indicator on Neptune-configured values: a small Neptune icon or "Set by Neptune" label. User-overridden values show "Custom" or the user's name. This makes it clear what's been auto-configured vs. manually set.

---

## Settings Sections

### Workspace

| Setting | Neptune Sets | User Overrides |
|---------|-------------|---------------|
| Workspace name | From onboarding dossier | Freely editable |
| Industry / vertical | From dossier analysis | Correction if Neptune got it wrong |
| Team size | From conversation | Updated as team grows |
| Timezone | From IP/browser | Manual correction |
| Default currency | From business location | Manual change |
| Logo / branding | Not set (user uploads) | Direct upload |

### Team & Roles

- Invite team members (email invite flow via Clerk)
- Role assignment: Owner, Admin, Member, Viewer (existing `userRoleEnum`)
- Per-member permissions for sensitive actions
- Neptune can suggest team invites: "You've been forwarding sales updates to sarah@company.com. Want to invite her to the workspace?"

### Agents

| Setting | Neptune Sets | User Overrides |
|---------|-------------|---------------|
| Agent roster (who exists) | Built during onboarding + growth | User can request add/remove through Neptune or here |
| Agent names | Assigned by Neptune | Rename freely |
| Agent budgets (monthly ceiling) | Calibrated from business size and plan tier | Adjust up or down |
| Autonomy mode (per-agent) | Default: draft-approve | Toggle to full autonomy per agent |
| High-risk thresholds | Defaults based on average deal size | Set custom dollar amounts |
| Toast notifications | On by default | Mute per-agent or globally |

### Integrations

- Connected apps with status (active, expired, error)
- Last sync time per integration
- Which agents use each connection
- Connect / disconnect / reconnect controls
- OAuth token status (healthy, expiring, failed)

### Neptune Personality

| Setting | Neptune Sets | User Overrides |
|---------|-------------|---------------|
| Verbosity | Calibrated from Living Profile | Slider: terse ↔ detailed |
| Formality | Calibrated from interaction style | Slider: casual ↔ professional |
| Assertiveness | Evolves with Trust Arc | Slider: deferential ↔ opinionated |
| Proactivity | Default: proactive | Slider: on-demand ↔ always surfacing |
| Update frequency | Default: morning + evening + events | Choose frequency |
| Domain emphasis | Balanced by default | Weight toward specific departments |

These sliders reflect Neptune's current calibration. The user can drag them and hit Save. Neptune adjusts immediately and permanently until the user changes it again or tells Neptune conversationally.

### Workflows

- Active workflows list with status (running, paused, draft)
- Execution history (last 10 runs per workflow, success/fail)
- Workflow toggle (pause/resume)
- Workflow edit launches Galaxy Studio editor
- Neptune-designed workflows marked as such — user can modify or delete

### Billing & Subscription

- Current plan (Free, Starter, Professional, Enterprise)
- Usage metrics (agents, actions, storage)
- Upgrade / downgrade controls
- Payment method (Stripe)
- Invoice history
- Neptune may surface upgrade conversations, but billing changes always require explicit user action here — never auto-upgraded

### Notifications

- Toast notification preferences (global on/off, per-agent mute)
- Email notification preferences (daily digest, real-time alerts, off)
- Mobile push preferences (when mobile app exists)
- Quiet hours (no notifications between X and Y)

### Data & Privacy

- Data export (full workspace export for portability)
- Data deletion (account deletion flow with confirmation)
- Integration data retention settings
- Dossier visibility (what Intelligence Layer data is stored about the user's business)

---

## Mission Control (System Admin)

For GalaxyCo's internal system admins — not workspace users. Accessible to emails in `SYSTEM_ADMIN_EMAILS` or users with `isSystemAdmin` metadata.

| Capability | Purpose |
|-----------|---------|
| Workspace overview | All workspaces, health status, plan, usage |
| User management | Cross-workspace user lookup, support tools |
| Agent fleet monitoring | Aggregate agent metrics, cost tracking, error rates |
| Intelligence Layer status | Deep Library stats, scouting queue, dossier counts |
| Feature flags | Enable/disable features per workspace or globally |
| Billing administration | Manual plan adjustments, credits, refunds |

Mission Control is an internal tool. It doesn't follow the two-view pattern — it's a traditional admin dashboard optimized for GalaxyCo's operations team.

---

## Save & Override Mechanism

### How It Works

Every setting in the UI follows this pattern:

1. **Current value displayed** — with source indicator ("Set by Neptune" or "Custom")
2. **User modifies value** — field becomes editable, Save button appears
3. **User clicks Save** — change is persisted immediately
4. **Change propagates** — affected agents receive updated configuration within seconds
5. **Neptune acknowledges** — on next interaction, Neptune reflects the change: "I see you changed the follow-up timing to 2 hours. I'll work with that."

### Configuration Change Propagation

When a setting changes, the system propagates to all affected components:

| Setting Changed | Propagates To |
|----------------|--------------|
| Agent budget | Paperclip cost controls → agent immediately respects new ceiling |
| Autonomy mode | Agent behavior layer → switches between draft-approve and auto-send |
| High-risk threshold | Decision card filter → recalculates which actions surface |
| Neptune personality | System prompt parameters → next Neptune response uses new calibration |
| Toast preferences | Notification system → immediately mutes/unmutes |
| Integration config | Agent connection layer → reconnects or disconnects |
| Workflow status | Trigger.dev scheduler → pauses or resumes execution |

Changes are instant — no "restart required" or "changes take effect next session."

### Neptune vs. User Override Logic

| Scenario | System Behavior |
|----------|----------------|
| Neptune sets a value, user hasn't touched it | Neptune can update freely (e.g., personality calibration evolves) |
| User overrides a Neptune-set value | Setting is "locked" from Neptune's perspective. Neptune won't change it without asking. |
| Neptune wants to change a locked setting | Neptune asks: "Your follow-up timing is set to 2 hours, but your data suggests 30 minutes would close more deals. Want me to adjust?" |
| User tells Neptune to change a setting conversationally | Setting updates AND lock status resets to "Neptune-managed" |
| User changes via Settings page AND conversation in same session | Most recent change wins. Source indicator updates accordingly. |

### Audit Log

Every configuration change is logged:

| Field | Content |
|-------|---------|
| `timestamp` | When the change happened |
| `setting` | Which setting changed (path: `agents.alex.budget`) |
| `previousValue` | Old value |
| `newValue` | New value |
| `changedBy` | `user`, `neptune`, or `system` (automatic, e.g., plan upgrade) |
| `reason` | Why (Neptune provides reasoning; user changes are "manual override"; system changes cite the trigger) |

Audit log is accessible from Settings (collapsible panel or dedicated tab). Useful for:
- Multi-user workspaces: "Who changed the budget?"
- Debugging: "Why did Neptune adjust the personality?"
- Accountability: clear record of every configuration decision

---

## Module Evolution (Trust Arc)

### Phase 1: Minimal Interaction
- User rarely visits Settings — Neptune handled everything during onboarding
- If they do visit, they see Neptune-configured values and understand the system is working
- Most common action: connecting an integration

### Phase 2: Exploring Controls
- User starts customizing — adjusting agent budgets, tweaking notification preferences
- Settings becomes the "what did Neptune set up?" reference
- Audit log starts accumulating useful history

### Phase 3: Active Management
- User confidently overrides Neptune where they have strong preferences
- Neptune personality sliders used to fine-tune communication style
- Multi-user workspaces: team management becomes active
- Integration management for multiple connected services

### Phase 4: Autopilot with Overrides
- Settings is mostly a read-only reference — the business runs itself
- User visits for billing, occasional preference changes, and periodic audit log review
- New settings only needed when business fundamentally changes (new service line, team restructure)

---

## Mobile

- Settings on mobile: simplified, focused on the most common adjustments (notifications, agent toggles, billing)
- Full settings available but with stacked layout instead of side-by-side sections
- Mission Control is desktop-only

---

## Open Questions

1. **Settings change history:** Should there be an audit log of who changed what, when? Useful for multi-user workspaces and for debugging Neptune's auto-configuration. Recommendation: yes, lightweight audit log accessible from Settings.

2. **Neptune configuration lock:** Should the user be able to lock specific settings so Neptune can't change them? Or is the override-and-Neptune-respects-it model sufficient?

3. **White-label settings (future):** For agencies using GalaxyCo for their clients — custom branding, sub-workspaces, client-facing dashboards. Not MVP but architecturally significant.

---

*This spec depends on: `04-neptune.md` (personality calibration), `05-agents.md` (agent management, budgets, toasts), `12-integrations.md` (integration management)*
*This spec informs: deployment and billing infrastructure*
