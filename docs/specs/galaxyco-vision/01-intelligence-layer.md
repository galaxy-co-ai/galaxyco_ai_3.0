# 01 — Intelligence Layer

> The engine that powers everything. Neptune's knowledge, the Deep Library, prospect intelligence, demand signals, and the data architecture that makes onboarding feel like magic.

---

## Vision

Neptune doesn't start learning when a user signs up. By the time someone sits down with Neptune for the first time, Neptune has been studying their company, their market, their competitors, and the pain points of businesses like theirs for weeks or months. The Intelligence Layer is what makes this possible.

It is not a feature users see. It is the invisible foundation that makes Neptune feel omniscient — not through surveillance, but through diligent, continuous research done by a dedicated team of intelligence agents.

## Architecture Overview

### Three Tiers

```
Tier 1: Deep Library          (Always running. No user required.)
    ↓
Tier 2: Activation Search     (Triggered at signup. Pulls the file + real-time enrichment.)
    ↓
Tier 3: Living Profile         (User is active. Every interaction deepens the profile.)
```

### Who Does What

| Role | Actor | Responsibility |
|------|-------|---------------|
| **Scouting** | Scout Agents (Paperclip) | Scrape, crawl, gather raw data from public sources |
| **Analysis** | Analyst Agents (Paperclip) | Synthesize raw data into structured dossiers, score prospects, identify patterns |
| **Demand Sensing** | Demand Signal Agent (Paperclip) | Monitor communities, forums, reviews, search trends for market pain points |
| **Competitive Intel** | Competitive Analyst Agent (Paperclip) | Track competitor platforms — features, pricing, positioning, talent moves |
| **Industry Watch** | Industry Analyst Agent (Paperclip) | Monitor trade publications, trends, seasonal patterns |
| **Strategic Use** | Neptune | Read finished dossiers, use intelligence in conversation, apply Iceberg Principle |

Neptune never scrapes, parses, or enriches. Neptune reads the finished product and wields it masterfully.

---

## Tier 1: The Deep Library

### What It Is

A continuously growing intelligence database of companies in GalaxyCo's target market. Built and maintained by Paperclip agents running scheduled reconnaissance. The library compounds over time — by launch, it should contain thousands of pre-researched company profiles.

### Who Gets Scouted

