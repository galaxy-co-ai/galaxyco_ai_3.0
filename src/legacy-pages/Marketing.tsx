"use client";
import { useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { 
  Megaphone, 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Share2,
  Mail,
  Image as ImageIcon,
  FileText,
  Video,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  ArrowRight,
  Activity,
  Zap,
  Download,
  Copy,
  Edit2,
  Gauge,
  TrendingDown,
  MapPin,
  Briefcase,
  Heart,
  UserPlus,
  Building2,
  Star,
  Phone,
  ExternalLink,
  Filter,
  Send
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "draft" | "completed";
  type: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  progress: number;
  kpis: {
    impressions: number;
    clicks: number;
    conversions: number;
    roi: number;
  };
  channels: string[];
  assets: {
    type: "image" | "video" | "copy" | "landing-page";
    name: string;
    status: "ready" | "in-progress" | "review";
  }[];
  description: string;
  performanceData?: {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }[];
  channelBreakdown?: {
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    roi: number;
  }[];
  audienceInsights?: {
    demographics: {
      age: string;
      percentage: number;
    }[];
    locations: {
      city: string;
      percentage: number;
    }[];
    interests: string[];
  };
  funnelData?: {
    stage: string;
    count: number;
  }[];
  recentActivity?: {
    type: string;
    description: string;
    timestamp: string;
  }[];
  aiSuggestions?: {
    title: string;
    description: string;
    impact: string;
    priority: "high" | "medium" | "low";
  }[];
  leads?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company: string;
    title: string;
    industry: string;
    location: string;
    leadScore: number;
    qualification: "SQL" | "MQL" | "Cold" | "Unqualified";
    source: string;
    channel: string;
    acquisitionDate: string;
    enrichmentStatus: "complete" | "partial" | "pending";
    companySize?: string;
    revenue?: string;
    interests: string[];
    lastActivity: string;
    engagementScore: number;
  }[];
  leadStats?: {
    total: number;
    qualified: number;
    byQualification: {
      name: string;
      count: number;
      color: string;
    }[];
    bySource: {
      source: string;
      count: number;
      score: number;
    }[];
    avgScore: number;
    enrichmentRate: number;
  };
}

