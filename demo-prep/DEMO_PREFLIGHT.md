# DEMO PRE-FLIGHT CHECKLIST
## Complete This 30 Minutes Before Demo

---

## CRITICAL: AREAS TO AVOID

### Finance Demo Mode
- **DO NOT** navigate to `/finance?demo=true`
- **DO NOT** click "Preview Demo" button in Finance
- If showing Finance, only use if real integrations are connected
- Contains obvious fake data: "Demo Company LLC", "demo_acct_123", "demo-store.myshopify.com"

### Browser DevTools
- **KEEP CLOSED** during demo
- Some console.error statements exist (handled gracefully but look unprofessional)
- If someone asks to see code, open VS Code instead

---

## SAFE DEMO AREAS (Green Light)

| Area | Status | Notes |
|------|--------|-------|
| Dashboard | SAFE | Polished loading states |
| Neptune Assistant | SAFE | Pre-test one command |
| CRM Contacts | SAFE | Ensure data seeded |
| CRM Deals | SAFE | Kanban view looks great |
| Knowledge Base | SAFE | Upload 1-2 docs first |
| Settings | SAFE | Theme toggle works |

---

## 30-MINUTE COUNTDOWN

### T-30: Environment Check
- [ ] Open Chrome/Edge incognito
- [ ] Navigate to galaxyco.ai
- [ ] Log in and verify correct workspace
- [ ] Check dark mode is enabled (looks better on projector)
- [ ] Zoom level at 100%

### T-25: Data Verification
- [ ] CRM > Contacts: 5+ contacts visible
- [ ] CRM > Deals: 3+ deals in pipeline
- [ ] Knowledge: 1-2 documents visible
- [ ] Dashboard shows recent activity

### T-20: Neptune Test
- [ ] Open Neptune chat
- [ ] Type: "What can you help me with?"
- [ ] Verify response comes back in <3 seconds
- [ ] Clear chat history if it has old test messages

### T-15: Network & System
- [ ] Close all unnecessary tabs
- [ ] Close Slack/Discord/email
- [ ] Disable system notifications
- [ ] Test screen share if presenting remotely
- [ ] Mute phone

### T-10: Demo Flow Practice
- [ ] Navigate: Dashboard > Neptune > CRM > Knowledge
- [ ] Practice the first Neptune command once
- [ ] Make sure you know how to get back to Dashboard

### T-5: Final Prep
- [ ] DEMO_CHEAT_SHEET.md open on second screen or printed
- [ ] Water nearby
- [ ] Take a deep breath
- [ ] You've got this

---

## QUICK RECOVERY COMMANDS

If you need to create data live:

```
Add a contact named [Name] from [Company], email [email]
```

```
Create a deal for [contact] worth $[amount]
```

```
What's in my pipeline?
```

---

## EMERGENCY CONTACTS

If production is down:
1. Check Vercel dashboard for deployment status
2. Fallback: `cd galaxyco-ai-3.0 && npm run dev` (localhost:3000)
3. Same demo flow works locally

---

## POST-DEMO

- [ ] Thank attendees
- [ ] Send follow-up email within 2 hours
- [ ] Log meeting notes (use Neptune!)
- [ ] Update CRM with next steps

---

*Pre-flight complete? Review DEMO_MEETING_SCRIPT.md for your talking points.*