**Active scouting targets:**
- Companies in target verticals (agencies, e-commerce) within target geographies
- Visitors to GalaxyCo's website (identified via reverse IP, referrer data, or UTM tracking)
- Bounce-backs (visited but didn't sign up)
- 2nd-degree connections of active users (business partners, clients, vendors in related industries)
- Companies mentioned in industry publications or community discussions

**Scouting priority tiers:**

| Tier | Who | Refresh Cadence | Depth |
|------|-----|----------------|-------|
| **Hot** | Visited site, in signup funnel, 2nd-degree of active user, showed intent signals | Weekly | Full dossier (all 9 source categories) |
| **Warm** | In target market, scouted once, matches ICP profile | Monthly | Core dossier (categories 1-6) |
| **Cold** | Broad industry scrape, low intent signals | Quarterly | Skeleton dossier (categories 1-3) |

Event-driven triggers override the schedule: if a cold prospect suddenly posts a job listing for a marketing coordinator, or their Google rating drops, or they appear in a community thread asking for help — they get bumped to warm or hot and re-scouted immediately.

### Dual Purpose

The Deep Library serves two masters from the same database:

1. **GalaxyCo's own growth engine** — Scout agents feed GalaxyCo's CRM. The Nurture Agent uses dossier data for personalized outreach. The Content Agent writes about topics the market cares about. This is the Mirror Test in action.

2. **Customer onboarding** — When any company signs up, Neptune searches the Deep Library first. If they're already in there (likely, if they visited the site), Neptune pulls the existing dossier instead of starting research from scratch.

One database. Two access patterns. Zero duplicate work.

---

## Tier 2: Activation Search

### Trigger

User enters their company URL during the GalaxyCo sign-up flow.

### Process

```
1. Search Deep Library for existing dossier
   ├── Found (hot/warm) → Pull dossier, run real-time gap-fill
   └── Not found → Run full real-time research suite

2. Real-time enrichment (runs regardless, fills gaps)
   ├── Fresh website scrape (may have changed since last scout)
   ├── Current social media snapshot
   ├── Latest reviews and ratings
   ├── Current SEO positioning check
   └── Competitor refresh

3. Synthesize into Neptune-ready dossier
   ├── Structured data (company profile, metrics, scores)
   ├── Narrative summary (Neptune's briefing document)
   └── Conversation seeds (questions Neptune should ask, things to confirm)

4. Score dossier completeness
   ├── Green (7+ categories populated) → Neptune is ready
   ├── Yellow (4-6 categories) → Neptune proceeds but asks more discovery questions
   └── Red (<4 categories) → Neptune leads with more open exploration
```

### Timing

The Activation Search must complete before the user reaches Neptune's first conversation screen. This means:

- **If the user was in the Deep Library**: Research is mostly done. Gap-fill takes seconds. Neptune is ready instantly.
- **If the user is brand new**: Full research suite runs during the sign-up flow (account creation, email verification, workspace setup). Target: complete within 60-90 seconds. If it takes longer, Neptune starts the conversation with what it has and enriches in the background.

### Conversation Seeds

The Activation Search doesn't just produce data — it produces **strategic conversation starters** for Neptune. These are pre-computed questions and observations designed to demonstrate knowledge while following the Iceberg Principle.

Example output for a Shopify e-commerce brand:

```json
{
  "confirm_first": [
    "Looks like you're running a DTC skincare line on Shopify — about 40 products, focused on organic ingredients. That right?",
    "Your Instagram is your strongest channel — 12K followers, good engagement. Is that where most of your customers find you?"
  ],
  "strategic_questions": [
    "A lot of brands your size mention that managing inventory across Shopify and Amazon is a headache. Is that something you're dealing with?",
    "Your SEO has some solid keywords but there's a gap around [specific term] that your competitor [name] is ranking for. Want me to look into that?"
  ],
  "avoid_revealing": [
    "Don't mention specific review text or reviewer names",
    "Don't quote exact follower counts — say 'solid following' instead",
    "Don't reference ad spend estimates — too invasive"
  ]
}
```

The `avoid_revealing` list is critical — it encodes the Iceberg Principle at the data level.

---

## Tier 3: Living Profile

### What Changes

Once a user is active, the dossier transitions from research-based to interaction-based enrichment:

| Source | What It Adds |
|--------|-------------|
| **Neptune conversations** | Communication style, decision patterns, priorities, things that excite them, things they dismiss |
| **Agent operational data** | Close rates, response times, campaign performance, invoice payment patterns |
| **User behavior** | Which modules they visit most, what they click, where they spend time, what they ignore |
| **Confirmations + corrections** | Every confirmation validates the dossier. Every correction improves it. Both are gold. |
| **Business evolution** | New products, new hires, new markets, seasonal shifts — detected through ongoing agent work |

### Profile Depth Over Time

| Phase | Profile Contains |
|-------|-----------------|
| **Day 0** (signup) | Public research dossier (Tier 2 output) |
| **Week 1** | + Confirmed/corrected business details, communication preferences, initial agent performance data |
| **Month 1** | + Decision patterns, operational metrics, engagement trends, refined competitor positioning |
| **Month 3** | + Seasonal patterns, growth trajectory, relationship dynamics (who the user trusts, what they delegate) |
| **Month 6+** | + Predictive models (likely next moves, churn risk, expansion opportunities), deep institutional knowledge |

---

## Data Source Architecture

### Source Categories

#### 1. Business Identity
**What:** Core company information — what they do, who they are, how they position themselves.

**Sources:**
- Company website (homepage, about, services/products, team, pricing pages)
- Google Business Profile
- LinkedIn company page
- Business registrations (where publicly available)

**Data points:** Company name, industry vertical, services/products offered, positioning statement, team size, founding year, location(s), brand voice characteristics.

#### 2. Reputation
**What:** How the market perceives them — sentiment, volume, patterns.

**Sources:**
- Google Reviews (rating, count, recent trend)
- Industry-specific platforms (Clutch, G2 for agencies; Trustpilot, Amazon reviews for e-commerce)
- BBB listing and rating
- Yelp (if applicable)

**Data points:** Average rating, review count, sentiment trend (improving/declining), common praise themes, common complaint themes, response rate to reviews.

#### 3. Social Presence
**What:** How they show up on social platforms — reach, engagement, content strategy.

**Sources:**
- Instagram (followers, posting frequency, engagement rate, content themes)
- Twitter/X (followers, activity, tone, topics)
- LinkedIn (company page followers, posting cadence, employee activity)
- TikTok (if present — followers, video performance)
- Facebook (page likes, posting activity)
- YouTube (if present — subscriber count, content themes)
- Pinterest (if e-commerce — pin volume, boards)

**Data points:** Platform presence map, follower counts (ranges, not exact), posting cadence, engagement rates, content style, strongest platform, weakest platform, growth signals.

#### 4. SEO / Search Positioning
**What:** How they're found through search — organic strength, keyword landscape, competitive gaps.

**Sources:**
- Domain authority signals (backlink profile indicators)
- Keyword ranking data (top ranking terms, position ranges)
- Organic vs. paid traffic balance (estimated)
- Content volume and freshness
- Technical SEO signals (page speed, mobile-friendliness)

**Data points:** Domain authority estimate, top 10 organic keywords, keyword gaps vs. competitors, content freshness score, technical health indicators.

**Note:** Full SEO tooling (Ahrefs, SEMrush) is expensive at scale. The Intelligence Layer should use a combination of free/open signals for broad scouting and targeted paid API calls for hot prospects and activation searches.

#### 5. Tech Stack
**What:** What tools and platforms they currently use — integration opportunities and migration paths.

**Sources:**
- BuiltWith / Wappalyzer / page source analysis
- Shopify app store (for Shopify brands — which apps they've installed)
- Job postings (often mention required tool experience)
- Website footer/integrations page

**Data points:** CMS/platform (Shopify, WordPress, Squarespace, etc.), email platform (Klaviyo, Mailchimp, etc.), analytics tools, CRM (if detectable), advertising platforms, payment processors, other SaaS tools.

#### 6. Competitive Landscape
**What:** Who they compete with, relative positioning, gaps and opportunities.

**Sources:**
- Same sources as categories 1-4, applied to detected competitors
- Industry directories and rankings
- Keyword overlap analysis
- Geographic and service overlap analysis

**Process:**
1. Identify top 3-5 competitors (geographic, service, and keyword overlap)
2. Build mini-dossiers on each (categories 1-4)
3. Generate comparative analysis (where the prospect is stronger/weaker)
4. Identify positioning gaps the prospect could exploit

**Data points:** Competitor list with brief profiles, relative strengths/weaknesses, positioning gaps, market share signals.

#### 7. Industry Trends
**What:** What's moving in their vertical — seasonal patterns, emerging topics, market shifts.

**Sources:**
- Trade publications and industry blogs
- Google Trends for vertical-specific terms
- Social listening on industry hashtags
- Conference/event calendars
- Regulatory or market structure changes

**Data points:** Top 3-5 current trends in their vertical, seasonal patterns (e.g., "Q4 e-commerce surge," "agency pitch season"), emerging opportunities, potential threats.

#### 8. Vertical-Specific Intelligence

**E-commerce:**
- Product catalog analysis (categories, depth, pricing strategy)
- Marketplace presence (Amazon, Etsy, etc.)
- Meta Ad Library / Google Ads transparency (active campaigns, creative direction)
- Shipping and fulfillment signals (speed, carriers, satisfaction)

**Agencies:**
- Portfolio/case study analysis (work quality, specialization, industries served)
- Behance/Dribbble presence
- Client logo analysis (who they serve, what size)
- Award listings and recognition
- Service packaging and pricing model

#### 9. Demand Signals
**What:** What the target market is asking for, struggling with, and wishing existed. Not company-specific — market-level intelligence.

**Sources:**
- **Reddit** (r/agency, r/ecommerce, r/shopify, r/digital_marketing, r/entrepreneur, r/smallbusiness)
- **Quora / StackExchange** (how-to questions, tool comparisons)
- **Twitter/X threads** (complaints about tools, "wish there was..." posts)
- **Facebook Groups** (Shopify Entrepreneurs, agency owner communities)
- **YouTube comments** on industry tutorials
- **G2/Capterra/Trustpilot reviews** of tools the target market uses (HubSpot, Klaviyo, Monday, etc.)
- **Job postings** across the vertical (roles being hired reveal gaps agents can fill)
- **Google autocomplete + People Also Ask** for vertical-specific queries

**Output:** The Pain Point Index — a ranked, continuously updated list of:
- What the target market is struggling with
- What tools they're frustrated with (and why)
- What roles they're trying to hire (agent opportunities)
- What questions they're asking (content opportunities)
- What they wish existed (product roadmap signals)

**Cadence:** Continuous collection, weekly synthesis into updated index.

**Three consumers:**
1. **Neptune's onboarding** — "A lot of agencies your size mention [pain point] — does that resonate?"
2. **GalaxyCo's product roadmap** — If the index keeps surfacing a need, that's a feature signal
3. **GalaxyCo's content strategy** — Write about what the market is actually asking about

---

## Dossier Data Model

### Company Dossier Schema (Conceptual)

```typescript
interface CompanyDossier {
  // Identity
  id: string;
  companyUrl: string;
  companyName: string;
  industry: 'agency' | 'ecommerce' | 'other';
  subVertical: string;                 // e.g., "marketing agency", "DTC skincare"
  positioning: string;                 // One-line positioning statement
  teamSize: string;                    // Range: "1-5", "6-15", "16-50", "50+"
  foundedYear?: number;
  locations: string[];

  // Scores & Status
  prospectTier: 'hot' | 'warm' | 'cold';
  dossierCompleteness: number;         // 0-100, based on source coverage
  readinessScore: number;              // How ready they are for GalaxyCo (0-100)
  lastFullRefresh: Date;
  nextScheduledRefresh: Date;

  // Source Data (each with timestamp of last update)
  reputation: ReputationData;
  socialPresence: SocialPresenceData;
  seoPositioning: SEOData;
  techStack: TechStackData;
  competitors: CompetitorData[];
  industryTrends: TrendData[];
  verticalSpecific: AgencyData | EcommerceData;

  // Activation & Onboarding
  conversationSeeds: ConversationSeed[];
  avoidRevealing: string[];            // Iceberg Principle guardrails
  suggestedAgentRoles: string[];       // What workforce Neptune should propose

  // Lifecycle
  source: 'scouted' | 'visitor' | 'signup' | 'referred';
  firstScouted: Date;
  signupDate?: Date;
  userId?: string;
  workspaceId?: string;

  // Living Profile (populated post-signup)
  interactionProfile?: InteractionProfile;
  operationalMetrics?: OperationalMetrics;
  decisionPatterns?: DecisionPatterns;
}
```

### Dossier Lifecycle

```
Scouted (cold/warm/hot)
    ↓ user visits site
Visitor (bumped to warm/hot)
    ↓ user signs up
Activated (Tier 2 enrichment runs)
    ↓ user starts using platform
Living (Tier 3 continuous enrichment)
```

### Storage Considerations

- **Pre-signup dossiers** exist outside the multi-tenant boundary. They are not workspace data — they are GalaxyCo's prospect intelligence. Stored in a shared intelligence schema.
- **Post-signup**, the dossier links to a workspace via `workspaceId`. The Living Profile data may live within the tenant's workspace for isolation, while the original research data remains in the shared intelligence schema.
- **Retention policy**: Cold dossiers with no engagement signals for 12+ months get archived. Hot/warm dossiers are maintained indefinitely. Post-signup Living Profiles are retained for the life of the account.

---

## Courier Model Strategy

### Cost-Tier Model Assignment

The Intelligence Layer runs thousands of inference calls for scraping analysis, dossier synthesis, and enrichment. Courier's self-hosted models provide massive cost advantages over commercial APIs.

| Task | Model Tier | Why |
|------|-----------|-----|
| **Raw data parsing** (extract structured info from scraped HTML) | Courier — small/fast (GPT-OSS 20b, Ministral 3 14B) | High volume, low complexity. Speed over brilliance. |
| **Dossier synthesis** (combine sources into narrative) | Courier — mid-tier (Qwen3.5 35B, EXAONE 4.0 32B, Devstral 2 24B) | Coherent writing + reasoning. 256K context for large inputs. |
| **Competitor analysis** (comparative reasoning) | Courier — mid-tier (Qwen3.5 35B, EXAONE 4.0 32B) | Analytical reasoning across multiple company profiles. |
| **Demand signal analysis** (sentiment, pattern detection) | Courier — mid-tier (Qwen3.5 35B, GLM 4.5 Air) | Pattern recognition across community posts. |
| **Conversation seed generation** (Neptune's briefing) | Commercial API — Claude or GPT-4 | Highest quality. These words come out of Neptune's mouth. |
| **Pain Point Index synthesis** | Courier mid-tier + commercial review | Weekly synthesis on Courier; final ranking reviewed by commercial model. |
| **SEO/keyword analysis** | Courier — small (GPT-OSS 20b) | Structured data processing, low complexity. |
| **Readiness scoring** | Courier — small (Ministral 3 14B) | Numerical scoring from structured inputs. |

**Principle:** Courier for all background intelligence work. Commercial APIs for user-facing output and high-stakes reasoning. 80-90% of Intelligence Layer inference on Courier. 10-20% on commercial APIs.

Detailed per-model costs to be incorporated after Courier platform deep scrape report.

---

## Freshness & Refresh Strategy

### Tiered Refresh Schedule

| Tier | Refresh Cadence | Trigger for Upgrade |
|------|----------------|-------------------|
| **Hot** | Weekly full refresh | Visited site, in funnel, 2nd-degree connection, intent signal |
| **Warm** | Monthly core refresh | In target market, ICP match, previously scouted |
| **Cold** | Quarterly skeleton refresh | Broad industry scrape, no intent signals |

### Event-Driven Triggers

Between scheduled refreshes, monitor for signals that warrant immediate re-scouting:

| Signal | Source | Action |
|--------|--------|--------|
| New Google review appears | Review monitoring | Refresh reputation data |
| Website structure changes | Periodic crawl diff | Refresh identity + tech stack |
| New job posting detected | Job board monitoring | Refresh team size + analyze role (agent opportunity?) |
| Social media spike | Social monitoring | Refresh social presence data |
| Competitor makes a move | Competitive monitoring | Refresh competitive landscape for affected prospects |
| Prospect visits GalaxyCo site | Analytics/tracking | Bump to hot, full refresh |
| Prospect mentioned in community | Demand signal monitoring | Bump tier, refresh relevant sections |

### Activation Always Tops Up

Regardless of dossier freshness, the Activation Search (Tier 2) always runs a real-time enrichment pass at signup. This ensures data is current as of the moment Neptune meets the user.

---

## Neptune's Role (Iceberg Principle Applied)

### What Neptune Knows vs. Says

| Neptune Knows | Neptune Says | Why |
|--------------|-------------|-----|
| Exact Google rating (4.7), dropped from 4.8 | "How are you feeling about your online reputation?" | Opens the door without revealing depth |
| Competitor X just launched a campaign | "Your market's getting more competitive — are you seeing that?" | Market awareness, not stalking |
| They posted a job for a marketing coordinator | "Sounds like your team might be stretched on the marketing side" | Infers pain without revealing source |
| Shopify store has 40 products, $20-$80 range | "Solid product line — mid-range pricing, focused catalog" | Confirms without creepy precision |
| Reddit posts from similar agencies complain about reporting | "A lot of agencies your size mention reporting is a time sink — does that hit home?" | Demand signals without citing sources |
| Instagram engagement dropped 30% last month | "Your social presence is solid but there might be room to tighten up engagement" | Directional, not metric-specific |

### The `avoid_revealing` Guardrails

Every dossier includes guardrails — things Neptune should NOT say directly:

**Always avoid:**
- Quoting exact follower counts, revenue estimates, or traffic numbers
- Naming specific reviewers or review text
- Referencing specific social media posts by content
- Mentioning ad spend estimates
- Citing specific job posting details
- Revealing that a competitor was researched in depth
- Referencing community posts by username or thread

**Rule:** If it would make the user ask "how do you know that?" in a concerned way — don't say it. Frame as market knowledge, industry pattern, or general observation.

---

## GalaxyCo's Own Intelligence Operations (Mirror Test)

GalaxyCo runs this exact Intelligence Layer for its own business:

### GalaxyCo's Intelligence Workforce

| Agent | What It Does for GalaxyCo |
|-------|--------------------------|
| **Market Scout** | Scrapes target market (agencies + e-commerce), builds Deep Library |
| **Competitive Analyst** | Tracks HubSpot, Monday.com, Salesforce, Notion, Jasper, Copy.ai |
| **Industry Analyst** | Monitors SaaS/AI industry trends, PLG patterns, agent automation news |
| **Demand Signal Agent** | Monitors Reddit, Twitter, communities for what small businesses need |

### The Growth Loop

```
GalaxyCo's agents scout prospects
    → Build dossiers in the Deep Library
        → Nurture agent sends personalized outreach using dossier data
            → Prospect visits GalaxyCo → dossier bumped to hot
                → Prospect signs up → Neptune pulls the file → magical onboarding
                    → User's agents start working → their work touches clients/partners
                        → Those contacts become new scouting targets → library grows
                            → Loop repeats
```

Every active user compounds the intelligence base.

---

## Open Questions

1. **Legal review needed:** Which data sources require explicit legal review for GDPR/CCPA compliance? Scraping public websites is generally permissible, but storing PII in dossiers pre-signup needs careful handling.

2. **Courier model benchmarking:** Once the Courier deep scrape report is received, benchmark specific models against each task type. Which model produces the best dossier synthesis? Which is fastest for raw parsing?

3. **Cold start problem:** Before the Deep Library has critical mass, early users hit Activation Search with no existing dossier. Real-time research must complete during signup flow. Target: 60-90 seconds max.

4. **Dossier accuracy validation:** How do we measure accuracy? The confirmation/correction loop during onboarding provides signal, but we need systematic accuracy tracking and improvement.

5. **Rate limiting and source sustainability:** High-volume scraping of review sites, social platforms, and job boards may hit rate limits or ToS issues. Need source-by-source sustainability analysis.

6. **Demand Signal Agent scope:** How broad should community monitoring be? Start with top 10-15 sources per vertical and expand based on signal quality.

---

*This spec depends on: `00-philosophy.md` (principles, target market, Mirror Test, Iceberg Principle)*
*This spec informs: `02-onboarding-flow.md`, `04-neptune.md`, `05-agents.md`, `14-public-site.md`*
