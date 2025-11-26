"use client";
import { Badge } from "../components/ui/badge";
import { Sparkles, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { HeroSection } from "../components/landing/HeroSection";
import { FooterCTA } from "../components/landing/FooterCTA";
import { Footer } from "../components/landing/Footer";
import { SmartNavigation } from "../components/shared/SmartNavigation";
import { EnhancedThreePillars } from "../components/landing/EnhancedThreePillars";
import { EnhancedBenefits } from "../components/landing/EnhancedBenefits";
import { SectionDivider } from "../components/shared/SectionDivider";
import { StockTickerStandalone } from "../components/landing/StockTicker";
import { DemoWrapper } from "../components/shared/DemoWrapper";
import DashboardDashboard from "../components/dashboard/DashboardDashboard";
import CRMDashboard from "../components/crm/CRMDashboard";
import StudioDashboard from "../components/studio/StudioDashboard";
import MarketingDashboard from "../components/marketing/MarketingDashboard";

interface LandingProps {
  onEnterApp?: () => void;
}

export function Landing({ onEnterApp }: LandingProps = {}) {

  return (
    <div className="min-h-screen bg-white">
      {/* Smart Navigation */}
      <SmartNavigation onEnterApp={onEnterApp} />

      {/* Epic Hero Section */}
      {onEnterApp && <HeroSection onEnterApp={onEnterApp} />}

      {/* Live Activity Ticker */}
      <section className="py-12 bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-3 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
              <Activity className="h-3 w-3 mr-1.5 animate-pulse" />
              Live Now
            </Badge>
            <h2 className="text-2xl mb-2">AI Agents Working Right Now</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Watch real-time activity as AI agents process tasks, analyze data, and automate workflows across our platform
            </p>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <StockTickerStandalone />
        </motion.div>
      </section>

      {/* Section Divider */}
      <SectionDivider variant="sparkle" />

      {/* Enhanced Three Pillars Section */}
      <EnhancedThreePillars />

      {/* Section Divider */}
      <SectionDivider variant="dots" />

      {/* Platform Showcase Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 shadow-lg">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Platform Features
              </Badge>
              <h2 className="mb-4 text-3xl lg:text-4xl">See Your Platform in Action</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Real screenshots from our platform. Experience how AI agents, workflows, and intelligent automation work together seamlessly.
              </p>
            </motion.div>
          </div>

          <div className="space-y-32">
            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    AI Assistant
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">Real-Time AI Dashboard</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Monitor all AI agent activity with live updates, quick actions, and instant insights into your automation workflows. Your command center for productivity.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Live Updates
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">24/7 Monitoring</Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">AI-Powered</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <DemoWrapper scale={0.9} height={900} needsSidebar={false}>
                    <DashboardDashboard initialData={{
                      stats: {
                        activeAgents: 12,
                        tasksCompleted: 1247,
                        hoursSaved: 342,
                      },
                      agents: [
                        {
                          id: "1",
                          name: "Email Triage Agent",
                          initials: "ET",
                          color: "bg-blue-500",
                          message: "Processed 12 high-priority emails",
                          time: "2 min ago",
                          active: true,
                          status: "Active now",
                          role: "email",
                          conversation: [],
                        },
                        {
                          id: "2",
                          name: "CRM Data Sync",
                          initials: "CD",
                          color: "bg-cyan-500",
                          message: "Synced 24 contacts to Salesforce",
                          time: "5 min ago",
                          active: true,
                          status: "Active now",
                          role: "sync",
                          conversation: [],
                        },
                      ],
                      events: [],
                    }} />
                  </DemoWrapper>
                </div>
              </div>
            </motion.div>

            {/* Studio Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Workflow Builder
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">Visual Workflow Studio</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Build complex automation workflows with our intuitive drag-and-drop interface. Connect your tools, define logic, and watch AI agents execute your processes flawlessly.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Drag & Drop
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0">No Code</Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-0">Visual Builder</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <DemoWrapper scale={0.9} height={900} needsSidebar={false}>
                    <StudioDashboard />
                  </DemoWrapper>
                </div>
              </div>
            </motion.div>

            {/* CRM Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full" />
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    CRM
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">AI-Native CRM</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Auto-transcribe calls and meetings, track deals with AI-powered insights, and manage your entire sales pipeline. Every conversation becomes actionable data.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Transcribe
                  </Badge>
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-0">Smart Insights</Badge>
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-0">Deal Tracking</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <DemoWrapper scale={0.9} height={900} needsSidebar={false}>
                    <CRMDashboard
                      initialLeads={[
                        {
                          id: "1",
                          name: "Sarah Johnson",
                          email: "sarah@techcorp.com",
                          company: "TechCorp",
                          title: "VP of Sales",
                          phone: "+1 (555) 123-4567",
                          stage: "qualified",
                          score: 85,
                          estimatedValue: 50000,
                          lastContactedAt: new Date(),
                          nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                          interactionCount: 3,
                          source: "Website",
                          tags: ["hot", "enterprise"],
                          notes: "Interested in enterprise plan",
                        },
                        {
                          id: "2",
                          name: "Michael Chen",
                          email: "mchen@innovatehq.com",
                          company: "InnovateHQ",
                          title: "CTO",
                          phone: "+1 (555) 987-6543",
                          stage: "hot",
                          score: 92,
                          estimatedValue: 125000,
                          lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                          nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                          interactionCount: 8,
                          source: "Referral",
                          tags: ["hot", "enterprise", "technical"],
                          notes: "Ready to sign, discussing implementation timeline",
                        },
                        {
                          id: "3",
                          name: "Emily Rodriguez",
                          email: "emily.r@scalefast.io",
                          company: "ScaleFast",
                          title: "Head of Operations",
                          phone: "+1 (555) 456-7890",
                          stage: "warm",
                          score: 72,
                          estimatedValue: 35000,
                          lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                          nextFollowUpAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                          interactionCount: 4,
                          source: "LinkedIn",
                          tags: ["warm", "mid-market"],
                          notes: "Comparing with competitor solutions",
                        },
                        {
                          id: "4",
                          name: "David Kim",
                          email: "dkim@nexusventures.com",
                          company: "Nexus Ventures",
                          title: "Managing Partner",
                          phone: "+1 (555) 321-0987",
                          stage: "new",
                          score: 65,
                          estimatedValue: 200000,
                          lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                          nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                          interactionCount: 1,
                          source: "Conference",
                          tags: ["new", "enterprise", "investor"],
                          notes: "Met at SaaS Summit, interested in portfolio-wide deployment",
                        },
                        {
                          id: "5",
                          name: "Amanda Foster",
                          email: "afoster@brightpath.co",
                          company: "BrightPath",
                          title: "CEO",
                          phone: "+1 (555) 654-3210",
                          stage: "qualified",
                          score: 78,
                          estimatedValue: 45000,
                          lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                          nextFollowUpAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
                          interactionCount: 5,
                          source: "Webinar",
                          tags: ["qualified", "startup"],
                          notes: "Fast-growing startup, needs scalable solution",
                        },
                        {
                          id: "6",
                          name: "James Wilson",
                          email: "jwilson@globaltech.com",
                          company: "GlobalTech Solutions",
                          title: "Director of IT",
                          phone: "+1 (555) 789-0123",
                          stage: "cold",
                          score: 45,
                          estimatedValue: 75000,
                          lastContactedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                          nextFollowUpAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                          interactionCount: 2,
                          source: "Cold Email",
                          tags: ["cold", "enterprise"],
                          notes: "Initial interest, needs nurturing",
                        },
                      ]}
                      initialOrganizations={[
                        {
                          id: "1",
                          name: "TechCorp Industries",
                          email: "contact@techcorp.com",
                          phone: "+1 (555) 100-2000",
                          website: "https://techcorp.com",
                          status: "active",
                          industry: "Technology",
                          size: "500-1000",
                          revenue: 50000000,
                          notes: "Key enterprise account, multiple stakeholders",
                          tags: ["enterprise", "priority"],
                          lastContactedAt: new Date("2024-11-20"),
                        },
                        {
                          id: "2",
                          name: "InnovateHQ",
                          email: "hello@innovatehq.com",
                          phone: "+1 (555) 200-3000",
                          website: "https://innovatehq.com",
                          status: "active",
                          industry: "Software",
                          size: "100-500",
                          revenue: 25000000,
                          notes: "Fast-moving deal, high priority",
                          tags: ["high-priority", "technical"],
                          lastContactedAt: new Date("2024-11-22"),
                        },
                        {
                          id: "3",
                          name: "ScaleFast",
                          email: "info@scalefast.io",
                          phone: "+1 (555) 300-4000",
                          website: "https://scalefast.io",
                          status: "active",
                          industry: "E-commerce",
                          size: "50-100",
                          revenue: 10000000,
                          notes: "Growing rapidly, looking for automation",
                          tags: ["growth", "startup"],
                          lastContactedAt: new Date("2024-11-18"),
                        },
                      ]}
                      initialContacts={[
                        {
                          id: "1",
                          firstName: "Sarah",
                          lastName: "Johnson",
                          email: "sarah@techcorp.com",
                          company: "TechCorp",
                          title: "VP of Sales",
                          phone: "+1 (555) 123-4567",
                          tags: ["decision-maker", "enterprise"],
                        },
                        {
                          id: "2",
                          firstName: "Michael",
                          lastName: "Chen",
                          email: "mchen@innovatehq.com",
                          company: "InnovateHQ",
                          title: "CTO",
                          phone: "+1 (555) 987-6543",
                          tags: ["technical", "key-stakeholder"],
                        },
                        {
                          id: "3",
                          firstName: "Emily",
                          lastName: "Rodriguez",
                          email: "emily.r@scalefast.io",
                          company: "ScaleFast",
                          title: "Head of Operations",
                          phone: "+1 (555) 456-7890",
                          tags: ["operations", "growth"],
                        },
                      ]}
                      initialDeals={[
                        {
                          id: "1",
                          title: "TechCorp Enterprise License",
                          company: "TechCorp",
                          value: 125000,
                          stage: "negotiation",
                          probability: 75,
                          closeDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                          source: "Website",
                          tags: ["enterprise", "priority"],
                          notes: "Final contract review in progress",
                        },
                        {
                          id: "2",
                          title: "InnovateHQ Annual Contract",
                          company: "InnovateHQ",
                          value: 85000,
                          stage: "proposal",
                          probability: 60,
                          closeDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                          source: "Referral",
                          tags: ["high-value"],
                          notes: "Awaiting budget approval",
                        },
                        {
                          id: "3",
                          title: "ScaleFast Growth Package",
                          company: "ScaleFast",
                          value: 45000,
                          stage: "discovery",
                          probability: 40,
                          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                          source: "LinkedIn",
                          tags: ["growth"],
                          notes: "Discovery call scheduled",
                        },
                      ]}
                      stats={{
                        totalLeads: 6,
                        hotLeads: 2,
                        totalOrgs: 3,
                        totalValue: 530000,
                      }}
                    />
                  </DemoWrapper>
                </div>
              </div>
            </motion.div>

            {/* Marketing Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full" />
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Marketing
                  </Badge>
                </div>
                <h3 className="text-3xl mb-4">Intelligent Marketing Hub</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Launch campaigns, track performance across all channels, and optimize with AI-driven recommendations. Real-time analytics and conversion tracking at your fingertips.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Campaign Management
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-0">Analytics</Badge>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-0">AI Optimization</Badge>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <DemoWrapper scale={0.9} height={900} needsSidebar={false}>
                    <MarketingDashboard
                      initialCampaigns={[
                        {
                          id: "1",
                          name: "Q4 Product Launch",
                          status: "active",
                          budget: 5000000,
                          spent: 2500000,
                          impressions: 125000,
                          clicks: 5000,
                          conversions: 250,
                          roi: 125,
                          startDate: new Date("2024-10-01"),
                          endDate: new Date("2024-12-31"),
                          channels: ["email", "social", "ads"],
                        },
                        {
                          id: "2",
                          name: "Holiday Email Blast",
                          status: "active",
                          budget: 2500000,
                          spent: 1800000,
                          impressions: 85000,
                          clicks: 4200,
                          conversions: 380,
                          roi: 165,
                          startDate: new Date("2024-11-15"),
                          endDate: new Date("2024-12-25"),
                          channels: ["email"],
                        },
                        {
                          id: "3",
                          name: "LinkedIn Lead Gen",
                          status: "active",
                          budget: 3500000,
                          spent: 2100000,
                          impressions: 95000,
                          clicks: 3800,
                          conversions: 210,
                          roi: 145,
                          startDate: new Date("2024-10-15"),
                          endDate: new Date("2024-12-15"),
                          channels: ["social", "ads"],
                        },
                        {
                          id: "4",
                          name: "Brand Awareness",
                          status: "paused",
                          budget: 2000000,
                          spent: 800000,
                          impressions: 45000,
                          clicks: 1800,
                          conversions: 90,
                          roi: 75,
                          startDate: new Date("2024-09-01"),
                          endDate: new Date("2024-10-31"),
                          channels: ["ads", "social"],
                        },
                        {
                          id: "5",
                          name: "Webinar Promotion",
                          status: "active",
                          budget: 1500000,
                          spent: 650000,
                          impressions: 32000,
                          clicks: 2100,
                          conversions: 450,
                          roi: 210,
                          startDate: new Date("2024-11-01"),
                          endDate: new Date("2024-11-30"),
                          channels: ["email", "social"],
                        },
                      ]}
                      initialContent={[
                        {
                          id: "1",
                          title: "10 Ways AI is Transforming Sales in 2025",
                          type: "blog",
                          status: "published",
                          views: 12500,
                          engagement: 8.5,
                          publishedAt: new Date("2024-11-01"),
                          author: "Sarah Johnson",
                        },
                        {
                          id: "2",
                          title: "The Complete Guide to Marketing Automation",
                          type: "ebook",
                          status: "published",
                          views: 8200,
                          engagement: 12.3,
                          publishedAt: new Date("2024-10-15"),
                          author: "Michael Chen",
                        },
                        {
                          id: "3",
                          title: "Q4 Product Demo Video",
                          type: "video",
                          status: "published",
                          views: 25400,
                          engagement: 15.8,
                          publishedAt: new Date("2024-10-20"),
                          author: "Creative Team",
                        },
                        {
                          id: "4",
                          title: "Customer Success Story: TechCorp",
                          type: "case-study",
                          status: "published",
                          views: 6800,
                          engagement: 9.2,
                          publishedAt: new Date("2024-11-10"),
                          author: "Emily Rodriguez",
                        },
                        {
                          id: "5",
                          title: "Holiday Campaign Social Assets",
                          type: "social",
                          status: "scheduled",
                          views: 0,
                          engagement: 0,
                          publishedAt: new Date("2024-11-25"),
                          author: "Design Team",
                        },
                      ]}
                      initialChannels={[
                        {
                          id: "1",
                          name: "Email Marketing",
                          type: "email",
                          status: "active",
                          performance: 85,
                          budget: 2500000,
                          reach: 125000,
                        },
                        {
                          id: "2",
                          name: "LinkedIn Ads",
                          type: "social",
                          status: "active",
                          performance: 92,
                          budget: 3000000,
                          reach: 180000,
                        },
                        {
                          id: "3",
                          name: "Google Ads",
                          type: "ads",
                          status: "active",
                          performance: 78,
                          budget: 4000000,
                          reach: 320000,
                        },
                        {
                          id: "4",
                          name: "Twitter/X",
                          type: "social",
                          status: "active",
                          performance: 65,
                          budget: 1000000,
                          reach: 95000,
                        },
                      ]}
                      stats={{
                        activeCampaigns: 4,
                        totalBudget: 14500000,
                        totalImpressions: 382000,
                        avgROI: 144,
                      }}
                    />
                  </DemoWrapper>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <SectionDivider variant="gradient" />

      {/* Enhanced Benefits Section */}
      <EnhancedBenefits />

      {/* Section Divider */}
      <SectionDivider variant="sparkle" />

      {/* Final CTA */}
      {onEnterApp && <FooterCTA onEnterApp={onEnterApp} />}

      {/* Footer */}
      <Footer />
    </div>
  );
}