export function Marketing() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [contactingLead, setContactingLead] = useState<Campaign['leads'][0] | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Generate AI-personalized email
  const generateAIEmail = (lead: any) => {
    const getCTA = () => {
      if (lead.qualification === 'SQL') return "I'd love to schedule a personalized demo to show you how we can specifically help TechCorp Solutions streamline your workflows.";
      if (lead.qualification === 'MQL') return "I thought you might find our case study on similar implementations in the Enterprise Software space valuable.";
      return "I'd be happy to share more information about how our platform could benefit your team.";
    };

    const subject = lead.qualification === 'SQL' 
      ? `Following up on your interest in GalaxyCo.ai, ${lead.name.split(' ')[0]}`
      : `Great to connect, ${lead.name.split(' ')[0]} - Resources for ${lead.company}`;

    const body = `Hi ${lead.name.split(' ')[0]},

I noticed you ${lead.lastActivity.toLowerCase()} and wanted to personally reach out. As ${lead.title} at ${lead.company}, I imagine you're always looking for ways to optimize your team's efficiency.

GalaxyCo.ai has helped similar ${lead.industry} companies save an average of 15+ hours per employee each week by automating repetitive workflows and centralizing their knowledge base with AI-powered agents.

${getCTA()}

Looking forward to connecting!

Best regards,
Your Name
GalaxyCo.ai Team
demo@galaxyco.ai`;

    return { subject, body };
  };

  const handleContactLead = (lead: any) => {
    const aiEmail = generateAIEmail(lead);
    setEmailSubject(aiEmail.subject);
    setEmailBody(aiEmail.body);
    setContactingLead(lead);
    setIsEditingEmail(false);
  };

  const handleSendEmail = async () => {
    if (!contactingLead) return;

    // Check if Gmail is connected
    const gmailConnected = localStorage.getItem('integration_gmail') === 'connected';
    
    if (!gmailConnected) {
      toast.error('Gmail not connected', {
        description: 'Please connect your Gmail account in Integrations first',
        action: {
          label: 'Go to Integrations',
          onClick: () => window.location.href = '#integrations'
        }
      });
      return;
    }

    // Show sending state
    toast.loading('Sending email...', { id: 'sending-email' });

    try {
      // Simulate API call to send email via Gmail API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would call your backend API which uses Gmail API:
      // await fetch('/api/send-email', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     to: contactingLead.email,
      //     subject: emailSubject,
      //     body: emailBody,
      //   })
      // });

      toast.success(`Email sent to ${contactingLead.name} ✓`, {
        id: 'sending-email',
        description: "Sent via Gmail • Activity logged to CRM"
      });
      
      setContactingLead(null);
    } catch (error) {
      toast.error('Failed to send email', {
        id: 'sending-email',
        description: 'Please try again or check your connection'
      });
    }
  };

  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Q4 Product Launch Campaign",
      status: "active",
      type: "Multi-Channel Launch",
      budget: 50000,
      spent: 32400,
      startDate: "Nov 1, 2025",
      endDate: "Dec 31, 2025",
      progress: 65,
      kpis: {
        impressions: 2450000,
        clicks: 98000,
        conversions: 3200,
        roi: 340
      },
      channels: ["Email", "Social Media", "Paid Ads", "Content Marketing"],
      assets: [
        { type: "image", name: "Hero Banner Set (5 variations)", status: "ready" },
        { type: "video", name: "Product Demo Video", status: "ready" },
        { type: "copy", name: "Email Campaign Copy", status: "ready" },
        { type: "landing-page", name: "Launch Landing Page", status: "ready" },
        { type: "image", name: "Social Media Graphics", status: "in-progress" }
      ],
      description: "Comprehensive multi-channel campaign for our flagship product launch targeting enterprise customers with personalized messaging and retargeting strategies.",
      performanceData: [
        { date: "Nov 1", impressions: 145000, clicks: 5800, conversions: 185, spend: 1920 },
        { date: "Nov 2", impressions: 152000, clicks: 6100, conversions: 195, spend: 2040 },
        { date: "Nov 3", impressions: 168000, clicks: 6720, conversions: 215, spend: 2180 },
        { date: "Nov 4", impressions: 178000, clicks: 7120, conversions: 228, spend: 2340 },
        { date: "Nov 5", impressions: 185000, clicks: 7400, conversions: 237, spend: 2450 },
        { date: "Nov 6", impressions: 192000, clicks: 7680, conversions: 246, spend: 2520 }
      ],
      channelBreakdown: [
        { name: "Paid Ads", impressions: 980000, clicks: 39200, conversions: 1280, spend: 12960, roi: 425 },
        { name: "Email", impressions: 490000, clicks: 19600, conversions: 640, spend: 6480, roi: 380 },
        { name: "Social Media", impressions: 735000, clicks: 29400, conversions: 960, spend: 9720, roi: 295 },
        { name: "Content Marketing", impressions: 245000, clicks: 9800, conversions: 320, spend: 3240, roi: 280 }
      ],
      audienceInsights: {
        demographics: [
          { age: "25-34", percentage: 35 },
          { age: "35-44", percentage: 28 },
          { age: "45-54", percentage: 22 },
          { age: "18-24", percentage: 10 },
          { age: "55+", percentage: 5 }
        ],
        locations: [
          { city: "San Francisco", percentage: 22 },
          { city: "New York", percentage: 18 },
          { city: "Austin", percentage: 15 },
          { city: "Seattle", percentage: 12 },
          { city: "Boston", percentage: 10 }
        ],
        interests: ["Enterprise Software", "AI & ML", "Productivity Tools", "SaaS", "Business Automation"]
      },
      funnelData: [
        { stage: "Impressions", count: 2450000 },
        { stage: "Clicks", count: 98000 },
        { stage: "Landing Page", count: 45000 },
        { stage: "Sign Up", count: 8200 },
        { stage: "Conversions", count: 3200 }
      ],
      recentActivity: [
        { type: "conversion", description: "Enterprise plan signup - TechCorp ($12,000)", timestamp: "2 minutes ago" },
        { type: "click", description: "LinkedIn ad clicked by Sarah Chen", timestamp: "5 minutes ago" },
        { type: "conversion", description: "Pro plan signup - InnovateLabs ($4,800)", timestamp: "12 minutes ago" },
        { type: "engagement", description: "Email opened by 234 recipients", timestamp: "18 minutes ago" },
        { type: "milestone", description: "Reached 3,000 conversions milestone", timestamp: "1 hour ago" }
      ],
      aiSuggestions: [
        { 
          title: "Increase Paid Ads Budget by 20%", 
          description: "Paid Ads channel is showing 425% ROI, significantly higher than other channels. Reallocating budget could increase conversions by 15-20%.",
          impact: "+$18K revenue",
          priority: "high"
        },
        { 
          title: "Optimize Email Send Time", 
          description: "Data shows 3.2x higher engagement when emails are sent on Tuesday at 10 AM EST vs current schedule.",
          impact: "+680 conversions",
          priority: "high"
        },
        { 
          title: "Create Retargeting Campaign", 
          description: "45,000 users visited landing page but didn't convert. A targeted retargeting campaign could recover 8-12% of these leads.",
          impact: "+$12K revenue",
          priority: "medium"
        }
      ],
      leads: [
        {
          id: "L001",
          name: "Sarah Chen",
          email: "sarah.chen@techcorp.com",
          phone: "+1 (555) 234-5678",
          company: "TechCorp Solutions",
          title: "VP of Engineering",
          industry: "Enterprise Software",
          location: "San Francisco, CA",
          leadScore: 92,
          qualification: "SQL",
          source: "Paid Ads",
          channel: "LinkedIn",
          acquisitionDate: "Nov 4, 2025",
          enrichmentStatus: "complete",
          companySize: "500-1000 employees",
          revenue: "$50M-$100M",
          interests: ["AI & ML", "Enterprise Software", "Cloud Infrastructure"],
          lastActivity: "Requested demo 2 hours ago",
          engagementScore: 95
        },
        {
          id: "L002",
          name: "Michael Rodriguez",
          email: "m.rodriguez@innovatelabs.io",
          phone: "+1 (555) 876-5432",
          company: "InnovateLabs",
          title: "CTO",
          industry: "SaaS",
          location: "Austin, TX",
          leadScore: 88,
          qualification: "SQL",
          source: "Content Marketing",
          channel: "Blog",
          acquisitionDate: "Nov 3, 2025",
          enrichmentStatus: "complete",
          companySize: "100-500 employees",
          revenue: "$10M-$50M",
          interests: ["SaaS", "Business Automation", "Productivity Tools"],
          lastActivity: "Downloaded whitepaper 5 hours ago",
          engagementScore: 87
        },
        {
          id: "L003",
          name: "Emily Watson",
          email: "emily.w@datastream.com",
          company: "DataStream Analytics",
          title: "Director of Product",
          industry: "Data Analytics",
          location: "New York, NY",
          leadScore: 76,
          qualification: "MQL",
          source: "Email",
          channel: "Newsletter",
          acquisitionDate: "Nov 5, 2025",
          enrichmentStatus: "complete",
          companySize: "50-100 employees",
          revenue: "$5M-$10M",
          interests: ["AI & ML", "Data Analytics", "Enterprise Software"],
          lastActivity: "Opened email 3 times",
          engagementScore: 72
        },
        {
          id: "L004",
          name: "James Park",
          email: "jpark@growthventures.com",
          phone: "+1 (555) 345-9876",
          company: "Growth Ventures",
          title: "Head of Marketing",
          industry: "Marketing Technology",
          location: "Seattle, WA",
          leadScore: 85,
          qualification: "SQL",
          source: "Social Media",
          channel: "Twitter",
          acquisitionDate: "Nov 2, 2025",
          enrichmentStatus: "complete",
          companySize: "250-500 employees",
          revenue: "$25M-$50M",
          interests: ["Marketing Technology", "Business Automation", "SaaS"],
          lastActivity: "Scheduled call for tomorrow",
          engagementScore: 91
        },
        {
          id: "L005",
          name: "Lisa Anderson",
          email: "l.anderson@futuretech.io",
          company: "FutureTech Industries",
          title: "Senior Product Manager",
          industry: "Technology",
          location: "Boston, MA",
          leadScore: 68,
          qualification: "MQL",
          source: "Paid Ads",
          channel: "Google Ads",
          acquisitionDate: "Nov 6, 2025",
          enrichmentStatus: "partial",
          companySize: "1000+ employees",
          interests: ["Productivity Tools", "Enterprise Software"],
          lastActivity: "Visited pricing page 1 day ago",
          engagementScore: 65
        },
        {
          id: "L006",
          name: "David Kim",
          email: "david@startupco.com",
          company: "StartupCo",
          title: "Founder & CEO",
          industry: "Startup",
          location: "San Francisco, CA",
          leadScore: 55,
          qualification: "Cold",
          source: "Social Media",
          channel: "LinkedIn",
          acquisitionDate: "Nov 5, 2025",
          enrichmentStatus: "partial",
          companySize: "10-50 employees",
          interests: ["SaaS", "Startup Tools"],
          lastActivity: "Downloaded guide 2 days ago",
          engagementScore: 48
        },
        {
          id: "L007",
          name: "Rachel Thompson",
          email: "rachel.t@megacorp.com",
          phone: "+1 (555) 567-1234",
          company: "MegaCorp International",
          title: "VP of Operations",
          industry: "Enterprise",
          location: "Chicago, IL",
          leadScore: 94,
          qualification: "SQL",
          source: "Email",
          channel: "Webinar",
          acquisitionDate: "Nov 1, 2025",
          enrichmentStatus: "complete",
          companySize: "5000+ employees",
          revenue: "$500M+",
          interests: ["Enterprise Software", "Business Automation", "Productivity Tools"],
          lastActivity: "Attended live webinar",
          engagementScore: 98
        },
        {
          id: "L008",
          name: "Alex Martinez",
          email: "alex@cloudservices.io",
          company: "Cloud Services Inc",
          title: "Solutions Architect",
          industry: "Cloud Computing",
          location: "Denver, CO",
          leadScore: 72,
          qualification: "MQL",
          source: "Content Marketing",
          channel: "Case Study",
          acquisitionDate: "Nov 4, 2025",
          enrichmentStatus: "complete",
          companySize: "100-500 employees",
          revenue: "$10M-$25M",
          interests: ["Cloud Infrastructure", "AI & ML", "SaaS"],
          lastActivity: "Read 3 case studies",
          engagementScore: 70
        }
      ],
      leadStats: {
        total: 8,
        qualified: 4,
        byQualification: [
          { name: "SQL", count: 4, color: "#22c55e" },
          { name: "MQL", count: 3, color: "#3b82f6" },
          { name: "Cold", count: 1, color: "#f97316" },
          { name: "Unqualified", count: 0, color: "#94a3b8" }
        ],
        bySource: [
          { source: "Paid Ads", count: 2, score: 84 },
          { source: "Email", count: 2, score: 91 },
          { source: "Content Marketing", count: 2, score: 80 },
          { source: "Social Media", count: 2, score: 70 }
        ],
        avgScore: 78.75,
        enrichmentRate: 87.5
      }
    },
    {
      id: "2",
      name: "Holiday Season Email Series",
      status: "active",
      type: "Email Marketing",
      budget: 15000,
      spent: 8200,
      startDate: "Nov 15, 2025",
      endDate: "Dec 25, 2025",
      progress: 55,
      kpis: {
        impressions: 450000,
        clicks: 45000,
        conversions: 2100,
        roi: 285
      },
      channels: ["Email", "Marketing Automation"],
      assets: [
        { type: "copy", name: "Email Sequence (8 emails)", status: "ready" },
        { type: "image", name: "Email Header Graphics", status: "ready" },
        { type: "landing-page", name: "Holiday Offer Page", status: "ready" }
      ],
      description: "Automated email sequence targeting existing customers with personalized holiday offers and product recommendations."
    },
    {
      id: "3",
      name: "Brand Awareness Social Campaign",
      status: "active",
      type: "Social Media",
      budget: 25000,
      spent: 12800,
      startDate: "Nov 1, 2025",
      endDate: "Jan 31, 2026",
      progress: 42,
      kpis: {
        impressions: 5200000,
        clicks: 156000,
        conversions: 890,
        roi: 125
      },
      channels: ["LinkedIn", "Twitter", "Instagram", "Facebook"],
      assets: [
        { type: "image", name: "Social Media Content Calendar", status: "ready" },
        { type: "video", name: "Testimonial Videos (3)", status: "in-progress" },
        { type: "image", name: "Infographics Series", status: "review" },
        { type: "copy", name: "Post Copy Library", status: "ready" }
      ],
      description: "Three-month brand awareness campaign focused on thought leadership and customer success stories across all major social platforms."
    },
    {
      id: "4",
      name: "Content Marketing Hub Launch",
      status: "draft",
      type: "Content Marketing",
      budget: 30000,
      spent: 0,
      startDate: "Dec 1, 2025",
      endDate: "Feb 28, 2026",
      progress: 15,
      kpis: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        roi: 0
      },
      channels: ["Blog", "SEO", "Email", "Social Media"],
      assets: [
        { type: "copy", name: "Blog Post Series (12 posts)", status: "in-progress" },
        { type: "landing-page", name: "Resource Hub Page", status: "in-progress" },
        { type: "copy", name: "Whitepapers (3)", status: "review" },
        { type: "image", name: "Blog Featured Images", status: "in-progress" }
      ],
      description: "Comprehensive content hub featuring educational resources, case studies, and thought leadership content to drive organic traffic and lead generation."
    },
    {
      id: "5",
      name: "Partner Co-Marketing Initiative",
      status: "paused",
      type: "Partnership Marketing",
      budget: 20000,
      spent: 5600,
      startDate: "Oct 15, 2025",
      endDate: "Dec 15, 2025",
      progress: 28,
      kpis: {
        impressions: 680000,
        clicks: 23000,
        conversions: 450,
        roi: 168
      },
      channels: ["Webinar", "Email", "Social Media"],
      assets: [
        { type: "copy", name: "Webinar Script & Slides", status: "ready" },
        { type: "video", name: "Webinar Recording", status: "ready" },
        { type: "copy", name: "Co-branded Email Campaign", status: "ready" }
      ],
      description: "Joint marketing initiative with strategic partners featuring co-branded webinars and content to expand market reach."
    },
    {
      id: "6",
      name: "Retargeting & Conversion Optimization",
      status: "active",
      type: "Paid Advertising",
      budget: 40000,
      spent: 28900,
      startDate: "Oct 1, 2025",
      endDate: "Dec 31, 2025",
      progress: 72,
      kpis: {
        impressions: 1850000,
        clicks: 74000,
        conversions: 4100,
        roi: 420
      },
      channels: ["Google Ads", "Facebook Ads", "LinkedIn Ads"],
      assets: [
        { type: "image", name: "Display Ad Creatives (15 sizes)", status: "ready" },
        { type: "copy", name: "Ad Copy Variations (20)", status: "ready" },
        { type: "landing-page", name: "Conversion Landing Pages (3)", status: "ready" },
        { type: "video", name: "Video Ads (6 variations)", status: "ready" }
      ],
      description: "Advanced retargeting campaign with personalized messaging based on user behavior and funnel stage, optimized for maximum conversion rates."
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "paused": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "draft": return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      case "completed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getAssetStatusIcon = (status: string) => {
    switch (status) {
      case "ready": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "review": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "copy": return <FileText className="h-4 w-4" />;
      case "landing-page": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            Marketing Campaigns
          </h1>
          <p className="text-muted-foreground">
            AI-powered marketing campaign management
          </p>
        </div>
        <Button className="rounded-full shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">4</span>
                <span className="text-xs text-muted-foreground leading-none">Active Campaigns</span>
              </div>
            </div>
            <span className="text-xs text-green-600 flex-shrink-0 leading-none">+2</span>
          </div>
        </Card>

        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">$180K</span>
                <span className="text-xs text-muted-foreground leading-none">Budget</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 leading-none">49%</span>
          </div>
        </Card>

        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">10.6M</span>
                <span className="text-xs text-muted-foreground leading-none">Impressions</span>
              </div>
            </div>
            <span className="text-xs text-green-600 flex-shrink-0 leading-none">+23%</span>
          </div>
        </Card>

        <Card className="px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="leading-none">256%</span>
                <span className="text-xs text-muted-foreground leading-none">Avg. ROI</span>
              </div>
            </div>
            <span className="text-xs text-green-600 flex-shrink-0 leading-none">+18%</span>
          </div>
        </Card>
      </div>

      {/* AI Suggestion Card */}
      <Card className="p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1.5 text-sm">AI Campaign Insights</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Based on your recent campaigns, I recommend increasing budget allocation to the Q4 Product Launch Campaign by 15% and creating a retargeting campaign for visitors who engaged with holiday content. Would you like me to create these optimizations?
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-full h-7 text-xs">
                Apply Recommendations
              </Button>
              <Button size="sm" variant="outline" className="rounded-full h-7 text-xs">
                Tell Me More
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Campaign Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => {
          const budgetPercentage = (campaign.spent / campaign.budget) * 100;
          const roiColor = campaign.kpis.roi >= 300 ? 'text-green-600' : campaign.kpis.roi >= 200 ? 'text-blue-600' : campaign.kpis.roi >= 100 ? 'text-orange-600' : 'text-red-600';
          const roiBgColor = campaign.kpis.roi >= 300 ? 'from-green-500/10 to-green-500/5' : campaign.kpis.roi >= 200 ? 'from-blue-500/10 to-blue-500/5' : campaign.kpis.roi >= 100 ? 'from-orange-500/10 to-orange-500/5' : 'from-red-500/10 to-red-500/5';
          const statusGlow = campaign.status === 'active' ? 'ring-2 ring-green-500/20' : '';
          
          return (
            <Card
              key={campaign.id}
              className={`p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-0 rounded-xl hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all cursor-pointer group relative overflow-hidden ${statusGlow}`}
              onClick={() => setSelectedCampaign(campaign)}
            >
              {/* Active Status Pulse */}
              {campaign.status === 'active' && (
                <div className="absolute top-4 right-4 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
              
              {/* Header with Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="mb-1 group-hover:text-primary transition-colors text-sm leading-tight">{campaign.name}</h3>
                  <p className="text-xs text-muted-foreground">{campaign.type}</p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(campaign.status)} border rounded-full capitalize text-xs ml-2`}>
                  {campaign.status}
                </Badge>
              </div>

              {/* Mini Sparkline Chart - Performance Trend */}
              <div className="mb-3 h-12 flex items-end gap-0.5">
                {[45, 52, 48, 61, 58, 67, 72, 68, 75, 78, 82, 77, 85, 88, 91].map((value, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t ${campaign.status === 'active' ? 'bg-gradient-to-t from-blue-500 to-blue-400' : 'bg-gradient-to-t from-gray-400 to-gray-300'} transition-all group-hover:from-primary group-hover:to-primary/80`}
                    style={{ height: `${value}%`, opacity: 0.3 + (idx / 15) * 0.7 }}
                  />
                ))}
              </div>

              {/* Budget Ring Chart with KPIs */}
              <div className="flex items-center gap-4 mb-3 p-3 bg-gradient-to-br ${roiBgColor} rounded-lg">
                {/* Budget Ring */}
                <div className="relative">
                  <svg width="48" height="48" className="transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-gray-200"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - budgetPercentage / 100)}`}
                      className={budgetPercentage > 80 ? 'text-orange-500' : 'text-green-500'}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs">{Math.round(budgetPercentage)}%</span>
                  </div>
                </div>
                
                {/* KPIs Grid */}
                <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Impressions</p>
                    <p className="font-medium">{formatNumber(campaign.kpis.impressions)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clicks</p>
                    <p className="font-medium">{formatNumber(campaign.kpis.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversions</p>
                    <p className="font-medium">{formatNumber(campaign.kpis.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROI</p>
                    <p className={`font-medium ${roiColor}`}>{campaign.kpis.roi}%</p>
                  </div>
                </div>
              </div>

              {/* Channel Icons */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <span className="text-xs text-muted-foreground">Channels:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {campaign.channels.map((channel, idx) => {
                    const channelIcons: Record<string, any> = {
                      'Email': Mail,
                      'Social Media': Share2,
                      'Paid Ads': Target,
                      'Content Marketing': FileText,
                      'Marketing Automation': Sparkles,
                      'LinkedIn': Users,
                      'Twitter': Share2,
                      'Instagram': ImageIcon,
                      'Facebook': Users,
                      'Webinar': Video,
                      'Google Ads': Target,
                      'Facebook Ads': Target,
                      'LinkedIn Ads': Target,
                      'Blog': FileText,
                      'SEO': BarChart3
                    };
                    const Icon = channelIcons[channel] || Share2;
                    return (
                      <div
                        key={idx}
                        className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group/icon hover:from-blue-500/20 hover:to-purple-500/20 transition-all"
                        title={channel}
                      >
                        <Icon className="h-3 w-3 text-blue-600" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Asset Preview Grid */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Assets ({campaign.assets.length})</p>
                <div className="flex items-center gap-1.5">
                  {campaign.assets.slice(0, 5).map((asset, idx) => {
                    const assetColors = {
                      'image': 'from-green-500/20 to-green-600/20 text-green-600',
                      'video': 'from-purple-500/20 to-purple-600/20 text-purple-600',
                      'copy': 'from-blue-500/20 to-blue-600/20 text-blue-600',
                      'landing-page': 'from-orange-500/20 to-orange-600/20 text-orange-600'
                    };
                    return (
                      <div
                        key={idx}
                        className={`h-8 w-8 rounded-lg bg-gradient-to-br ${assetColors[asset.type]} flex items-center justify-center relative group/asset`}
                        title={asset.name}
                      >
                        {getAssetIcon(asset.type)}
                        {asset.status === 'ready' && (
                          <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full border border-white" />
                        )}
                        {asset.status === 'in-progress' && (
                          <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full border border-white animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                  {campaign.assets.length > 5 && (
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{campaign.assets.length - 5}
                    </div>
                  )}
                </div>
              </div>

              {/* Budget Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>${formatNumber(campaign.spent)} / ${formatNumber(campaign.budget)}</span>
                <span>{campaign.startDate} - {campaign.endDate}</span>
              </div>

              <Button size="sm" variant="outline" className="w-full rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                View Campaign Details
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Campaign Detail Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="!w-[95vw] !max-w-[1800px] h-[90vh] p-0 flex flex-col sm:!max-w-[1800px]">
          {selectedCampaign && (
            <>
              <DialogHeader className="p-6 pb-4 border-b shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <DialogTitle>{selectedCampaign.name}</DialogTitle>
                      <Badge variant="outline" className={`${getStatusColor(selectedCampaign.status)} border rounded-full capitalize`}>
                        {selectedCampaign.status}
                      </Badge>
                    </div>
                    <DialogDescription>
                      {selectedCampaign.description}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {selectedCampaign.status === "active" ? (
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Campaign
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Play className="h-4 w-4 mr-2" />
                        Resume Campaign
                      </Button>
                    )}
                    <Button size="sm" className="rounded-full">
                      Edit Campaign
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-hidden min-h-0">
                <Tabs defaultValue="overview" className="h-full flex flex-col">
                  <div className="px-6 pt-4 border-b shrink-0">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="leads">Leads</TabsTrigger>
                      <TabsTrigger value="assets">Assets</TabsTrigger>
                      <TabsTrigger value="kpis">KPIs & Analytics</TabsTrigger>
                      <TabsTrigger value="channels">Channels</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6 pb-8">
                        <TabsContent value="overview" className="mt-0 space-y-6">
                        {/* Quick Actions Toolbar */}
                        <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="rounded-full h-8">
                              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                              Edit Budget
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full h-8">
                              <Copy className="h-3.5 w-3.5 mr-1.5" />
                              Duplicate
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full h-8">
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Export Report
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <Activity className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          </div>
                        </div>

                        {/* Campaign Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                          <Card className="p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Eye className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Impressions</p>
                                <p className="text-xl">{formatNumber(selectedCampaign.kpis.impressions)}</p>
                              </div>
                            </div>
                            <p className="text-xs text-green-600">+12% vs target</p>
                          </Card>

                          <Card className="p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <MousePointer className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Clicks</p>
                                <p className="text-xl">{formatNumber(selectedCampaign.kpis.clicks)}</p>
                              </div>
                            </div>
                            <p className="text-xs text-green-600">+8% vs target</p>
                          </Card>

                          <Card className="p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Target className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Conversions</p>
                                <p className="text-xl">{formatNumber(selectedCampaign.kpis.conversions)}</p>
                              </div>
                            </div>
                            <p className="text-xs text-green-600">+15% vs target</p>
                          </Card>

                          <Card className="p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">ROI</p>
                                <p className="text-xl">{selectedCampaign.kpis.roi}%</p>
                              </div>
                            </div>
                            <p className="text-xs text-green-600">+22% vs target</p>
                          </Card>
                        </div>

                        {/* Performance Chart & Real-time Activity */}
                        <div className="grid gap-6 lg:grid-cols-3">
                          {/* Performance Over Time Chart */}
                          <Card className="p-6 shadow-sm lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Performance Trends
                              </h3>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-7 text-xs">7D</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs bg-primary text-primary-foreground">14D</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs">30D</Button>
                              </div>
                            </div>
                            {selectedCampaign.performanceData && (
                              <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={selectedCampaign.performanceData}>
                                  <defs>
                                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                  />
                                  <Legend />
                                  <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorImpressions)" name="Impressions" />
                                  <Area type="monotone" dataKey="clicks" stroke="#a855f7" fillOpacity={1} fill="url(#colorClicks)" name="Clicks" />
                                  <Area type="monotone" dataKey="conversions" stroke="#22c55e" fillOpacity={1} fill="url(#colorConversions)" name="Conversions" />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </Card>

                          {/* Real-time Activity Stream */}
                          <Card className="p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2">
                              <Zap className="h-5 w-5 text-orange-500" />
                              Live Activity
                            </h3>
                            <ScrollArea className="h-[240px] pr-4">
                              <div className="space-y-3">
                                {selectedCampaign.recentActivity?.map((activity, idx) => (
                                  <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                                      activity.type === 'conversion' ? 'bg-green-500' :
                                      activity.type === 'milestone' ? 'bg-purple-500' :
                                      activity.type === 'engagement' ? 'bg-blue-500' :
                                      'bg-gray-400'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm leading-tight">{activity.description}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </Card>
                        </div>

                        {/* Channel Breakdown & Conversion Funnel */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* Channel Performance */}
                          <Card className="p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2">
                              <Share2 className="h-5 w-5" />
                              Channel Performance
                            </h3>
                            {selectedCampaign.channelBreakdown && (
                              <div className="space-y-4">
                                {selectedCampaign.channelBreakdown.map((channel, idx) => (
                                  <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">{channel.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">${formatNumber(channel.spend)}</span>
                                        <Badge variant="outline" className={`text-xs ${
                                          channel.roi >= 400 ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                          channel.roi >= 300 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                          'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                        }`}>
                                          {channel.roi}% ROI
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                      <span>{formatNumber(channel.impressions)} views</span>
                                      <span>{formatNumber(channel.clicks)} clicks</span>
                                      <span>{formatNumber(channel.conversions)} conv</span>
                                    </div>
                                    <Progress value={(channel.conversions / selectedCampaign.kpis.conversions) * 100} className="h-1.5" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>

                          {/* Conversion Funnel */}
                          <Card className="p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Conversion Funnel
                            </h3>
                            {selectedCampaign.funnelData && (
                              <div className="space-y-4">
                                {selectedCampaign.funnelData.map((stage, idx) => {
                                  const percentage = idx === 0 ? 100 : (stage.count / selectedCampaign.funnelData![0].count) * 100;
                                  const dropOff = idx > 0 ? ((selectedCampaign.funnelData![idx - 1].count - stage.count) / selectedCampaign.funnelData![idx - 1].count) * 100 : 0;
                                  
                                  return (
                                    <div key={idx} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm">{stage.stage}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">{formatNumber(stage.count)}</span>
                                          <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                                        </div>
                                      </div>
                                      <Progress value={percentage} className="h-1.5" />
                                      {idx > 0 && dropOff > 0 && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                          <TrendingDown className="h-3 w-3" />
                                          {dropOff.toFixed(1)}% drop-off
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </Card>
                        </div>

                        {/* Budget & Audience Insights */}
                        <div className="grid gap-6 lg:grid-cols-3">
                          {/* Enhanced Budget Section */}
                          <Card className="p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Budget Overview
                            </h3>
                            <div className="space-y-4">
                              {/* Burn Rate Gauge */}
                              <div className="flex items-center justify-center mb-4">
                                <div className="relative w-32 h-32">
                                  <svg className="transform -rotate-90 w-32 h-32">
                                    <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                    <circle 
                                      cx="64" 
                                      cy="64" 
                                      r="56" 
                                      fill="none" 
                                      stroke="#22c55e" 
                                      strokeWidth="8"
                                      strokeDasharray={`${2 * Math.PI * 56}`}
                                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (selectedCampaign.spent / selectedCampaign.budget))}`}
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl">{Math.round((selectedCampaign.spent / selectedCampaign.budget) * 100)}%</p>
                                    <p className="text-xs text-muted-foreground">Spent</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Total Budget</span>
                                  <span className="text-sm">${formatNumber(selectedCampaign.budget)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Spent</span>
                                  <span className="text-sm">${formatNumber(selectedCampaign.spent)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Remaining</span>
                                  <span className="text-sm">${formatNumber(selectedCampaign.budget - selectedCampaign.spent)}</span>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Gauge className="h-3.5 w-3.5" />
                                    Burn Rate
                                  </span>
                                  <span className="text-sm">${Math.round(selectedCampaign.spent / 6).toLocaleString()}/day</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Pacing</span>
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                    On Track
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Projected End</span>
                                  <span className="text-sm">{selectedCampaign.endDate}</span>
                                </div>
                              </div>
                            </div>
                          </Card>

                          {/* Audience Demographics */}
                          <Card className="p-6 shadow-sm lg:col-span-2">
                            <h3 className="mb-4 flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Audience Insights
                            </h3>
                            {selectedCampaign.audienceInsights && (
                              <div className="grid gap-6 md:grid-cols-3">
                                {/* Age Distribution */}
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Age Groups</p>
                                  <div className="space-y-2">
                                    {selectedCampaign.audienceInsights.demographics.map((demo, idx) => (
                                      <div key={idx}>
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs">{demo.age}</span>
                                          <span className="text-xs text-muted-foreground">{demo.percentage}%</span>
                                        </div>
                                        <Progress value={demo.percentage} className="h-1.5" />
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Top Locations */}
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Top Locations</p>
                                  <div className="space-y-2">
                                    {selectedCampaign.audienceInsights.locations.map((location, idx) => (
                                      <div key={idx} className="flex items-center justify-between">
                                        <span className="text-xs flex items-center gap-1">
                                          <MapPin className="h-3 w-3 text-muted-foreground" />
                                          {location.city}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{location.percentage}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Top Interests */}
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">Interests</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedCampaign.audienceInsights.interests.map((interest, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {interest}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Card>
                        </div>

                        {/* AI-Powered Actionable Insights */}
                        <Card className="p-6 shadow-sm bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20">
                          <h3 className="mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            AI Optimization Suggestions
                          </h3>
                          {selectedCampaign.aiSuggestions && (
                            <div className="space-y-3">
                              {selectedCampaign.aiSuggestions.map((suggestion, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                                    suggestion.priority === 'high' ? 'bg-red-500/10' :
                                    suggestion.priority === 'medium' ? 'bg-orange-500/10' :
                                    'bg-blue-500/10'
                                  }`}>
                                    <Zap className={`h-5 w-5 ${
                                      suggestion.priority === 'high' ? 'text-red-500' :
                                      suggestion.priority === 'medium' ? 'text-orange-500' :
                                      'text-blue-500'
                                    }`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <p className="text-sm">{suggestion.title}</p>
                                      <Badge variant="outline" className={`text-xs shrink-0 ${
                                        suggestion.priority === 'high' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                        suggestion.priority === 'medium' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                        'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                      }`}>
                                        {suggestion.priority}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-green-600 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        Projected Impact: {suggestion.impact}
                                      </p>
                                      <div className="flex gap-2">
                                        <Button size="sm" className="h-7 text-xs rounded-full">
                                          Apply Now
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full">
                                          Learn More
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </TabsContent>

                      <TabsContent value="leads" className="mt-0 space-y-6">
                        {/* Lead Stats Overview */}
                        {selectedCampaign.leadStats && (
                          <div className="grid gap-4 md:grid-cols-4">
                            <Card className="p-4 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                                  <UserPlus className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Leads</p>
                                  <p className="text-2xl">{selectedCampaign.leadStats.total}</p>
                                </div>
                              </div>
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +12% this week
                              </p>
                            </Card>

                            <Card className="p-4 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Qualified (SQL)</p>
                                  <p className="text-2xl">{selectedCampaign.leadStats.qualified}</p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {((selectedCampaign.leadStats.qualified / selectedCampaign.leadStats.total) * 100).toFixed(0)}% conversion rate
                              </p>
                            </Card>

                            <Card className="p-4 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                                  <Star className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Avg Lead Score</p>
                                  <p className="text-2xl">{selectedCampaign.leadStats.avgScore.toFixed(0)}</p>
                                </div>
                              </div>
                              <Progress value={selectedCampaign.leadStats.avgScore} className="h-1.5 mt-2" />
                            </Card>

                            <Card className="p-4 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center">
                                  <Sparkles className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">AI Enriched</p>
                                  <p className="text-2xl">{selectedCampaign.leadStats.enrichmentRate.toFixed(0)}%</p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {Math.round((selectedCampaign.leadStats.enrichmentRate / 100) * selectedCampaign.leadStats.total)} of {selectedCampaign.leadStats.total} leads
                              </p>
                            </Card>
                          </div>
                        )}

                        {/* Charts Section */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* Lead Qualification Breakdown */}
                          {selectedCampaign.leadStats && (
                            <Card className="p-6 shadow-sm">
                              <h3 className="mb-6 flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Lead Qualification Status
                              </h3>
                              <div className="space-y-4">
                                {selectedCampaign.leadStats.byQualification.map((qual, idx) => (
                                  <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: qual.color }}></div>
                                        <span className="text-sm">{qual.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{qual.count}</span>
                                        <span className="text-xs text-muted-foreground">
                                          ({((qual.count / selectedCampaign.leadStats!.total) * 100).toFixed(0)}%)
                                        </span>
                                      </div>
                                    </div>
                                      <Progress 
                                      value={(qual.count / selectedCampaign.leadStats!.total) * 100} 
                                      className="h-1.5"
                                      style={{ 
                                        // @ts-expect-error -- CSS custom property not in type definition
                                        '--progress-background': qual.color 
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}

                          {/* Lead Source Performance */}
                          {selectedCampaign.leadStats && (
                            <Card className="p-6 shadow-sm">
                              <h3 className="mb-6 flex items-center gap-2">
                                <Share2 className="h-5 w-5" />
                                Lead Source Performance
                              </h3>
                              <div className="space-y-4">
                                {selectedCampaign.leadStats.bySource.map((source, idx) => (
                                  <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">{source.source}</span>
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                                          Score: {source.score}
                                        </Badge>
                                        <span className="text-sm">{source.count} leads</span>
                                      </div>
                                    </div>
                                    <Progress value={(source.count / selectedCampaign.leadStats!.total) * 100} className="h-1.5" />
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}
                        </div>

                        {/* Leads List with AI Enrichment */}
                        <Card className="shadow-sm">
                          <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="mb-1">Lead Database</h3>
                                <p className="text-sm text-muted-foreground">AI-enriched leads with company data and engagement scores</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="rounded-full">
                                  <Filter className="h-4 w-4 mr-2" />
                                  Filter
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-full">
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="divide-y">
                            {selectedCampaign.leads && selectedCampaign.leads.map((lead) => (
                              <div key={lead.id} className="p-6 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start gap-4">
                                  {/* Lead Avatar & Basic Info */}
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0">
                                    {lead.name.split(' ').map(n => n[0]).join('')}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="truncate">{lead.name}</p>
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs shrink-0 ${
                                              lead.qualification === 'SQL' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                              lead.qualification === 'MQL' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                              lead.qualification === 'Cold' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                              'bg-gray-500/10 text-gray-600 border-gray-500/20'
                                            }`}
                                          >
                                            {lead.qualification}
                                          </Badge>
                                          {lead.enrichmentStatus === 'complete' && (
                                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                                              <Sparkles className="h-3 w-3 mr-1" />
                                              AI Enriched
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <span>{lead.title}</span>
                                          <span>•</span>
                                          <div className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            <span>{lead.company}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Lead Score */}
                                      <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">Score</span>
                                          <div className="flex items-center gap-1">
                                            <Star className={`h-4 w-4 ${
                                              lead.leadScore >= 80 ? 'text-green-500 fill-green-500' :
                                              lead.leadScore >= 60 ? 'text-blue-500 fill-blue-500' :
                                              'text-orange-500 fill-orange-500'
                                            }`} />
                                            <span className="text-sm">{lead.leadScore}</span>
                                          </div>
                                        </div>
                                        <Progress value={lead.leadScore} className="h-1 w-16" />
                                      </div>
                                    </div>

                                    {/* AI-Enriched Details Grid */}
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-3 p-3 bg-muted/30 rounded-lg">
                                      <div className="flex items-center gap-2 text-xs">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground truncate">{lead.email}</span>
                                      </div>
                                      {lead.phone && (
                                        <div className="flex items-center gap-2 text-xs">
                                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                          <span className="text-muted-foreground">{lead.phone}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 text-xs">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">{lead.location}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">{lead.industry}</span>
                                      </div>
                                    </div>

                                    {/* Enhanced AI Data */}
                                    {lead.enrichmentStatus === 'complete' && (
                                      <div className="grid gap-3 md:grid-cols-3 mb-3 text-xs">
                                        {lead.companySize && (
                                          <div>
                                            <span className="text-muted-foreground">Company Size: </span>
                                            <span>{lead.companySize}</span>
                                          </div>
                                        )}
                                        {lead.revenue && (
                                          <div>
                                            <span className="text-muted-foreground">Revenue: </span>
                                            <span>{lead.revenue}</span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-muted-foreground">Engagement: </span>
                                          <span className={
                                            lead.engagementScore >= 80 ? 'text-green-600' :
                                            lead.engagementScore >= 60 ? 'text-blue-600' :
                                            'text-orange-600'
                                          }>{lead.engagementScore}/100</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Source & Activity */}
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Share2 className="h-3 w-3" />
                                          <span>{lead.source}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Activity className="h-3 w-3" />
                                          <span>{lead.lastActivity}</span>
                                        </div>
                                      </div>

                                      {/* Quick Actions */}
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => handleContactLead(lead)}>
                                          <Send className="h-3.5 w-3.5 mr-1.5" />
                                          Contact
                                        </Button>
                                        <Button size="sm" className="h-8 rounded-full">
                                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                          View Full Profile
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Interests Tags */}
                                    {lead.interests.length > 0 && (
                                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                        <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <div className="flex flex-wrap gap-1">
                                          {lead.interests.map((interest, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs rounded-full">
                                              {interest}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </TabsContent>

                      <TabsContent value="assets" className="mt-0">
                        <div className="space-y-4">
                          {selectedCampaign.assets.map((asset, idx) => (
                            <Card key={idx} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center shrink-0">
                                  {getAssetIcon(asset.type)}
                                </div>
                                <div className="flex-1">
                                  <p className="mb-1">{asset.name}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs rounded-full capitalize">
                                      {asset.type.replace("-", " ")}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {getAssetStatusIcon(asset.status)}
                                      <span className="capitalize">{asset.status.replace("-", " ")}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="rounded-full">
                                    Preview
                                  </Button>
                                  <Button size="sm" variant="ghost" className="rounded-full">
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                          <Button variant="outline" className="w-full rounded-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Asset
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="kpis" className="mt-0">
                        <div className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-3">
                            <Card className="p-4 shadow-sm">
                              <p className="text-sm text-muted-foreground mb-1">Click-Through Rate</p>
                              <p className="text-2xl mb-1">
                                {((selectedCampaign.kpis.clicks / selectedCampaign.kpis.impressions) * 100).toFixed(2)}%
                              </p>
                              <p className="text-xs text-green-600">+0.3% vs last week</p>
                            </Card>
                            <Card className="p-4 shadow-sm">
                              <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                              <p className="text-2xl mb-1">
                                {((selectedCampaign.kpis.conversions / selectedCampaign.kpis.clicks) * 100).toFixed(2)}%
                              </p>
                              <p className="text-xs text-green-600">+0.5% vs last week</p>
                            </Card>
                            <Card className="p-4 shadow-sm">
                              <p className="text-sm text-muted-foreground mb-1">Cost Per Conversion</p>
                              <p className="text-2xl mb-1">
                                ${(selectedCampaign.spent / selectedCampaign.kpis.conversions).toFixed(2)}
                              </p>
                              <p className="text-xs text-green-600">-$2.40 vs last week</p>
                            </Card>
                          </div>

                          <Card className="p-6 shadow-sm">
                            <h3 className="mb-4">Performance Metrics</h3>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm">Email Open Rate</span>
                                  <span className="text-sm">42%</span>
                                </div>
                                <Progress value={42} className="h-2" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm">Social Engagement Rate</span>
                                  <span className="text-sm">8.5%</span>
                                </div>
                                <Progress value={85} className="h-2" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm">Landing Page Conversion</span>
                                  <span className="text-sm">12.3%</span>
                                </div>
                                <Progress value={12.3} className="h-2" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm">Ad Quality Score</span>
                                  <span className="text-sm">9.2/10</span>
                                </div>
                                <Progress value={92} className="h-2" />
                              </div>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="channels" className="mt-0">
                        <div className="grid gap-4 md:grid-cols-2">
                          {selectedCampaign.channels.map((channel, idx) => (
                            <Card key={idx} className="p-6 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                                  <Share2 className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                  <h3 className="mb-1">{channel}</h3>
                                  <Badge variant="secondary" className="text-xs rounded-full">
                                    Active
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Impressions</span>
                                  <span className="text-sm">{formatNumber(Math.floor(selectedCampaign.kpis.impressions / selectedCampaign.channels.length))}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Clicks</span>
                                  <span className="text-sm">{formatNumber(Math.floor(selectedCampaign.kpis.clicks / selectedCampaign.channels.length))}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Budget Allocation</span>
                                  <span className="text-sm">${formatNumber(selectedCampaign.budget / selectedCampaign.channels.length)}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="timeline" className="mt-0">
                        <Card className="p-6 shadow-sm">
                          <h3 className="mb-6">Campaign Timeline</h3>
                          <div className="space-y-6">
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                                  <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="w-0.5 h-full bg-green-500 mt-2"></div>
                              </div>
                              <div className="flex-1 pb-6">
                                <p className="mb-1">Campaign Launched</p>
                                <p className="text-sm text-muted-foreground mb-2">{selectedCampaign.startDate}</p>
                                <p className="text-sm">All assets deployed and campaigns activated across channels.</p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                                  <BarChart3 className="h-5 w-5" />
                                </div>
                                <div className="w-0.5 h-full bg-blue-500 mt-2"></div>
                              </div>
                              <div className="flex-1 pb-6">
                                <p className="mb-1">First Milestone Reached</p>
                                <p className="text-sm text-muted-foreground mb-2">Nov 15, 2025</p>
                                <p className="text-sm">Hit 1M impressions and 40K clicks ahead of schedule.</p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white shrink-0">
                                  <TrendingUp className="h-5 w-5" />
                                </div>
                                <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                              </div>
                              <div className="flex-1 pb-6">
                                <p className="mb-1">Mid-Campaign Optimization</p>
                                <p className="text-sm text-muted-foreground mb-2">Nov 30, 2025 (Upcoming)</p>
                                <p className="text-sm">Scheduled review and budget reallocation based on performance.</p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white shrink-0">
                                  <Calendar className="h-5 w-5" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="mb-1">Campaign End</p>
                                <p className="text-sm text-muted-foreground mb-2">{selectedCampaign.endDate}</p>
                                <p className="text-sm">Final reporting and analysis of campaign performance.</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                        </TabsContent>
                      </div>
                    </ScrollArea>
                  </div>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Lead Dialog */}
      <Dialog open={!!contactingLead} onOpenChange={() => setContactingLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          {contactingLead && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Header */}
              <DialogHeader className="px-6 py-5 border-b">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0">
                    {contactingLead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-2 mb-1">
                      {contactingLead.name}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          contactingLead.qualification === 'SQL' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                          contactingLead.qualification === 'MQL' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                          'bg-orange-500/10 text-orange-600 border-orange-500/20'
                        }`}
                      >
                        {contactingLead.qualification}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {contactingLead.title} @ {contactingLead.company}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className={`h-5 w-5 ${
                      contactingLead.leadScore >= 80 ? 'text-green-500 fill-green-500' :
                      contactingLead.leadScore >= 60 ? 'text-blue-500 fill-blue-500' :
                      'text-orange-500 fill-orange-500'
                    }`} />
                    <span className="text-sm">{contactingLead.leadScore}</span>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6 pb-2">
                  {/* Quick Contact Info */}
                  <Card className="p-4 bg-muted/30 shadow-none border-muted">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Quick Contact
                      </h4>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs rounded-full"
                        onClick={() => {
                          navigator.clipboard.writeText(`${contactingLead.email}${contactingLead.phone ? `, ${contactingLead.phone}` : ''}`);
                          toast.success('Contact info copied!');
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => {
                          navigator.clipboard.writeText(contactingLead.email);
                          toast.success('Email copied!');
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{contactingLead.email}</span>
                        </div>
                        <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {contactingLead.phone && (
                        <div className="flex items-center justify-between p-2 bg-background rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => {
                            navigator.clipboard.writeText(contactingLead.phone!);
                            toast.success('Phone copied!');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contactingLead.phone}</span>
                          </div>
                          <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* AI-Generated Email */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          AI-Generated Email
                        </h4>
                        <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                          Personalized for {contactingLead.name.split(' ')[0]}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setIsEditingEmail(!isEditingEmail)}
                      >
                        {isEditingEmail ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </>
                        ) : (
                          <>
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Subject Line */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Subject</label>
                      {isEditingEmail ? (
                        <Input
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <div className="p-3 bg-muted/30 rounded-lg border">
                          <p className="text-sm">{emailSubject}</p>
                        </div>
                      )}
                    </div>

                    {/* Email Body */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Message</label>
                        <span className="text-xs text-muted-foreground">{emailBody.length} characters</span>
                      </div>
                      {isEditingEmail ? (
                        <Textarea
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          className="min-h-[300px] resize-none"
                        />
                      ) : (
                        <div className="p-4 bg-muted/30 rounded-lg border">
                          <pre className="text-sm whitespace-pre-wrap font-sans">{emailBody}</pre>
                        </div>
                      )}
                    </div>

                    {/* AI Reasoning */}
                    <Card className="p-3 bg-blue-500/5 border-blue-500/20 shadow-none">
                      <div className="flex gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground">
                          <span className="text-blue-600">Why this message?</span> AI personalized this email based on {contactingLead.name.split(' ')[0]}'s recent activity 
                          ({contactingLead.lastActivity.toLowerCase()}), their role as {contactingLead.title}, 
                          and {contactingLead.qualification} qualification status.
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </ScrollArea>

              {/* Action Footer */}
              <div className="px-6 py-4 border-t bg-muted/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
                        toast.success('Email copied to clipboard!');
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                    {localStorage.getItem('integration_gmail') === 'connected' ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Gmail Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-orange-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Gmail Required</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setContactingLead(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSendEmail} className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <Send className="h-4 w-4 mr-2" />
                      Send via Gmail
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

