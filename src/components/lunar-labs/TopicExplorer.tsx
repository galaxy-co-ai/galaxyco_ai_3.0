import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { ChevronRight, Clock, Star } from 'lucide-react';
import { topics, type Topic } from '../../data/lunarLabsContent';

interface TopicExplorerProps {
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  roleFilter?: string;
}

export function TopicExplorer({ selectedTopicId, onSelectTopic, roleFilter }: TopicExplorerProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');

  // Group topics by category
  const categories = topics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  const categoryLabels: Record<string, string> = {
    'getting-started': 'Getting Started',
    'crm': 'CRM Features',
    'integrations': 'Integrations',
    'ai-agents': 'AI Agents',
    'workflows': 'Workflows',
    'knowledge-base': 'Knowledge Base',
    'pro-tips': 'Pro Tips'
  };

  const categoryIcons: Record<string, string> = {
    'getting-started': '🚀',
    'crm': '📊',
    'integrations': '🔗',
    'ai-agents': '🤖',
    'workflows': '⚡',
    'knowledge-base': '📚',
    'pro-tips': '💡'
  };

  const difficultyColors = {
    beginner: 'green',
    intermediate: 'yellow',
    advanced: 'red'
  };

  return (
    <Card className="p-3 sm:p-4 border-purple-500/20 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 420px)' }} role="navigation" aria-label="Topic explorer">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <span className="text-lg">📚</span>
        <h3 className="text-sm font-semibold">Topics</h3>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-1.5 pr-3">
          {Object.entries(categories).map(([category, categoryTopics]) => (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className="w-full flex items-center justify-between p-2 sm:p-2.5 hover:bg-gray-800/50 rounded transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-expanded={expandedCategory === category}
                aria-label={`${expandedCategory === category ? 'Collapse' : 'Expand'} ${categoryLabels[category]} category`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{categoryIcons[category]}</span>
                  <span className="text-xs">{categoryLabels[category]}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{categoryTopics.length}</Badge>
                </div>
                <ChevronRight 
                  className={`w-3 h-3 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`}
                />
              </button>

              {expandedCategory === category && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {categoryTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic.id)}
                      className={`w-full text-left p-2 sm:p-2.5 rounded transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        selectedTopicId === topic.id
                          ? 'bg-purple-500/20 border border-purple-500/40'
                          : 'hover:bg-gray-800/50'
                      }`}
                      aria-current={selectedTopicId === topic.id ? 'page' : undefined}
                      aria-label={`Select topic: ${topic.title}`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <span className="text-xs flex-1 truncate">{topic.title}</span>
                        {topic.difficulty === 'beginner' && (
                          <Star className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{topic.estimatedTime}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
