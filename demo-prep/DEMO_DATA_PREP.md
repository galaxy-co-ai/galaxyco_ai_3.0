# Demo Data Preparation Guide
## GalaxyCo.ai Demo | 1:00 PM EST

---

## PRE-DEMO DATA SEEDING

Use Neptune to seed realistic demo data. Run these commands 30 minutes before the demo.

### Step 1: Create Demo Contacts (5 key contacts)

Open Neptune and enter each command:

**Contact 1 - Primary Demo Contact:**
```
Add Sarah Chen as a contact. She's VP of Engineering at TechFlow, email sarah@techflow.io, phone 415-555-0142. Tag her as "hot lead" and "enterprise". Note: Met at AI Summit, very interested in workflow automation.
```

**Contact 2 - Active Deal:**
```
Add Marcus Rodriguez as a contact. He's CEO at GrowthLabs, email marcus@growthlabs.co, phone 212-555-0198. Tag as "decision-maker" and "Q1-priority". Note: Referred by existing customer, ready for proposal.
```

**Contact 3 - Design Agency:**
```
Add Emma Watson as a contact. She's Creative Director at PixelForge Design, email emma@pixelforge.design, phone 310-555-0234. Tag as "agency" and "warm". Note: Interested in client management features.
```

**Contact 4 - Enterprise Prospect:**
```
Add James Park as a contact. He's CTO at DataScale, email james.park@datascale.io, phone 650-555-0187. Tag as "enterprise" and "technical-buyer". Note: Evaluating against Salesforce, needs security docs.
```

**Contact 5 - Referral:**
```
Add Lisa Thompson as a contact. She's Operations Manager at SwiftStart, email lisa@swiftstart.io, phone 512-555-0156. Tag as "smb" and "referral". Note: Heard about us from Marcus at GrowthLabs.
```

---

### Step 2: Create Demo Organizations

```
Create an organization called TechFlow. Industry: SaaS, size: 50-200 employees, website: techflow.io. Annual revenue around $5M.
```

```
Create an organization called GrowthLabs. Industry: Marketing Agency, size: 10-50 employees, website: growthlabs.co. Annual revenue around $2M.
```

```
Create an organization called DataScale. Industry: Data Infrastructure, size: 200-500 employees, website: datascale.io. Annual revenue around $25M.
```

---

### Step 3: Create Demo Deals

```
Create a deal called "TechFlow Enterprise Pilot" worth $48,000. Stage: Proposal. Associate with Sarah Chen. Expected close date: end of this month. Notes: 50-seat pilot, potential expansion to 200.
```

```
Create a deal called "GrowthLabs Full Platform" worth $24,000 annually. Stage: Negotiation. Associate with Marcus Rodriguez. Expected close date: next week. Notes: Ready to sign, finalizing terms.
```

```
Create a deal called "DataScale Security Review" worth $150,000. Stage: Qualification. Associate with James Park. Notes: Enterprise deal, requires SOC2 documentation and security review.
```

---

### Step 4: Add Knowledge Base Documents

Upload these files to Knowledge Base before the demo:
- A sample proposal PDF (rename to "GrowthLabs_Proposal_v2.pdf")
- A pricing sheet (rename to "GalaxyCo_Pricing_2024.pdf")
- A security/compliance doc (rename to "Security_Overview.pdf")

If you don't have files ready, use Neptune:
```
Create a knowledge document called "GalaxyCo Pricing Guide" with our standard pricing tiers: Starter at $49/user/month, Professional at $99/user/month, Enterprise at custom pricing. Include features for each tier.
```

---

### Step 5: Create a Sample Task

```
Create a task: "Prepare TechFlow security documentation" due this Friday. High priority. Assign to me. Notes: James needs SOC2 compliance docs before enterprise evaluation.
```

---

### Step 6: Add Recent Activity

Run a few Neptune commands to generate activity:

```
Log a note for Sarah Chen: Had a 30-minute discovery call. She's impressed with Neptune's capabilities. Main pain point is tool fragmentation - they use 6 different apps. Ready for demo next week.
```

```
Log a note for Marcus Rodriguez: Sent final proposal. He's reviewing with his team. Decision expected by Friday.
```

---

## DEMO DATA VERIFICATION CHECKLIST

Before the demo, verify:

- [ ] **Contacts:** 5+ contacts visible in CRM
- [ ] **Organizations:** 3+ organizations created
- [ ] **Deals:** 3+ deals in pipeline (different stages)
- [ ] **Knowledge:** At least 1-2 documents uploaded
- [ ] **Tasks:** At least 1 task visible
- [ ] **Activity Feed:** Recent activity showing

### Quick Verification Commands

Open Neptune and ask:
- "How many contacts do I have?"
- "Show me my active deals"
- "What tasks are due this week?"

---

## PRODUCTION ENVIRONMENT CHECKLIST

### 15 Minutes Before Demo:

- [ ] Log into production at galaxyco.ai
- [ ] Verify you're on the correct workspace
- [ ] Test Neptune with a simple query: "What can you help me with?"
- [ ] Check network connection is stable
- [ ] Clear browser cache if anything looks stale
- [ ] Disable browser notifications
- [ ] Close unnecessary browser tabs
- [ ] Have backup phone hotspot ready

### Browser Setup:

1. Use Chrome or Edge (latest version)
2. Set zoom to 100%
3. Enable dark mode (looks more polished on projector)
4. Incognito mode recommended (clean UI, no extensions)

### Fallback Plan:

If production has issues:
1. Have local dev environment ready: `npm run dev`
2. Know the local URL: http://localhost:3000
3. Same demo data should be seeded locally

---

## DEMO FLOW QUICK REFERENCE

### Demo 1: Neptune (7 min)
1. "Add Sarah Chen from TechFlow..."
2. "Schedule a meeting with Sarah..."
3. "What did I just ask you to do?"

### Demo 2: Platform Tour (6 min)
1. CRM > Contacts > Show Sarah
2. Finance Dashboard
3. Knowledge Base search
4. Show orchestration point

### Demo 3: Technical Depth (5 min)
1. Talk architecture
2. Mention: Next.js 16, React 19, TypeScript strict, zero errors
3. Multi-tenancy, row-level security
4. Multi-model AI, 37 tools

---

## EMERGENCY DATA COMMANDS

If you need to create data live during the demo:

**Quick contact:**
```
Add John Demo from Acme Corp, email john@acme.com
```

**Quick deal:**
```
Create a deal for John Demo worth $10,000, stage: discovery
```

**Quick task:**
```
Create a task: Follow up with John tomorrow
```

---

*Prep complete? Review DEMO_MEETING_SCRIPT.md for your talking points.*
