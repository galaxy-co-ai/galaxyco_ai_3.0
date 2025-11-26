import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { DemoWrapper } from "../shared/DemoWrapper";
import DashboardDashboard from "../dashboard/DashboardDashboard";
import CRMDashboard from "../crm/CRMDashboard";
import StudioDashboard from "../studio/StudioDashboard";

interface HeroSectionProps {
  onEnterApp: () => void;
}

const slides = [
  {
    component: DashboardDashboard,
    label: "AI Assistant",
    props: {
      initialTab: 'snapshot' as const,
      initialData: {
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
          {
            id: "3",
            name: "Meeting Prep Agent",
            initials: "MP",
            color: "bg-purple-500",
            message: "Prepared briefing for 3pm call",
            time: "12 min ago",
            active: false,
            status: "Completed",
            role: "research",
            conversation: [],
          },
        ],
        events: [],
      },
    },
  },
  {
    component: CRMDashboard,
    label: "AI Agents",
    props: {
      initialTab: 'leads' as const,
      initialLeads: [
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
          notes: "Ready to sign, discussing implementation",
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
      ],
      initialOrganizations: [
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
          notes: "Key enterprise account",
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
          notes: "Fast-moving deal",
        },
      ],
      initialContacts: [],
      initialDeals: [
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
          notes: "Final contract review",
        },
      ],
      stats: {
        totalLeads: 4,
        hotLeads: 2,
        totalOrgs: 2,
        totalValue: 410000,
      },
    },
  },
  {
    component: StudioDashboard,
    label: "Automations",
    props: {
      initialTab: 'create' as const,
    },
  },
];

export function HeroSection({ onEnterApp }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 px-6 py-20">
      {/* Centered Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white mb-6 leading-tight">
            AI built to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">EMPOWER</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-400 mb-8">
            Save 10+ hours weekly with intelligent automation
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onEnterApp}
              className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg rounded-lg group"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 px-8 py-6 text-lg rounded-lg"
            >
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Product Showcase with Layered Windows */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative"
        >
          {/* Background decorative cards */}
          <div className="absolute -left-4 top-8 w-64 h-80 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 rotate-[-8deg] hidden lg:block" />
          <div className="absolute -right-4 top-8 w-64 h-80 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 rotate-[8deg] hidden lg:block" />
          
          {/* Main carousel container */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-12 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-3xl opacity-50" />
            
            {/* Interactive Demo Carousel */}
            <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] xl:h-[800px] rounded-xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="relative h-full w-full bg-white rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                    <DemoWrapper scale={0.75} height={currentSlide === 2 ? 800 : 700} needsSidebar={false}>
                      {(() => {
                        const SlideComponent = slides[currentSlide].component;
                        const slideProps = slides[currentSlide].props;
                        return <SlideComponent {...slideProps} />;
                      })()}
                    </DemoWrapper>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className="group flex flex-col items-center gap-2"
              >
                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-16 bg-white' 
                    : 'w-10 bg-white/30 group-hover:bg-white/50'
                }`} />
                <span className={`text-sm transition-all duration-300 ${
                  index === currentSlide
                    ? 'text-white'
                    : 'text-white/40 group-hover:text-white/60'
                }`}>
                  {slide.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

