# 08 — Marketing (Creative Studio)

> The creative studio. Content Agents produce, Campaign Agents optimize, and the page evolves from a single social queue to a full-service marketing department as the business grows.

---

## Vision

Marketing is where most small businesses drown. They know they need content, campaigns, and a social presence — but the execution overhead is crushing. A blog post takes half a day. Social media is a guilt-ridden afterthought. Ad campaigns get set up once and forgotten.

GalaxyCo's Marketing module is a creative studio staffed with agents. The user is the creative director — they set the tone, approve the work, and let the studio produce. The module starts simple and grows with the business.

---

## Two Views

### Marketing View (Traditional)

Content calendar, campaign manager, social queue, analytics charts. For users who want to manually create content, schedule posts, build campaigns, or fine-tune targeting.

### Agent-First View

Neptune as marketing director. What's performing, what needs creative direction, what's ready for approval.

**Top: Performance bar** — Engagement rate, content output this week, campaign ROAS, audience growth. Collapsed by default, expandable to full marketing dashboard with per-platform and per-campaign breakdowns.

**Main: Decision cards:**

- **Content approvals** — "Maya drafted 3 Instagram posts for this week. Preview and approve?" One-click approve-all or review individually.
- **Campaign performance** — "Your Google Ads search campaign CTR dropped 20%. Maya has 3 alternative headlines. See them?"
- **Content opportunities** — "Your competitor published a piece on [topic]. You have deeper expertise here. Want Maya to draft a response?"
- **Strategy nudges** — "Your email list grew 15% but you haven't sent a newsletter in 3 weeks. Want to schedule one?"
- **Budget alerts** — "Ad spend is 80% through this month's budget with 10 days left. Pause, extend, or reallocate?"
- **Channel unlocks** — "You connected LinkedIn last week. Maya drafted your first 3 posts. Preview?"

---

## Agent Roles

| Role | When Provisioned | What They Do |
|------|-----------------|-------------|
| **Content Agent** | Onboarding (if marketing is a priority) or Phase 2 when Neptune sees the need | All organic content: social posts, blog articles, email newsletters, website copy |
| **Campaign Agent** | When user starts paid ads, or Neptune identifies paid growth as a strategic opportunity | All paid campaigns: setup, targeting, creative, optimization, budget management |

Most businesses start with a Content Agent only. The Campaign Agent is proposed by Neptune when the time is right — not forced at onboarding.

---

## Content System

### Content Types

The Content Agent works across structured content types, each with defined formats and platform targets:

| Type | Format | Platforms | Agent Produces |
|------|--------|-----------|---------------|
| **Social post** | Caption (≤2200 chars IG, ≤280 chars X) + image suggestion or prompt + hashtags + scheduling metadata | Instagram, X, LinkedIn, Facebook, TikTok | Full draft including caption, hashtag set, posting time recommendation, image direction |
| **Carousel / multi-image** | 3-10 slides with individual captions + cover slide + CTA | Instagram, LinkedIn | Slide content, layout direction, cover copy |
| **Blog article** | 800-2000 words, SEO-optimized, structured with H2/H3, meta description, featured image direction | Blog (integrated), Medium, LinkedIn articles | Full draft with structure, meta description, internal/external link suggestions, keyword targeting |
| **Email newsletter** | Subject line, preview text, body (modular blocks), CTA | Connected email platform (Mailchimp, ConvertKit, etc.) | Full draft with subject line variants for A/B testing |
| **Email sequence** | Multi-email series with timing, conditional logic, goals | Connected email platform | Full sequence with send triggers, wait times, branch logic |
| **Website copy** | Page-specific: landing page hero, about section, service descriptions | User's site (if editable via integration) | Draft copy with structure notes |
| **Short-form video script** | Hook (3 sec), body (15-45 sec), CTA, caption | TikTok, Instagram Reels | Script, caption, hashtags. Video production is user-supplied. |

### Brand Voice Engine

The Content Agent doesn't just "write in brand voice" — it maintains a structured voice model that evolves:

**Initial Calibration (Onboarding):**
1. Intelligence Layer dossier provides: website copy analysis, social post tone, positioning language
2. Neptune conversation reveals: how the user talks about their business, formality level, industry jargon, personality
3. Agent synthesizes into a **Brand Voice Profile**: tone descriptors, vocabulary preferences, sentence structure patterns, do/don't rules

