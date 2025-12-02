import {
  FileText,
  Image as ImageIcon,
  Mail,
  Palette,
  PenLine,
  Presentation,
  MessageSquare,
  FileSignature,
} from "lucide-react";

// Requirement item for the checklist
export interface RequirementItem {
  id: string;
  label: string;
  description: string;
  question: string; // Neptune asks this
  placeholder: string; // Example answer hint
  required: boolean;
  type: "text" | "select" | "multiselect" | "number";
  options?: string[]; // For select/multiselect types
}

// Document type configuration
export interface DocumentTypeConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  requirements: RequirementItem[];
  neptuneIntro: string; // Neptune's opening message for this type
}

// ============================================
// DOCUMENT TYPE CONFIGURATIONS
// ============================================

export const documentTypes: DocumentTypeConfig[] = [
  // ----------------------------------------
  // DOCUMENT (Reports, proposals, guides)
  // ----------------------------------------
  {
    id: "document",
    name: "Document",
    description: "Reports, proposals, guides, and documentation",
    icon: FileText,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    gradientFrom: "from-blue-500",
    gradientTo: "to-blue-600",
    neptuneIntro: "Let's create a professional document together! I'll help you structure it perfectly. First, tell me about the purpose of this document.",
    requirements: [
      {
        id: "purpose",
        label: "Purpose",
        description: "What this document aims to achieve",
        question: "What's the main purpose of this document? Is it to inform, persuade, instruct, or something else?",
        placeholder: "e.g., Inform stakeholders about Q3 progress",
        required: true,
        type: "text",
      },
      {
        id: "audience",
        label: "Target Audience",
        description: "Who will read this document",
        question: "Who is the primary audience for this document?",
        placeholder: "e.g., Executive team, clients, or internal staff",
        required: true,
        type: "text",
      },
      {
        id: "sections",
        label: "Key Sections",
        description: "Main sections to include",
        question: "What key sections should this document include?",
        placeholder: "e.g., Executive summary, findings, recommendations",
        required: true,
        type: "text",
      },
      {
        id: "tone",
        label: "Tone & Style",
        description: "Writing tone and formality",
        question: "What tone should the document have?",
        placeholder: "Formal, casual, technical, friendly",
        required: true,
        type: "select",
        options: ["Formal & Professional", "Casual & Friendly", "Technical & Detailed", "Persuasive & Compelling"],
      },
      {
        id: "length",
        label: "Length Preference",
        description: "Approximate document length",
        question: "How long should this document be?",
        placeholder: "Short, medium, or comprehensive",
        required: false,
        type: "select",
        options: ["Brief (1-2 pages)", "Standard (3-5 pages)", "Comprehensive (6+ pages)"],
      },
      {
        id: "data",
        label: "Data & Sources",
        description: "Key data or sources to include",
        question: "Do you have any specific data, statistics, or sources that should be included?",
        placeholder: "e.g., Sales figures, research citations",
        required: false,
        type: "text",
      },
    ],
  },

  // ----------------------------------------
  // IMAGE (Graphics, illustrations)
  // ----------------------------------------
  {
    id: "image",
    name: "Image",
    description: "Graphics, illustrations, and visual content",
    icon: ImageIcon,
    iconColor: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    gradientFrom: "from-pink-500",
    gradientTo: "to-pink-600",
    neptuneIntro: "Let's create something visually stunning! Tell me about the image you're envisioning.",
    requirements: [
      {
        id: "imageType",
        label: "Image Type",
        description: "What kind of visual asset",
        question: "What type of image do you need?",
        placeholder: "Social graphic, banner, infographic, etc.",
        required: true,
        type: "select",
        options: ["Social Media Graphic", "Banner/Header", "Infographic", "Illustration", "Logo/Icon", "Advertisement"],
      },
      {
        id: "platform",
        label: "Platform",
        description: "Where the image will be used",
        question: "Where will this image be used?",
        placeholder: "Instagram, website header, print, etc.",
        required: true,
        type: "select",
        options: ["Instagram", "Facebook", "LinkedIn", "Twitter/X", "Website", "Print", "Email", "Presentation"],
      },
      {
        id: "dimensions",
        label: "Dimensions",
        description: "Size and aspect ratio",
        question: "Do you have specific dimensions in mind, or should I suggest based on the platform?",
        placeholder: "e.g., 1080x1080, 16:9 ratio",
        required: false,
        type: "text",
      },
      {
        id: "brandColors",
        label: "Brand Colors",
        description: "Colors to incorporate",
        question: "What colors should I use? Share your brand colors or preferences.",
        placeholder: "e.g., #3B82F6 blue, #10B981 green",
        required: true,
        type: "text",
      },
      {
        id: "textOverlay",
        label: "Text Content",
        description: "Text to include on the image",
        question: "What text or messaging should appear on the image?",
        placeholder: "e.g., 'Summer Sale - 50% Off'",
        required: true,
        type: "text",
      },
      {
        id: "style",
        label: "Visual Style",
        description: "Design aesthetic",
        question: "What visual style are you going for?",
        placeholder: "Minimalist, bold, corporate, playful",
        required: true,
        type: "select",
        options: ["Minimalist & Clean", "Bold & Vibrant", "Corporate & Professional", "Playful & Fun", "Elegant & Luxurious", "Modern & Trendy"],
      },
    ],
  },

  // ----------------------------------------
  // NEWSLETTER (Email newsletters)
  // ----------------------------------------
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Email newsletters and digest content",
    icon: Mail,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    gradientFrom: "from-amber-500",
    gradientTo: "to-amber-600",
    neptuneIntro: "Let's craft an engaging newsletter that your audience will love! What's the main focus of this edition?",
    requirements: [
      {
        id: "purpose",
        label: "Newsletter Purpose",
        description: "Primary goal of this newsletter",
        question: "What's the main purpose of this newsletter?",
        placeholder: "Weekly digest, product announcement, company news",
        required: true,
        type: "select",
        options: ["Weekly/Monthly Digest", "Product Announcement", "Company News & Updates", "Educational Content", "Promotional Campaign", "Event Invitation"],
      },
      {
        id: "audience",
        label: "Audience Segment",
        description: "Who receives this newsletter",
        question: "Who is this newsletter going to? Any specific segment?",
        placeholder: "e.g., All subscribers, premium users, leads",
        required: true,
        type: "text",
      },
      {
        id: "headline",
        label: "Main Headline",
        description: "The hook or primary message",
        question: "What's the main headline or hook you want to lead with?",
        placeholder: "e.g., 'Introducing Our Biggest Update Yet'",
        required: true,
        type: "text",
      },
      {
        id: "sections",
        label: "Content Sections",
        description: "Sections to include",
        question: "What sections should this newsletter include?",
        placeholder: "Featured story, quick tips, upcoming events",
        required: true,
        type: "multiselect",
        options: ["Featured Story", "Quick Tips", "Product Updates", "Industry News", "Customer Spotlight", "Upcoming Events", "Team News", "Resources/Links"],
      },
      {
        id: "cta",
        label: "Call to Action",
        description: "What you want readers to do",
        question: "What's the main action you want readers to take?",
        placeholder: "e.g., Sign up, Buy now, Read more, Register",
        required: true,
        type: "text",
      },
      {
        id: "tone",
        label: "Tone & Voice",
        description: "Email personality",
        question: "What tone should the newsletter have?",
        placeholder: "Professional, casual, exciting, informative",
        required: true,
        type: "select",
        options: ["Professional & Informative", "Casual & Friendly", "Exciting & Energetic", "Warm & Personal", "Urgent & Action-Oriented"],
      },
    ],
  },

  // ----------------------------------------
  // BRAND KIT (Guidelines, logos)
  // ----------------------------------------
  {
    id: "brand-kit",
    name: "Brand Kit",
    description: "Brand guidelines, logos, and identity assets",
    icon: Palette,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    gradientFrom: "from-purple-500",
    gradientTo: "to-purple-600",
    neptuneIntro: "Let's build a cohesive brand identity! I'll help you define the visual and verbal elements that make your brand unique.",
    requirements: [
      {
        id: "brandName",
        label: "Brand Name",
        description: "Your brand or company name",
        question: "What's the brand name we're creating this kit for?",
        placeholder: "e.g., Acme Corp, TechFlow",
        required: true,
        type: "text",
      },
      {
        id: "industry",
        label: "Industry",
        description: "Your business sector",
        question: "What industry or sector is your brand in?",
        placeholder: "e.g., Technology, Healthcare, E-commerce",
        required: true,
        type: "text",
      },
      {
        id: "targetMarket",
        label: "Target Market",
        description: "Who your brand serves",
        question: "Who is your target audience or ideal customer?",
        placeholder: "e.g., Young professionals, small business owners",
        required: true,
        type: "text",
      },
      {
        id: "brandValues",
        label: "Brand Values",
        description: "Core values and personality",
        question: "What are the core values or personality traits of your brand?",
        placeholder: "e.g., Innovative, trustworthy, approachable",
        required: true,
        type: "text",
      },
      {
        id: "colorPreferences",
        label: "Color Preferences",
        description: "Existing or desired colors",
        question: "Do you have existing brand colors, or any color preferences I should consider?",
        placeholder: "e.g., Blues and greens, warm tones, no pink",
        required: true,
        type: "text",
      },
      {
        id: "competitors",
        label: "Competitor References",
        description: "Brands to differentiate from or draw inspiration",
        question: "Are there any competitor brands I should reference (to differentiate from or draw inspiration)?",
        placeholder: "e.g., We want to feel more premium than Brand X",
        required: false,
        type: "text",
      },
    ],
  },

  // ----------------------------------------
  // BLOG POST (Articles, SEO content)
  // ----------------------------------------
  {
    id: "blog",
    name: "Blog Post",
    description: "Articles, thought leadership, and SEO content",
    icon: PenLine,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-emerald-600",
    neptuneIntro: "Let's write a compelling blog post! I'll help you create content that engages readers and ranks well. What topic are we tackling?",
    requirements: [
      {
        id: "topic",
        label: "Topic",
        description: "What the post is about",
        question: "What topic or subject should this blog post cover?",
        placeholder: "e.g., 10 Tips for Remote Work Productivity",
        required: true,
        type: "text",
      },
      {
        id: "targetKeyword",
        label: "Target Keyword",
        description: "SEO focus keyword",
        question: "What's the primary keyword you want to rank for? (for SEO)",
        placeholder: "e.g., 'remote work tips', 'project management'",
        required: true,
        type: "text",
      },
      {
        id: "audience",
        label: "Target Audience",
        description: "Who you're writing for",
        question: "Who is the target reader for this post?",
        placeholder: "e.g., Marketing managers, startup founders",
        required: true,
        type: "text",
      },
      {
        id: "tone",
        label: "Tone & Style",
        description: "Writing voice",
        question: "What tone should the blog post have?",
        placeholder: "Educational, conversational, authoritative",
        required: true,
        type: "select",
        options: ["Educational & Informative", "Conversational & Friendly", "Authoritative & Expert", "Inspiring & Motivational", "Practical & How-To"],
      },
      {
        id: "keyPoints",
        label: "Key Points",
        description: "Main points to cover",
        question: "What key points or subtopics should be covered?",
        placeholder: "e.g., Benefits, challenges, best practices",
        required: true,
        type: "text",
      },
      {
        id: "wordCount",
        label: "Word Count",
        description: "Target length",
        question: "How long should this blog post be?",
        placeholder: "500-800 words for short, 1500+ for comprehensive",
        required: false,
        type: "select",
        options: ["Short (500-800 words)", "Medium (800-1200 words)", "Long-form (1500-2500 words)", "Comprehensive (2500+ words)"],
      },
    ],
  },

  // ----------------------------------------
  // PRESENTATION (Slide decks)
  // ----------------------------------------
  {
    id: "presentation",
    name: "Presentation",
    description: "Slide decks, pitch decks, and presentations",
    icon: Presentation,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-indigo-600",
    neptuneIntro: "Let's create a presentation that captivates your audience! Tell me about what you're presenting.",
    requirements: [
      {
        id: "purpose",
        label: "Presentation Purpose",
        description: "Why you're presenting",
        question: "What's the purpose of this presentation?",
        placeholder: "Sales pitch, quarterly review, training",
        required: true,
        type: "select",
        options: ["Sales Pitch", "Investor Deck", "Quarterly/Annual Review", "Training & Education", "Product Demo", "Conference Talk", "Team Meeting", "Proposal"],
      },
      {
        id: "audience",
        label: "Audience",
        description: "Who you're presenting to",
        question: "Who will be watching this presentation?",
        placeholder: "e.g., Investors, clients, team members",
        required: true,
        type: "text",
      },
      {
        id: "keyMessage",
        label: "Key Message",
        description: "The main takeaway",
        question: "What's the ONE key message you want the audience to remember?",
        placeholder: "e.g., Our product increases efficiency by 40%",
        required: true,
        type: "text",
      },
      {
        id: "slideCount",
        label: "Slide Count",
        description: "Number of slides needed",
        question: "Approximately how many slides do you need?",
        placeholder: "10-15 slides is typical",
        required: true,
        type: "select",
        options: ["Brief (5-8 slides)", "Standard (10-15 slides)", "Detailed (20-30 slides)", "Comprehensive (30+ slides)"],
      },
      {
        id: "dataCharts",
        label: "Data & Charts",
        description: "Visuals to include",
        question: "Do you need any specific data visualizations, charts, or graphs?",
        placeholder: "e.g., Revenue chart, comparison table",
        required: false,
        type: "text",
      },
      {
        id: "visualStyle",
        label: "Visual Style",
        description: "Design aesthetic",
        question: "What visual style fits your presentation best?",
        placeholder: "Clean, bold, corporate, creative",
        required: true,
        type: "select",
        options: ["Clean & Minimal", "Bold & Impactful", "Corporate & Professional", "Creative & Dynamic", "Data-Driven & Analytical"],
      },
    ],
  },

  // ----------------------------------------
  // SOCIAL POST (Social media content)
  // ----------------------------------------
  {
    id: "social",
    name: "Social Post",
    description: "Social media content for all platforms",
    icon: MessageSquare,
    iconColor: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-cyan-600",
    neptuneIntro: "Let's create social content that gets engagement! Which platform are we creating for?",
    requirements: [
      {
        id: "platform",
        label: "Platform",
        description: "Where you'll post",
        question: "Which social media platform is this for?",
        placeholder: "LinkedIn, Twitter, Instagram, etc.",
        required: true,
        type: "select",
        options: ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "TikTok", "YouTube", "Threads", "Multiple Platforms"],
      },
      {
        id: "topic",
        label: "Topic/Message",
        description: "What the post is about",
        question: "What's the main topic or message of this post?",
        placeholder: "e.g., Product launch, industry insight, company milestone",
        required: true,
        type: "text",
      },
      {
        id: "tone",
        label: "Tone",
        description: "Voice and personality",
        question: "What tone should this post have?",
        placeholder: "Professional, casual, witty, inspiring",
        required: true,
        type: "select",
        options: ["Professional & Thought-Leading", "Casual & Conversational", "Witty & Entertaining", "Inspiring & Motivational", "Educational & Informative", "Urgent & Promotional"],
      },
      {
        id: "hashtags",
        label: "Hashtags",
        description: "Relevant hashtags to include",
        question: "Should I suggest hashtags? Any specific ones you want to include?",
        placeholder: "e.g., #Marketing #AI #Innovation",
        required: false,
        type: "text",
      },
      {
        id: "cta",
        label: "Call to Action",
        description: "What you want people to do",
        question: "What action do you want readers to take?",
        placeholder: "e.g., Comment, visit link, share, DM",
        required: true,
        type: "select",
        options: ["Engage (like, comment)", "Click link", "Share with network", "DM for more info", "Tag someone", "Save for later", "No specific CTA"],
      },
      {
        id: "mediaType",
        label: "Media Type",
        description: "Visual element needed",
        question: "What type of media will accompany this post?",
        placeholder: "Image, video, carousel, text-only",
        required: true,
        type: "select",
        options: ["Single Image", "Carousel/Multiple Images", "Video", "GIF", "Text Only", "Link Preview"],
      },
    ],
  },

  // ----------------------------------------
  // PROPOSAL (Business proposals)
  // ----------------------------------------
  {
    id: "proposal",
    name: "Proposal",
    description: "Business proposals and client documents",
    icon: FileSignature,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    gradientFrom: "from-orange-500",
    gradientTo: "to-orange-600",
    neptuneIntro: "Let's create a winning proposal! Tell me about the client and project you're pitching.",
    requirements: [
      {
        id: "clientName",
        label: "Client Name",
        description: "Who the proposal is for",
        question: "Who is this proposal for? (Company or contact name)",
        placeholder: "e.g., Acme Corporation, John Smith",
        required: true,
        type: "text",
      },
      {
        id: "projectScope",
        label: "Project Scope",
        description: "What you're proposing to do",
        question: "What project or service are you proposing?",
        placeholder: "e.g., Website redesign, marketing campaign, consulting",
        required: true,
        type: "text",
      },
      {
        id: "budget",
        label: "Budget Range",
        description: "Pricing or investment",
        question: "What's the budget or pricing for this proposal?",
        placeholder: "e.g., $5,000-$10,000, custom pricing",
        required: true,
        type: "text",
      },
      {
        id: "timeline",
        label: "Timeline",
        description: "Project duration",
        question: "What's the proposed timeline or deadline?",
        placeholder: "e.g., 4 weeks, Q1 2025, ongoing",
        required: true,
        type: "text",
      },
      {
        id: "deliverables",
        label: "Key Deliverables",
        description: "What client will receive",
        question: "What are the key deliverables the client will receive?",
        placeholder: "e.g., 10 blog posts, brand guide, 3 landing pages",
        required: true,
        type: "text",
      },
      {
        id: "usp",
        label: "Unique Value",
        description: "Why you over competitors",
        question: "What makes your proposal stand out? Why should they choose you?",
        placeholder: "e.g., 10 years experience, proven ROI, unique approach",
        required: true,
        type: "text",
      },
    ],
  },
];

// Helper function to get a document type by ID
export function getDocumentType(id: string): DocumentTypeConfig | undefined {
  return documentTypes.find((dt) => dt.id === id);
}

// Helper function to get required items count
export function getRequiredCount(docType: DocumentTypeConfig): number {
  return docType.requirements.filter((r) => r.required).length;
}

// Helper function to get completion percentage
export function getCompletionPercentage(
  docType: DocumentTypeConfig,
  answers: Record<string, string>
): number {
  const requiredItems = docType.requirements.filter((r) => r.required);
  const completedItems = requiredItems.filter((r) => answers[r.id]?.trim());
  return Math.round((completedItems.length / requiredItems.length) * 100);
}

// Helper to check if all required fields are complete
export function isComplete(
  docType: DocumentTypeConfig,
  answers: Record<string, string>
): boolean {
  return docType.requirements
    .filter((r) => r.required)
    .every((r) => answers[r.id]?.trim());
}
