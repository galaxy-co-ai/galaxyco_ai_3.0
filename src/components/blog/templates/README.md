# Blog Templates

Professional, brand-consistent blog templates for GalaxyCo.ai content.

## 📚 Available Templates

### 1. TutorialTemplate
**Use for:** Step-by-step guides, how-to articles, technical walkthroughs

**Features:**
- Table of Contents sidebar
- Code block support
- Reading time estimate
- Related posts section
- Author attribution
- Social sharing (Twitter, LinkedIn)

**Example Usage:**
```tsx
import { TutorialTemplate } from '@/components/blog/templates';

export default function MyTutorial() {
  return (
    <TutorialTemplate
      title="How to Build AI Workflows"
      description="A complete guide to creating automated workflows"
      author={{
        name: "Jane Smith",
        avatar: "/avatars/jane.jpg",
        role: "Product Engineer"
      }}
      publishedAt="2025-12-14"
      readTime={10}
      category="Tutorial"
      heroImage="/blog/tutorial-hero.jpg"
      sections={[
        { id: "intro", title: "Introduction", level: 2 },
        { id: "step-1", title: "Step 1: Setup", level: 2 },
        { id: "step-2", title: "Step 2: Configure", level: 2 },
      ]}
      relatedPosts={[
        { title: "Advanced Workflows", slug: "advanced-workflows" }
      ]}
    >
      {/* Your tutorial content goes here */}
      <h2 id="intro">Introduction</h2>
      <p>Tutorial content...</p>
    </TutorialTemplate>
  );
}
```

---

### 2. CaseStudyTemplate
**Use for:** Customer success stories, use case showcases

**Features:**
- Key metrics grid (4-column)
- Challenge/Solution/Results structure
- Customer quote blockquote
- Related case studies
- "Get Started" CTA

**Example Usage:**
```tsx
import { CaseStudyTemplate } from '@/components/blog/templates';

export default function CaseStudy() {
  return (
    <CaseStudyTemplate
      title="How Acme Corp Saved 40 Hours/Week"
      subtitle="Automating customer support with AI agents"
      customer={{
        name: "Acme Corp",
        logo: "/logos/acme.png",
        industry: "SaaS",
        size: "50-100 employees"
      }}
      publishedAt="2025-12-14"
      readTime={8}
      heroImage="/blog/acme-hero.jpg"
      metrics={[
        { label: "Hours Saved", value: "40hrs/week", change: "+120%" },
        { label: "Response Time", value: "2 min", change: "-85%" },
        { label: "Customer Satisfaction", value: "98%", change: "+15%" },
        { label: "Cost Savings", value: "$50K/yr" }
      ]}
      challenge="Customer support was overwhelming..."
      solution="Implemented AI agents with GalaxyCo.ai..."
      results="Reduced response times by 85%..."
      quote={{
        text: "GalaxyCo.ai transformed how we handle support",
        author: "John Doe",
        role: "CTO, Acme Corp"
      }}
    />
  );
}
```

---

### 3. ProductUpdateTemplate
**Use for:** Feature announcements, release notes, product updates

**Features:**
- Version tracking
- Category badges (Major Update, Minor Update, Bug Fix, New Feature)
- What's New features list
- Structured sections (What Changed, Why It Matters, How to Use)
- "Go to Dashboard" CTA

**Example Usage:**
```tsx
import { ProductUpdateTemplate } from '@/components/blog/templates';

export default function Update() {
  return (
    <ProductUpdateTemplate
      title="Introducing Advanced Workflow Triggers"
      version="2.1.0"
      description="Schedule and automate workflows with powerful new triggers"
      author={{
        name: "Product Team",
        avatar: "/avatars/team.jpg",
        role: "GalaxyCo Product"
      }}
      publishedAt="2025-12-14"
      readTime={5}
      category="Major Update"
      heroImage="/blog/triggers-hero.jpg"
      features={[
        {
          title: "Schedule-based Triggers",
          description: "Run workflows on any schedule"
        },
        {
          title: "Event-based Triggers",
          description: "React to external events in real-time"
        }
      ]}
      whatChanged="We completely rebuilt our trigger system..."
      whyItMatters="This enables more powerful automation..."
      howToUse="Navigate to Workflows > Triggers..."
    />
  );
}
```

---

### 4. BestPracticesTemplate
**Use for:** Tips & tricks, best practices, guides, patterns

**Features:**
- Difficulty level badges (Beginner, Intermediate, Advanced)
- TL;DR key takeaways section
- Related practices grid
- "Try in Your Dashboard" CTA