**Continuous Learning:**

| Signal | What Agent Learns |
|--------|------------------|
| User approves without edits | "This is on-voice. Weight this pattern higher." |
| User edits before approving | "The draft was close but this phrasing is preferred." Diff analysis captures the correction. |
| User rejects | "This missed the mark. Reduce weight on whatever pattern produced this." |
| Performance data (engagement, clicks) | "Posts with this tone/format perform better with this audience. Optimize toward what works." |
| Explicit direction | "Be more casual" / "Never use the word 'synergy'" → hard rules in the voice profile |

The voice profile is stored in the Knowledge module and accessible to all agents — Sales Agents use it for outreach, Finance Agents match tone in invoice reminders.

### Content Strategy Engine

The Content Agent doesn't randomly produce content. It operates from a **content strategy** that Neptune builds and maintains:

**Strategy Inputs:**
- **Demand signals** from Intelligence Layer — what the target audience is searching for, asking about, complaining about
- **Competitor content gaps** — topics competitors rank for that the user doesn't cover
- **SEO keyword map** — target keywords with search volume, difficulty, and current ranking
- **Historical performance** — which content types, topics, and formats perform best for this user
- **Calendar context** — seasonal events, industry dates, business milestones
- **Business goals** — is the user trying to grow audience, generate leads, build authority, or sell?

**Strategy Output:**
A rolling content plan that answers three questions:
1. **What** to create (topic, format, angle)
2. **When** to publish (optimal timing based on audience behavior + calendar)
3. **Why** this piece (the strategic reason: SEO gap, demand signal, competitor response, relationship nurture)

The agent follows this strategy autonomously. Neptune reviews and adjusts the strategy periodically — not individual pieces.

### Content Performance Feedback Loop

```
Content published
    → Agent tracks performance (engagement, clicks, shares, conversions, SEO ranking changes)
        → Performance data feeds back into:
            1. Voice model (what resonates)
            2. Content strategy (which topics/formats work)
            3. Posting schedule (optimal times refined)
            4. Neptune's narrative (surfaces wins and misses in Insights)
```

**Weekly strategy adjustment:** Every 7 days, the Content Agent reviews the last week's performance and adjusts the upcoming content plan. High-performing topics get more coverage. Underperforming formats get deprioritized. This happens silently — Neptune surfaces it only if the shift is significant: "Maya noticed your carousel posts get 3x the engagement of single images. She's shifting the mix."

---

## Campaign System

### Campaign Types

The Campaign Agent operates across structured campaign types:

