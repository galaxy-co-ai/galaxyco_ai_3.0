# Instructions for Cursor Agents

Also see `AGENTS.md` (repo root) for the cross-agent, canonical setup commands and guardrails.

## ⚠️ CRITICAL: Document Size Management

### DO NOT add detailed implementation logs to:
- `README.md` - Keep it under 500 lines
- `PROJECT_STATUS.md` - Keep it under 300 lines

### WHERE to record implementation details:
- `docs/CONTENT_COCKPIT_HISTORY.md` - Update the phase table and brief summary
- The kickoff file itself serves as the historical spec

### When completing a phase:

1. **Update the history file** (1-2 lines):
   ```markdown
   | F | Guided Article Flow | abc1234 | Dec 9, 2025 |
   ```

2. **Update PROJECT_STATUS.md** (status only, ~5 lines max):
   ```markdown
   ## Content Cockpit Status
   - Phase F: Guided Flow ✅ Complete
   - Phase G: Use Case Studio 🚧 In Progress
   ```

3. **DO NOT** paste the full implementation details into README or PROJECT_STATUS

---

## File Reference

| File | Purpose | Max Size |
|------|---------|----------|
| `README.md` | Project overview, quick start | 500 lines |
| `PROJECT_STATUS.md` | Current status, active work | 300 lines |
| `AGENT_INSTRUCTIONS.md` | This file - how to behave | 100 lines |
| `docs/CONTENT_COCKPIT_HISTORY.md` | Phase completion history | Unlimited |
| `PHASE_*_KICKOFF.md` | Phase specs (planning + history) | ~200 lines each |

---

## When Starting a New Phase

1. Read the `PHASE_X_KICKOFF.md` file
2. Read `AGENT_INSTRUCTIONS.md` (this file)
3. **Skip** README.md and PROJECT_STATUS.md (too large, not needed)
4. Start implementing

---

## Code Standards Reminder

- Use `logger` not `console.log`
- Zod validation on all inputs
- NeptuneButton for all buttons
- ARIA labels for accessibility
- Mobile-first responsive design
- Conventional commits: `feat(content-cockpit): Phase X - description`







