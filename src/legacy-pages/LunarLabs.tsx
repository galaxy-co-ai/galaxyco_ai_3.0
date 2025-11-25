"use client";
import { useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ContentStage } from '../components/lunar-labs/ContentStage';
import { 
  BookOpen, 
  Play, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Database,
  Link2,
  Workflow,
  Bot,
  FileText,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Mail,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { topics } from '../data/lunarLabsContent';

type TabType = 'crm' | 'integrations' | 'workflows' | 'ai-agents' | 'knowledge-base' | 'getting-started';

interface CategoryStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Database;
  iconColor: string;
  completed?: boolean;
  topicId?: string;
}

interface Category {
  id: TabType;
  name: string;
  icon: typeof Database;
  activeColor: string;
  steps: CategoryStep[];
}

export default function LunarLabs() {
  const [activeTab, setActiveTab] = useState<TabType>('getting-started');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lunar-labs-completed-steps');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save completed steps
  const handleCompleteStep = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const newCompleted = [...completedSteps, stepId];
      setCompletedSteps(newCompleted);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lunar-labs-completed-steps', JSON.stringify(newCompleted));
      }
    }
  };

  // Category definitions with steps
  const categories: Category[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: Sparkles,
      activeColor: 'bg-purple-100 text-purple-700',
      steps: [
        {
          id: 'gs-1',
          title: 'Welcome to GalaxyCo.ai',
          description: 'Learn the basics and get your first quick wins',
          icon: Sparkles,
          iconColor: 'bg-purple-500',
          topicId: 'getting-started'
        },
        {
          id: 'gs-2',
          title: 'Dashboard Overview',
          description: 'Navigate your command center and understand key metrics',
          icon: BarChart3,
          iconColor: 'bg-blue-500',
          topicId: 'getting-started'
        },
        {
          id: 'gs-3',
          title: 'Quick Actions',
          description: 'Master one-click solutions for common tasks',
          icon: Zap,
          iconColor: 'bg-amber-500',
          topicId: 'getting-started'
        },
        {
          id: 'gs-setup',
          title: 'Setup',
          description: 'Complete guided setup to configure your workspace',
          icon: Settings,
          iconColor: 'bg-green-500',
          topicId: 'getting-started'
        }
      ]
    },
    {
      id: 'crm',
      name: 'CRM',
      icon: Database,
      activeColor: 'bg-blue-100 text-blue-700',
      steps: [
        {
          id: 'crm-1',
          title: 'Contact Management',
          description: 'Create, organize, and manage your contacts',
          icon: Users,
          iconColor: 'bg-blue-500',
          topicId: 'crm-deep-dive'
        },
        {
          id: 'crm-2',
          title: 'Lead Scoring',
          description: 'AI-powered lead qualification and prioritization',
          icon: Target,
          iconColor: 'bg-purple-500',
          topicId: 'crm-deep-dive'
        },
        {
          id: 'crm-3',
          title: 'Sales Pipeline',
          description: 'Track deals and manage your sales process',
          icon: TrendingUp,
          iconColor: 'bg-green-500',
          topicId: 'crm-deep-dive'
        },
        {
          id: 'crm-4',
          title: 'Activity Tracking',
          description: 'Auto-logged emails, calls, and meetings',
          icon: Calendar,
          iconColor: 'bg-orange-500',
          topicId: 'crm-deep-dive'
        },
        {
          id: 'crm-setup',
          title: 'Setup',
          description: 'Configure CRM settings and import your contacts',
          icon: Settings,
          iconColor: 'bg-green-500',
          topicId: 'crm-deep-dive'
        }
      ]
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: Link2,
      activeColor: 'bg-green-100 text-green-700',
      steps: [
        {
          id: 'int-1',
          title: 'Gmail Integration',
          description: 'Connect Gmail to auto-sync emails and create contacts',
          icon: Mail,
          iconColor: 'bg-red-500',
          topicId: 'integrations-gmail'
        },
        {
          id: 'int-2',
          title: 'Calendar Sync',
          description: 'Link your calendar for meeting tracking and prep',
          icon: Calendar,
          iconColor: 'bg-blue-500',
          topicId: 'integrations-gmail'
        },
        {
          id: 'int-3',
          title: 'CRM Platforms',
          description: 'Connect Salesforce, HubSpot, and other CRMs',
          icon: Database,
          iconColor: 'bg-purple-500',
          topicId: 'integrations-gmail'
        },
        {
          id: 'int-setup',
          title: 'Setup',
          description: 'Connect and configure all your integrations',
          icon: Settings,
          iconColor: 'bg-green-500',
          topicId: 'integrations-gmail'
        }
      ]
    },
    {
      id: 'workflows',
      name: 'Workflows',
      icon: Workflow,
      activeColor: 'bg-orange-100 text-orange-700',
      steps: [
        {
          id: 'wf-1',
          title: 'Workflow Basics',
          description: 'Create your first automated workflow',
          icon: Zap,
          iconColor: 'bg-amber-500',
          topicId: 'workflows-basics'
        },
        {
          id: 'wf-2',
          title: 'Triggers & Actions',
          description: 'Understand workflow components and logic',
          icon: Target,
          iconColor: 'bg-blue-500',
          topicId: 'workflows-basics'
        },
        {
          id: 'wf-3',
          title: 'Advanced Workflows',
          description: 'Build complex multi-step automations',
          icon: Workflow,
          iconColor: 'bg-purple-500',
          topicId: 'workflows-basics'
        },
        {
          id: 'wf-setup',
          title: 'Setup',
          description: 'Create and deploy your first workflow',
          icon: Settings,
          iconColor: 'bg-green-500',
          topicId: 'workflows-basics'
        }
      ]
    },
    {
      id: 'ai-agents',
      name: 'AI Agents',
      icon: Bot,
      activeColor: 'bg-cyan-100 text-cyan-700',
      steps: [
        {
          id: 'ai-1',
          title: 'AI Agents Introduction',
          description: 'Learn how AI agents work autonomously',
          icon: Bot,
          iconColor: 'bg-cyan-500',
          topicId: 'ai-agents-intro'
        },
        {
          id: 'ai-2',
          title: 'Agent Types',
          description: 'Explore specialized agents for different tasks',
          icon: Sparkles,
          iconColor: 'bg-purple-500',
          topicId: 'ai-agents-intro'
        },
        {
          id: 'ai-3',
          title: 'Agent Training',
          description: 'Train agents to match your preferences',
          icon: Target,
          iconColor: 'bg-green-500',
          topicId: 'ai-agents-intro'
        },
        {
          id: 'ai-setup',
          title: 'Setup',
          description: 'Deploy and configure your first AI agent',
          icon: Settings,
          iconColor: 'bg-green-500',
          topicId: 'ai-agents-intro'
        }
      ]
    },
    {
      id: 'knowledge-base',
      name: 'Knowledge Base',
      icon: FileText,
      activeColor: 'bg-indigo-100 text-indigo-700',
      steps: [
        {
          id: 'kb-1',
          title: 'Document Management',
          description: 'Organize and store company documentation',
          icon: FileText,
          iconColor: 'bg-indigo-500',
          topicId: 'knowledge-base'
        },
        {
          id: 'kb-2',
          title: 'AI-Powered Search',
          description: 'Find information using natural language queries',
          icon: Sparkles,
          iconColor: 'bg-purple-500',
          topicId: 'knowledge-base'
        },
        {
          id: 'kb-3',
          title: 'Auto-Organization',
          description: 'AI suggests categories and tags automatically',
          icon: Zap,
          iconColor: 'bg-amber-500',
          topicId: 'knowledge-base'
        },
        {
          id: 'kb-setup',
          title: 'Setup',
          description: 'Import documents and configure your knowledge base',
          icon: Settings,
          iconColor: 'bg-green-500',
          topicId: 'knowledge-base'
        }
      ]
    }
  ];

  const currentCategory = categories.find(c => c.id === activeTab);
  const selectedStep = currentCategory?.steps.find(s => s.id === selectedStepId);
  const selectedTopic = selectedStep?.topicId ? topics.find(t => t.id === selectedStep.topicId) : null;

  // Calculate stats
  const totalSteps = categories.reduce((sum, cat) => sum + cat.steps.length, 0);
  const completedCount = completedSteps.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  // Stat badges for header
  const statBadges = [
    { 
      label: `${completedCount} Steps Completed`, 
      icon: CheckCircle2, 
      color: "bg-green-100 text-green-700" 
    },
    { 
      label: `${totalSteps} Total Steps`, 
      icon: BookOpen, 
      color: "bg-blue-100 text-blue-700" 
    },
    { 
      label: `${progressPercentage}% Complete`, 
      icon: Target, 
      color: "bg-purple-100 text-purple-700" 
    },
  ];

  // Tab configuration
  const tabs = categories.map(cat => ({
    id: cat.id,
    label: cat.name,
    icon: cat.icon,
    activeColor: cat.activeColor
  }));

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden">
      {/* Header Section - Matching Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Lunar Labs</h1>
          <p className="text-muted-foreground text-base">
            Interactive learning center. Master GalaxyCo.ai features through hands-on exploration.
          </p>

          {/* Stat Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {statBadges.map((stat, index) => (
              <Badge 
                key={index}
                className={`${stat.color} px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <stat.icon className="h-4 w-4" />
                {stat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Floating Tab Bar - Matching Dashboard */}
        <div className="flex justify-center">
          <div className="bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedStepId(null);
                }}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-md`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <tab.icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentCategory && (
            <div className="max-w-7xl mx-auto px-6 pb-8">
              <Card className="p-8 shadow-lg border-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Steps List */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2.5 rounded-full bg-gradient-to-br ${currentCategory.steps[0]?.iconColor || 'bg-purple-500'} text-white shadow-md`}>
                        <currentCategory.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{currentCategory.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentCategory.steps.length} steps to master
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {currentCategory.steps.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isSelected = selectedStepId === step.id;
                        const isSetup = step.id.endsWith('-setup');
                        const StepIcon = step.icon;

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card
                              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                isSelected 
                                  ? 'border-2 border-purple-300 bg-purple-50/50' 
                                  : isCompleted
                                  ? 'border-green-200 bg-green-50/30'
                                  : 'hover:border-purple-200'
                              } ${isSetup ? 'ring-2 ring-green-200' : ''}`}
                              onClick={() => setSelectedStepId(step.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setSelectedStepId(step.id);
                                }
                              }}
                              aria-label={`${step.title} - ${isCompleted ? 'Completed' : 'Not completed'}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${step.iconColor} text-white flex-shrink-0`}>
                                  <StepIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-sm">{step.title}</h4>
                                    {isCompleted && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                    {isSetup && (
                                      <Badge className="bg-green-100 text-green-700 text-xs">
                                        Setup
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Content Area */}
                  <div className="lg:col-span-2">
                    {selectedStep && selectedTopic ? (
                      <div className="space-y-6">
                        {/* Step Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${selectedStep.iconColor} text-white shadow-md`}>
                              <selectedStep.icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">{selectedStep.title}</h2>
                              <p className="text-muted-foreground mt-1">{selectedStep.description}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleCompleteStep(selectedStep.id)}
                            disabled={completedSteps.includes(selectedStep.id)}
                            className={completedSteps.includes(selectedStep.id) ? 'bg-green-500' : ''}
                          >
                            {completedSteps.includes(selectedStep.id) ? (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Completed
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Content Stage */}
                        <ContentStage 
                          topicId={selectedStep.topicId || ''} 
                          activeDemoId={null}
                          onCompleteTopic={() => handleCompleteStep(selectedStep.id)}
                          isCompleted={completedSteps.includes(selectedStep.id)}
                          suggestions={[]}
                          onSelectSuggestion={() => {}}
                          quickActions={null}
                          role="sales"
                          path={null}
                          completedTopics={[]}
                          isFirstTimeUser={false}
                          onStartPath={() => {}}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                        <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Select a step to start learning</h3>
                        <p className="text-muted-foreground mb-4 max-w-md">
                          Choose a step from the left panel to explore interactive content, demos, and guides. 
                          The last step is always "Setup" where you can configure this category.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