| Type | Platform | What Agent Manages |
|------|----------|-------------------|
| **Search ads** | Google Ads | Keywords, ad copy, bidding strategy, negative keywords, quality score optimization |
| **Social ads** | Meta (FB + IG), LinkedIn, TikTok | Audience targeting, creative (image + copy), placement, budget pacing |
| **Retargeting** | Google Display, Meta | Audience segmentation (visited site, abandoned cart, engaged but didn't convert), creative, frequency capping |
| **Email nurture** | Connected email platform | Sequence design, segment targeting, send timing, branch logic, goal tracking |
| **Seasonal push** | Multi-platform | Coordinated campaign across search + social + email for a specific event (Black Friday, product launch, etc.) |
| **Referral / word-of-mouth** | Email + social | Referral program setup, incentive structure, automated ask timing |

### Campaign Lifecycle (Detailed)

```
1. OPPORTUNITY IDENTIFIED
   Neptune or agent detects:
   - Demand signal (audience searching for something the user offers)
   - Competitive gap (competitor isn't running ads in a space)
   - Seasonal timing (upcoming event relevant to the business)
   - User request ("I want to run a Google Ads campaign")
   - CRM signal (lead volume dropping → need top-of-funnel)

2. CAMPAIGN DESIGN
   Campaign Agent produces a campaign brief:
   - Objective (leads, sales, awareness, engagement)
   - Audience definition (demographics, interests, behaviors, lookalikes)
   - Creative (ad copy variants, image direction, format)
   - Budget (recommended daily/weekly spend with expected outcomes)
   - Duration (start/end or ongoing with review checkpoints)
   - Success metrics (target CPA, ROAS, CTR, conversion rate)

3. USER APPROVAL
   Campaign brief surfaces as a decision card.
   User approves, adjusts, or rejects.

4. LAUNCH
   Agent creates campaign on connected platform via API.
   Initial creative goes live with A/B variants.

5. OPTIMIZATION (Continuous)
   Agent monitors performance hourly/daily:
   - Winning creative variants get more budget
   - Losing variants are paused
   - Bids adjusted based on time-of-day and conversion patterns
   - Audience segments refined based on conversion data
   - New creative variants generated when fatigue is detected (CTR declining)

6. INTERVENTION TRIGGERS
   Agent surfaces to user when:
   - Performance significantly below target (>25% miss on primary metric)
   - Budget pacing issue (burning too fast or too slow)
   - Creative fatigue detected (engagement declining despite optimization)
   - Unexpected spike (something is working way better than expected — scale opportunity)

7. COMPLETION / RENEWAL
   Campaign ends or hits review checkpoint:
   - Agent produces performance summary
   - Neptune narrates results and recommends next steps
   - Learnings feed back into future campaign design
```

### Campaign Optimization Logic

The Campaign Agent doesn't just "optimize" — it follows structured decision trees:

| Signal | Agent Action |
|--------|-------------|
| CTR below target, impressions fine | Creative issue → generate new ad copy/image variants, A/B test |
| CTR fine, conversion rate low | Landing page or offer issue → surface to user with diagnosis |
| CPA rising steadily | Audience fatigue → broaden targeting or refresh audience segments |
| One variant significantly outperforming | Scale winner: increase budget allocation, pause losers |
| Budget pacing ahead of schedule | Reduce daily cap or tighten bidding to stretch budget |
| Budget pacing behind schedule | Increase bids or broaden targeting to increase delivery |
| Day/time patterns emerge | Shift budget to high-converting windows (dayparting) |
| Competitor enters same auction | Detected via CPC increase → adjust strategy, surface to user if significant |

---

## Module Evolution (Trust Arc)

The Marketing page isn't static — it grows with the business:

### Phase 1: Simple Studio
- One Content Agent drafting social posts
- Content calendar with basic scheduling
- Manual platform publishing (agent drafts, user copy-pastes) unless integrations connected
- Agent-first view: mostly content approvals

### Phase 2: Growing Operation
- Content Agent producing across multiple formats (social, blog, email)
- Connected platforms → direct publishing
- Content strategy engine active — agent proactively identifies topics and opportunities
- Performance feedback loop running — agent adapts based on what works
- Neptune may propose Campaign Agent if paid growth makes sense

### Phase 3: Full Marketing Department
- Content Agent + Campaign Agent working in coordination
- Multi-platform campaigns (search + social + email coordinated)
- Sophisticated A/B testing and optimization
- Content strategy driven by deep performance data + demand signals
- Agent-first view: strategic decisions, not just approvals

### Phase 4: Marketing Machine
- Agents running autonomously with minimal approval
- Seasonal campaigns planned and executed proactively
- Cross-department integration mature: marketing ↔ CRM attribution loop closed
- Neptune shifts from tactical to strategic: "Here's the Q4 marketing plan. Three campaigns, content calendar, budget allocation. Sign off?"

**Key principle:** The user never sees features they don't need yet. A solo e-commerce founder in Phase 1 sees a simple content queue. A growing agency in Phase 3 sees a full marketing operation. The page adapts — it doesn't overwhelm.

---

## Autonomy Model

Content carries brand reputation. The autonomy model is more conservative than CRM:

- **Default:** Agent drafts all content and campaign creative → user approves before publish/launch
- **Autonomy toggle:** Agent publishes routine content that matches established patterns (social posts similar to previously approved ones). New content types, new platforms, campaign launches, and high-spend actions still surface.
- **Always surfaces regardless of autonomy mode:**
  - First post on any new platform
  - Campaign launches and budget increases
  - Content on sensitive topics (detected by agent)
  - Any content format the agent hasn't produced before for this brand
  - Creative that deviates significantly from the voice profile

---

## Cross-Department Integration

| From | What Marketing Receives |
|------|------------------------|
| **CRM** | Lead source attribution → which channels produce the best leads (not just the most) |
| **Intelligence Layer** | Demand signals, competitor content gaps, trending topics, keyword opportunities |
| **Finance** | Marketing budget actuals and ceiling, spend tracking, ROI calculations |
| **Knowledge** | Brand voice profile, past content performance, company expertise areas |

| To | What Marketing Sends |
|----|---------------------|
| **CRM** | Lead attribution → "This lead came from Google Ads campaign X, keyword Y" |
| **Insights** | Campaign performance, content engagement, audience growth, channel ROI |
| **Finance** | Ad spend actuals, content production costs |
| **Knowledge** | Published content library, performance data, brand voice evolution |

---

## Neptune as Marketing Director

| Situation | Neptune Does |
|-----------|-------------|
| Content performing well | "Maya's carousels are getting 3x engagement. She's shifting the content mix to match." |
| Content underperforming | "Blog traffic dropped — topics aren't matching search intent. Maya has new angles from your SEO gaps." |
| Campaign winning | "Your Google Ads search campaign is converting at 2x target CPA. Want to scale the budget?" |
| Campaign struggling | "Meta retargeting is underperforming. Audience might be too narrow. Maya is testing broader segments." |
| Competitor moves | "Your competitor launched a content series on [topic]. You have deeper expertise. Response series ready for review." |
| Seasonal opportunity | "Black Friday is 6 weeks out. Campaign plan ready — 3 email sequences, social push, Google Ads burst. Budget: $X. Review?" |
| Channel recommendation | "Your ideal clients are on LinkedIn but you're not posting there. 2-week pilot plan ready." |
| Strategy evolution | "Your referral leads close 3x faster. Marketing should feed this — want Maya to build a referral ask sequence?" |

---

## Data Model Enhancements

| Addition | Purpose |
|----------|---------|
| `createdByAgentId` | Which agent produced this content/campaign |
| `brandVoiceProfileId` | Link to current voice model version |
| `contentSourceSignal` | What triggered creation (demand signal, competitor gap, calendar, user request, strategy engine) |
| `contentType` | Structured enum: social_post, carousel, blog_article, email_newsletter, email_sequence, website_copy, video_script |
| `platformPublishStatus` | Per-platform publish tracking with timestamp and engagement snapshot |
| `campaignType` | Structured enum: search_ads, social_ads, retargeting, email_nurture, seasonal_push, referral |
| `campaignBrief` | Structured campaign design document (objective, audience, creative, budget, metrics) |
| `campaignAgentActions` | Log of every automated optimization with reasoning |
| `performanceFeedback` | Engagement/conversion data linked back to content and campaign records |
| `strategyPlanId` | Link to the content strategy driving this piece |

---

## Open Questions

1. **Image generation:** Content Agents write copy. For visuals: AI image generation (DALL-E, Midjourney API) for social posts? User-supplied brand assets with agent-applied templates? Both? Recommendation: template-based graphics from brand assets as default, AI generation as an opt-in capability.

2. **Video content:** TikTok and Reels require video. Agent can script, caption, and schedule — but video production is a different capability. Recommendation: agent handles everything except the video file itself. Future: AI video generation as capability matures.

3. **SEO depth:** Content-level SEO (keywords, structure, meta descriptions, internal linking) is the Content Agent's job. Technical SEO (site speed, schema markup, crawlability) is outside scope — belongs to a specialist agent or external tool.

4. **Multi-brand support:** Agencies managing client brands need per-client voice profiles, content calendars, and campaign accounts. Architecture should support this from day one even if the UI doesn't expose it until later.

5. **Attribution modeling:** First-touch vs. last-touch vs. multi-touch attribution for lead source tracking. This is an Insights concern more than Marketing, but the data collection happens here.

---

*This spec depends on: `00-philosophy.md` (modules as departments), `01-intelligence-layer.md` (demand signals, competitor content gaps), `04-neptune.md` (marketing director behavior), `05-agents.md` (agent identity, autonomy model, activity toasts), `09-knowledge.md` (brand voice storage, content library)*
*This spec informs: `06-crm.md` (lead attribution), `07-finance.md` (marketing spend), `11-insights.md` (marketing analytics), `12-integrations.md` (platform connections)*
