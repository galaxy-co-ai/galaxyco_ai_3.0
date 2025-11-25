import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, Target, Tag, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { topics, type Topic } from '../../data/lunarLabsContent';
import { WelcomeCard } from './WelcomeCard';
import { LearningObjectives } from './LearningObjectives';
import { TopicCompletionFlow } from './TopicCompletionFlow';
import { CRMContactDemo } from '../SandboxDemos/CRMContactDemo';
import { EmailComposerDemo } from '../SandboxDemos/EmailComposerDemo';
import { WorkflowBuilderDemo } from '../SandboxDemos/WorkflowBuilderDemo';

interface Suggestion {
  id: string;
  title: string;
  reason: string;
  topicId: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContentStageProps {
  topicId: string | null;
  activeDemoId?: string | null;
  onCompleteTopic?: (topicId: string) => void;
  isCompleted?: boolean;
  suggestions?: Suggestion[];
  onSelectSuggestion?: (topicId: string) => void;
  quickActions?: React.ReactNode;
  role?: string;
  path?: any;
  completedTopics?: string[];
  isFirstTimeUser?: boolean;
  onStartPath?: () => void;
}

const demoComponents: Record<string, any> = {
  'CRMContactDemo': CRMContactDemo,
  'EmailComposerDemo': EmailComposerDemo,
  'WorkflowBuilderDemo': WorkflowBuilderDemo,
  'DashboardDemo': WorkflowBuilderDemo, // Placeholder
  'AgentBuilderDemo': WorkflowBuilderDemo // Placeholder
};

export function ContentStage({ 
  topicId, 
  activeDemoId, 
  onCompleteTopic, 
  isCompleted, 
  suggestions, 
  onSelectSuggestion, 
  quickActions,
  role = 'sales',
  path,
  completedTopics = [],
  isFirstTimeUser = false,
  onStartPath
}: ContentStageProps) {
  const topic = topics.find(t => t.id === topicId);

  if (!topic) {
    // Enhanced empty state with Welcome Card
    return (
      <div className="h-full">
        <WelcomeCard 
          role={role}
          path={path}
          completedTopics={completedTopics}
          isFirstTimeUser={isFirstTimeUser}
          onStartPath={onStartPath}
          onSelectTopic={onSelectSuggestion}
          suggestions={suggestions}
        />
      </div>
    );
  }

  const overviewSection = topic.sections.find(s => s.type === 'overview');
  const demoSections = topic.sections.filter(s => s.type === 'sandbox');
  const faqSection = topic.sections.find(s => s.type === 'faqs');
  const videoSection = topic.sections.find(s => s.type === 'video');

  // Determine which demo to show
  const activeDemoSection = activeDemoId 
    ? demoSections.find(s => s.demo?.id === activeDemoId)
    : demoSections[0];

  // Get step information if in a path
  const pathStep = path?.steps.find(step => step.topicId === topic.id);
  const stepIndex = pathStep ? path.steps.findIndex(step => step.topicId === topic.id) : -1;
  const stepNumber = stepIndex >= 0 ? stepIndex + 1 : undefined;
  const totalSteps = path ? path.steps.filter(s => s.required !== false).length : undefined;

  // Get next and previous steps
  const nextStep = path && stepIndex >= 0 && stepIndex < path.steps.length - 1
    ? path.steps[stepIndex + 1]
    : null;
  const previousStep = path && stepIndex > 0
    ? path.steps[stepIndex - 1]
    : null;

  const canAccessNext = nextStep ? 
    (!nextStep.prerequisites || nextStep.prerequisites.every(prereq => completedTopics.includes(prereq)))
    : false;

  return (
    <div className="space-y-3">
      {/* Learning Objectives */}
      <LearningObjectives 
        topic={topic}
        path={path}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        completedTopics={completedTopics}
      />

      {/* Topic Header */}
      <Card className="p-4 sm:p-5 lg:p-6 border-purple-500/20" role="article" aria-labelledby={`topic-title-${topic.id}`}>
        <div className="flex items-start justify-between mb-3 flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{topic.icon}</span>
              <h1 id={`topic-title-${topic.id}`} className="text-xl sm:text-2xl lg:text-3xl font-bold">{topic.title}</h1>
              {isCompleted && (
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
                  <Check className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-300 mb-3">{topic.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="capitalize text-xs sm:text-sm">{topic.difficulty}</Badge>
            {!isCompleted && onCompleteTopic && (
              <Button
                size="sm"
                className="h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs sm:text-sm"
                onClick={() => onCompleteTopic(topic.id)}
                aria-label={`Mark ${topic.title} as complete`}
              >
                <Check className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Mark Complete</span>
                <span className="sm:hidden">Complete</span>
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        {(previousStep || nextStep) && (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-500/20">
            <div className="flex-1">
              {previousStep && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const prevTopic = topics.find(t => t.id === previousStep.topicId);
                    if (prevTopic && onSelectSuggestion) {
                      onSelectSuggestion(previousStep.topicId);
                    }
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400">Previous</div>
                    <div className="text-xs">{topics.find(t => t.id === previousStep.topicId)?.title}</div>
                  </div>
                </Button>
              )}
            </div>
            <div className="flex-1">
              {nextStep && (
                <Button
                  variant={canAccessNext ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-end ${canAccessNext ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                  disabled={!canAccessNext}
                  onClick={() => {
                    if (canAccessNext && onSelectSuggestion) {
                      onSelectSuggestion(nextStep.topicId);
                    }
                  }}
                >
                  <div className="text-right mr-2">
                    <div className="text-[10px] text-gray-400">Next</div>
                    <div className="text-xs">{topics.find(t => t.id === nextStep.topicId)?.title}</div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions - Show above tabs if available */}
      {quickActions && (
        <div className="mb-3">
          {quickActions}
        </div>
      )}

      {/* Completion Flow - Show at bottom before tabs when topic is viewed */}
      {!isCompleted && onCompleteTopic && (
        <TopicCompletionFlow
          topic={topic}
          onComplete={() => onCompleteTopic(topic.id)}
          onNext={() => {
            if (nextStep && onSelectSuggestion && canAccessNext) {
              onSelectSuggestion(nextStep.topicId);
            }
          }}
          hasNext={!!nextStep && canAccessNext}
          nextTopicTitle={nextStep ? topics.find(t => t.id === nextStep.topicId)?.title : undefined}
        />
      )}

      {/* Content Tabs */}
      <Tabs defaultValue={activeDemoSection ? 'demos' : 'overview'} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demos" disabled={demoSections.length === 0}>
            Demos ({demoSections.length})
          </TabsTrigger>
          <TabsTrigger value="faqs" disabled={!faqSection}>
            FAQs
          </TabsTrigger>
          <TabsTrigger value="resources" disabled={!videoSection}>
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-3">
          <Card className="p-4 border-purple-500/20">
            <ScrollArea className="h-[calc(100vh-520px)] pr-4">
              {overviewSection && (
                <div className="prose prose-invert max-w-none">
                  {overviewSection.content?.split('\n').map((paragraph, index) => {
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <h3 key={index} className="text-lg mt-6 mb-3">
                          {paragraph.replace(/\*\*/g, '')}
                        </h3>
                      );
                    } else if (paragraph.startsWith('# ')) {
                      return (
                        <h2 key={index} className="text-xl mt-8 mb-4">
                          {paragraph.substring(2)}
                        </h2>
                      );
                    } else if (paragraph.startsWith('- ')) {
                      return (
                        <li key={index} className="ml-6 text-gray-300 mb-2">
                          {paragraph.substring(2)}
                        </li>
                      );
                    } else if (paragraph.trim()) {
                      return (
                        <p key={index} className="text-gray-300 mb-4">
                          {paragraph}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Demos Tab */}
        <TabsContent value="demos" className="mt-3">
          <div className="space-y-3">
            {demoSections.length > 1 && (
              <div className="flex gap-1.5">
                {demoSections.map((section, index) => (
                  <Badge 
                    key={section.demo?.id} 
                    variant={activeDemoSection === section ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                  >
                    Demo {index + 1}
                  </Badge>
                ))}
              </div>
            )}

            {activeDemoSection?.demo && (
              <div>
                <Card className="p-3 border-purple-500/20 mb-3">
                  <h3 className="text-sm mb-1">{activeDemoSection.title}</h3>
                  <p className="text-xs text-gray-400 mb-2">{activeDemoSection.demo.description}</p>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="capitalize text-[10px] h-4">
                      {activeDemoSection.demo.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {activeDemoSection.demo.estimatedTime}
                    </Badge>
                    {activeDemoSection.demo.guided && (
                      <Badge variant="outline" className="bg-purple-500/10 text-[10px] h-4">
                        Guided
                      </Badge>
                    )}
                  </div>
                </Card>

                <div>
                  {(() => {
                    const DemoComponent = demoComponents[activeDemoSection.demo.component];
                    return DemoComponent ? <DemoComponent /> : (
                      <Card className="p-12 border-purple-500/20 text-center">
                        <p className="text-gray-400">Demo coming soon...</p>
                      </Card>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="mt-3">
          <Card className="p-4 border-purple-500/20">
            <h3 className="text-sm mb-3">Frequently Asked Questions</h3>
            <ScrollArea className="h-[calc(100vh-520px)] pr-4">
              <Accordion type="single" collapsible className="w-full">
                {faqSection?.faqs?.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400 text-xs">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-3">
          <Card className="p-4 border-purple-500/20">
            <ScrollArea className="h-[calc(100vh-520px)] pr-4">
              <p className="text-sm text-gray-400">Video tutorials and additional resources coming soon...</p>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