**Example Usage:**
```tsx
import { BestPracticesTemplate } from '@/components/blog/templates';

export default function BestPractice() {
  return (
    <BestPracticesTemplate
      title="5 Best Practices for AI Prompts"
      description="Write better prompts and get better results"
      author={{
        name: "AI Expert",
        avatar: "/avatars/expert.jpg",
        role: "Prompt Engineer"
      }}
      publishedAt="2025-12-14"
      readTime={7}
      category="Best Practices"
      difficulty="Intermediate"
      heroImage="/blog/prompts-hero.jpg"
      tldr={[
        "Be specific and detailed in your requests",
        "Provide examples of desired output",
        "Iterate and refine based on results"
      ]}
      relatedPractices={[
        { title: "Advanced Prompting", slug: "advanced-prompting" }
      ]}
    >
      {/* Your content */}
    </BestPracticesTemplate>
  );
}
```

---

### 5. CompanyNewsTemplate
**Use for:** Company updates, team news, milestones, behind-the-scenes

**Features:**
- Category badges (Company Update, Team News, Milestone, Behind the Scenes)
- Social sharing
- "Join Beta" / "Follow Our Journey" CTAs
- Related news section

**Example Usage:**
```tsx
import { CompanyNewsTemplate } from '@/components/blog/templates';

export default function News() {
  return (
    <CompanyNewsTemplate
      title="We've Raised $10M Series A!"
      description="Funding to accelerate AI platform development"
      author={{
        name: "CEO",
        avatar: "/avatars/ceo.jpg",
        role: "Founder & CEO"
      }}
      publishedAt="2025-12-14"
      readTime={4}
      category="Milestone"
      heroImage="/blog/series-a.jpg"
      relatedNews={[
        {
          title: "Joining Y Combinator",
          slug: "yc-announcement",
          category: "Company Update"
        }
      ]}
    >
      {/* Your announcement content */}
    </CompanyNewsTemplate>
  );
}
```

---

## 🎨 Brand Consistency

All templates use GalaxyCo brand colors:
- **Electric Cyan** (`#00D4E8`) - Primary accent, CTAs
- **Creamsicle** (`#FF9966`) - Secondary accent
- **Void Black** (`#0D0D12`) - Text on Electric Cyan backgrounds
- **Ice White** (`#F5F5F7`) - Body text

## 📱 Features Across All Templates

- ✅ Mobile-first responsive design
- ✅ Hero section with gradient background
- ✅ Author attribution with avatar
- ✅ Reading time estimates
- ✅ Social sharing (Twitter, LinkedIn)
- ✅ Related content recommendations
- ✅ Brand-consistent CTAs
- ✅ Glass morphism effects
- ✅ Motion animations (framer-motion)
- ✅ Next.js Image optimization
- ✅ Dark mode support
- ✅ Accessibility features

## 🚀 Usage Guidelines

### 1. Import the Template
```tsx
import { TutorialTemplate } from '@/components/blog/templates';
```

### 2. Provide Required Props
All templates require:
- `title` - Post title
- `description` - Short description/excerpt
- `author` - Author object with name, avatar (optional), role
- `publishedAt` - ISO date string
- `readTime` - Reading time in minutes
- `category` - Template-specific category

### 3. Add Your Content
Pass your content as `children`:
```tsx
<TutorialTemplate {...props}>
  <h2>Your content here</h2>
  <p>Markdown or JSX</p>
</TutorialTemplate>
```

### 4. Optional Enhancements
- `heroImage` - Header image path
- `relatedPosts` / `relatedPractices` / `relatedNews` - Related content
- Template-specific props (see individual examples above)

## 📁 File Structure

```
src/components/blog/templates/
├── TutorialTemplate.tsx        # Tutorial guides
├── CaseStudyTemplate.tsx       # Customer stories
├── ProductUpdateTemplate.tsx   # Feature announcements
├── BestPracticesTemplate.tsx   # Tips & patterns
├── CompanyNewsTemplate.tsx     # Company updates
├── index.ts                    # Exports all templates
└── README.md                   # This file
```

## 🔧 Customization

Each template can be customized by:
1. Passing optional props
2. Styling with Tailwind classes
3. Adding custom sections via `children`
4. Extending component interfaces

## 📝 Content Guidelines

### Tutorial Content
- Clear step-by-step structure
- Code examples with syntax highlighting
- Screenshots/diagrams where helpful
- Prerequisites section
- Expected outcome

### Case Study Content
- Real metrics and data
- Before/after comparisons
- Direct customer quotes
- Specific challenges and solutions
- Measurable results

### Product Updates
- Clear feature descriptions
- Visual examples (screenshots/GIFs)
- Migration guides if needed
- Breaking changes highlighted
- Links to documentation

### Best Practices
- Actionable advice
- Real-world examples
- Common pitfalls to avoid
- Progressive difficulty
- Quick wins first

### Company News
- Authentic tone
- Behind-the-scenes context
- Team member spotlights
- Impact on customers
- What's next

## 🎯 SEO Best Practices

All templates support:
- Semantic HTML structure
- Proper heading hierarchy
- Image alt text
- Open Graph metadata
- Schema.org markup

---

**Last Updated:** 2025-12-14  
**Templates Version:** 1.0.0  
**Brand System:** Phase 5 Complete
