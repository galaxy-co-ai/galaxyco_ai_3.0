# Browser Agent Task: Courier Platform Deep Scrape

## Objective
Produce a comprehensive markdown report of everything available on the Courier platform at `courier.thinkrecursion.ai` and its documentation. The report must be detailed enough for an AI architect to design a multi-model inference strategy using Courier as the backbone.

## Sites to Scrape

### 1. Courier Dashboard (`courier.thinkrecursion.ai`)

**Dashboard Page:**
- Screenshot and document any usage stats, quotas, or limits displayed

**Model Workbench (main page):**
- List EVERY model currently deployed in the workbench
- For each model capture: display name, underlying model ID, quantization (e.g. 4-BIT), mode (STATIC vs FLEX), context window size, deployment type (COURIER CLOUD vs SHARED)
- Note which models are currently active vs available to add

**Model Library:**
- Click through EVERY tab: All Models, EXAONE, FLUX, Falcon, GLM, GPT-OSS, Granite, Mistral, OLMo, Qwen3, Qwen3.5, Solar
- For EACH model in the library capture: full name, model family, type (text-text, text-image, batch-text-text, etc.), context window size, deployment options
- Note any models that say "Custom library model creation is only available in external workspaces"

**Nodes Page:**
- Document what nodes are, how they work, any configuration options
- List any active nodes and their specs

**API Lab Page:**
- Document all available endpoints (POST /v1/chat/completions, POST /v1/responses, POST /inference/, GET /v1/models, etc.)
- Capture the full request/response format for each endpoint
- Note any differences between endpoints
- Document streaming support, temperature, and other parameters
- Capture the base URL format

**Analytics Page:**
- Document what metrics are tracked (requests, tokens, latency, etc.)
- Note any rate limits or usage caps visible

**Billing Page:**
- Document the pricing model, any tiers, per-token costs, or subscription details
- Note any free tier limits, pay-as-you-go rates, or enterprise options
- Capture any cost comparison data vs. main API providers

### 2. Courier Docs — Cloud Docs Tab (`courier.thinkrecursion.ai` → Documentation → Courier Docs tab)

Scrape EVERY page in the left sidebar:
- **Introduction** — What is Courier, key features, architecture overview
- **Installation** — Setup instructions, requirements
- **Workbench** — How the model workbench works, deployment modes (STATIC vs FLEX), quantization options
- **n8n Integration** — How to connect Courier to n8n workflows
- **API Docs** — Full API reference, all endpoints, request/response schemas, authentication
- **Tool Calling API** — How tool/function calling works, which models support it, request format, examples
- **Whisper API** — Speech-to-text capabilities, supported formats, endpoint details
- **JSON Response Formatting** — Structured output support, how to enforce JSON schemas

### 3. Courier OSS Docs Tab (`courier.thinkrecursion.ai` → Documentation → Courier OSS Docs tab)

Scrape EVERY page in the left sidebar:
- **Introduction** — What Courier OSS is, how it differs from Courier Cloud
- **Self-Hosting Guide** — Hardware requirements, deployment options, configuration
- **FlowDB** — What FlowDB is, how it works, data persistence for models

### 4. Any Additional Pages
- Check for any links to GitHub repos, Discord, changelogs, or roadmaps
- Check for any pricing comparison pages or benchmark data
- Look for any documentation on rate limits, concurrency, or scaling

## Output Format

Write the report as a single markdown file with this structure:

```markdown
# Courier Platform — Complete Technical Report
> Scraped from courier.thinkrecursion.ai on [date]

## Executive Summary
[2-3 sentences on what Courier is and key capabilities]

## Platform Overview
### Architecture
### Deployment Modes (STATIC vs FLEX)
### Authentication & API Access

## Available Models

### Currently Deployed (Workbench)
| Model Name | Model ID | Family | Quantization | Mode | Context Window | Type | Deployment |
|------------|----------|--------|-------------|------|----------------|------|------------|
[every deployed model]

### Full Model Library
| Model Name | Family | Type | Context Window | Notes |
|------------|--------|------|----------------|-------|
[every model in the library, organized by family]

### Model Capabilities Matrix
| Capability | Models That Support It |
|------------|----------------------|
| Tool/Function Calling | [list] |
| Streaming | [list] |
| JSON Mode | [list] |
| Vision/Multimodal | [list] |
| Text-to-Image | [list] |
| Speech-to-Text (Whisper) | [list] |
| Batch Processing | [list] |
| Thinking/Reasoning | [list] |

## API Reference

### Endpoints
[Full documentation of every endpoint with request/response examples]

### OpenAI Compatibility
[What OpenAI SDK features are supported, any differences]

### Courier OSS Inference API
[The /inference/ endpoint details]

### Tool Calling
[Complete tool calling documentation]

### Whisper API
[Speech-to-text details]

### JSON Response Formatting
[Structured output details]

## Infrastructure

### Nodes
[What nodes are, configuration, specs]

### FlowDB
[Data persistence details]

### Self-Hosting
[Requirements, setup, configuration options]

## Pricing & Limits
[Everything about costs, rate limits, quotas, tiers]

## Integration Patterns
### n8n Integration
[How to connect to n8n]

### OpenAI SDK Drop-in
[How to use as OpenAI replacement]

## Raw Notes
[Any additional findings, links, or observations not covered above]
```

## Important Instructions
- Be EXHAUSTIVE. Capture every model, every endpoint, every configuration option.
- Click into every sidebar link, every tab, every dropdown.
- If a page has expandable sections or tabs within it, expand and capture ALL of them.
- Include exact model IDs/names as they appear (these are needed for API calls).
- Note any features that are labeled as beta, coming soon, or experimental.
- If you encounter any errors or pages that won't load, note them in the report.
- The report should be copy-pasteable as a single markdown document.
