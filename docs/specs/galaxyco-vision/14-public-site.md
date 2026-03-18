# 14 — Public Site (galaxyco.ai)

> The front door. Landing page → value prop → pricing → sign-up. Gets prospects from "what is this?" to the sign-up form where Neptune takes over.

---

## Vision

The public site has one job: get the right people to the sign-up form. Everything from sign-up forward is covered in `02-onboarding-flow.md`. The site itself is a marketing funnel, not a product tour.

The site should feel like the product — intelligent, confident, not trying too hard. No "AI-powered" badge spam. No feature checkbox grids. The site sells the *experience* of having Neptune run your business, not a list of modules.

---

## Pages

### Landing Page

**Hero:** One sentence that captures the vision. Not "AI-powered business platform." Something closer to:

> "Tell Neptune about your business. It builds the team that runs it."

or

> "Your AI business partner. Not a tool — a company."

Followed by a single CTA: the sign-up form (email, password, URL — as spec'd in `02-onboarding-flow.md`).

**Below the fold — structured as a narrative scroll:**

| Section | Purpose | Content |
|---------|---------|---------|
| **1. The Experience** | Show what happens after sign-up | Visual narrative: "You sign up → Neptune researches your business → builds your team → agents start working → you wake up to results." Not a feature list — a story. Animated or illustrated sequence. |
| **2. Your Departments** | Position modules as departments, not features | 5-6 cards: "Your Sales Team" (not CRM), "Your Accountant" (not Finance), "Your Creative Studio" (not Marketing), "Your Company Brain" (not Knowledge), "Your Strategist" (not Insights). Each: one sentence + one visual showing agent work in action. |
| **3. How It's Different** | Contrast with traditional SaaS without naming competitors | Side-by-side: "Traditional tools: you do the work with software. GalaxyCo: you lead, Neptune and your agents do the work." 3-4 contrast pairs showing the paradigm shift. |
| **4. Social Proof** | Build trust | Testimonials, case studies, logos. For launch: GalaxyCo's own metrics (Mirror Test). "GalaxyCo uses GalaxyCo. Here's what our agents did last month." |
| **5. Pricing Teaser** | Reduce friction to pricing page | Quick tier summary (Free / Starter / Pro / Enterprise) with "See pricing →" link. Or inline if simple enough. |
| **6. Final CTA** | Catch the scroll-to-bottom visitor | Same sign-up form as hero. No new copy needed — the page did the convincing. |

### Conversion Funnel Logic

The page is designed for two visitor types:

| Visitor Type | Behavior | Page Serves Them |
|-------------|----------|-----------------|
| **High-intent** (heard about GalaxyCo, ready to try) | Lands on hero, signs up immediately | Hero CTA is prominent. Sign-up form is inline, not a separate page. Zero friction. |
| **Exploring** (curious, evaluating) | Scrolls through the page, reads the narrative, checks pricing | Each section answers the next objection: "What is this?" → "How does it work?" → "What makes it different?" → "Who uses it?" → "How much?" → "Let me try it." |

**No dead ends.** Every section has a CTA or a natural scroll to the next section. The page is a funnel, not a brochure.

### Pricing Page

| Tier | Price | What You Get |
|------|-------|-------------|
| **Free** | $0 | 2 agents, limited actions/day. Full onboarding. Enough to experience the product. |
| **Starter** | $X/mo | 5 agents, moderate usage. For solo operators getting started. |
| **Professional** | $X/mo | 15 agents, higher capacity, burst scaling. For growing businesses. |
| **Enterprise** | Custom | Unlimited agents, dedicated capacity, custom integrations, priority support. |

Pricing details (actual dollar amounts, feature breakdowns) are a business decision, not a spec decision. The structure follows the agent-based model — you're paying for a team size, not feature access.

### Sign-Up Page

Covered fully in `02-onboarding-flow.md`. The public site's sign-up page IS the onboarding entry point:

- Email + password + company URL (required)
- Optional fields (subtle, expandable)
- Submit → Activation Search → Neptune conversation

### Blog (Optional at Launch)

If the Mirror Test is real, GalaxyCo's Content Agent produces blog content for galaxyco.ai. The blog is both a marketing channel and a proof point — "This content was created by our Content Agent."

---

## Design Principles

- **Confident, not loud.** The site should feel like Neptune's personality — warm, direct, competent. No aggressive animations, no feature-spam, no "TRY IT FREE!!!" banners.
- **Dark theme consistent with the product.** The Nebula palette carries from the marketing site into the product. No jarring transition from light marketing site to dark product.
- **Mobile-first.** Agency owners and e-commerce founders browse on their phones. The landing page must be excellent on mobile.
- **Fast.** Static or near-static. No heavy JavaScript bundles for a marketing page. Next.js static export or a separate lightweight site.

---

## SEO & Content Strategy

The public site's SEO strategy is informed by the Intelligence Layer's Demand Signal Agent (see `01-intelligence-layer.md`):

- **Target keywords:** What the target market is searching for (CRM for agencies, AI business tools, small business automation, etc.)
- **Content gaps:** Topics competitors rank for that GalaxyCo doesn't
- **Pain point content:** Blog posts addressing the exact problems the Demand Signal Agent surfaces from Reddit, Twitter, and community monitoring

This is the Mirror Test in action — GalaxyCo's own Marketing Agent runs GalaxyCo's content strategy.

---

## Technical Considerations

- The public site may be a separate deployment from the main app (different performance and caching requirements)
- Or it may be the existing Next.js app's public routes (current architecture: `/`, `/pricing`, `/features`, `/blog` are public in middleware)
- Decision: optimize for simplicity at launch. Use existing Next.js public routes. Separate deployment only if performance demands it.

---

## Open Questions

1. **Video content:** Should the landing page include a product demo video? Or is the "sign up and experience it" approach stronger? Recommendation: short (~60 second) video showing the onboarding experience. Not a feature tour — a narrative.

2. **Competitive positioning:** How directly do we call out competitors (HubSpot, Monday, Notion, etc.)? Recommendation: don't name them. Position GalaxyCo as a different category entirely. "This isn't a better CRM. This is your AI business partner."

3. **Launch strategy:** Waitlist → beta → public? Or straight to public with a free tier? The free tier model allows immediate sign-up and lets the product sell itself through the onboarding experience.

---

*This spec depends on: `00-philosophy.md` (positioning, target market, Mirror Test), `02-onboarding-flow.md` (sign-up flow)*
*This spec informs: marketing strategy, growth planning*
