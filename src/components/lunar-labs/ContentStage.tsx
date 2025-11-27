import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, Target, Tag } from 'lucide-react';
import { topics, type Topic } from '../../data/lunarLabsContent';
import { CRMContactDemo } from '../SandboxDemos/CRMContactDemo';
import { EmailComposerDemo } from '../SandboxDemos/EmailComposerDemo';
import { WorkflowBuilderDemo } from '../SandboxDemos/WorkflowBuilderDemo';

interface ContentStageProps {
  topicId: string | null;
  activeDemoId?: string | null;
}

const demoComponents: Record<string, any> = {
  'CRMContactDemo': CRMContactDemo,
  'EmailComposerDemo': EmailComposerDemo,
  'WorkflowBuilderDemo': WorkflowBuilderDemo,
  'DashboardDemo': WorkflowBuilderDemo, // Placeholder
  'AgentBuilderDemo': WorkflowBuilderDemo // Placeholder
};

export function ContentStage({ topicId, activeDemoId }: ContentStageProps) {
  const topic = topics.find(t => t.id === topicId);

  if (!topic) {
    return (
      <Card className="p-8 border-purple-500/20 h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🌙</span>
          </div>
          <h3 className="text-lg mb-2">Welcome to Lunar Labs</h3>
          <p className="text-sm text-gray-400 mb-4">
            Your R&D knowledge center. Choose a topic from the left or use search to find what you need.
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            <Badge variant="outline" className="text-xs">Interactive Demos</Badge>
            <Badge variant="outline" className="text-xs">Learning Paths</Badge>
            <Badge variant="outline" className="text-xs">Quick Actions</Badge>
          </div>
        </div>
      </Card>
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

  return (
    <div className="space-y-2">
      {/* Topic Header */}
      <Card className="p-3 border-purple-500/20">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{topic.icon}</span>
              <h1 className="text-xl">{topic.title}</h1>
            </div>
            <p className="text-sm text-gray-400">{topic.description}</p>
          </div>
          <Badge variant="outline" className="capitalize text-xs">{topic.difficulty}</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{topic.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            <span>{topic.sections.length} sections</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3" />
            <div className="flex gap-1">
              {topic.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] h-4">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

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
