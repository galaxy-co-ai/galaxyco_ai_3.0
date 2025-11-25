"use client";

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Target, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { type Topic, type LearningPath, topics } from '../../data/lunarLabsContent';

interface LearningObjectivesProps {
  topic: Topic;
  path?: LearningPath | null;
  stepNumber?: number;
  totalSteps?: number;
  completedTopics?: string[];
}

export function LearningObjectives({ topic, path, stepNumber, totalSteps, completedTopics = [] }: LearningObjectivesProps) {
  // Extract learning objectives from overview content
  const extractObjectives = (content?: string): string[] => {
    if (!content) return [];
    
    const objectives: string[] = [];
    const lines = content.split('\n');
    
    // Look for bullet points or numbered lists that might be objectives
    lines.forEach(line => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const objective = line.trim().substring(2).trim();
        if (objective.length > 10 && objective.length < 150) {
          objectives.push(objective);
        }
      }
    });

    // If we found objectives, return them; otherwise generate generic ones
    if (objectives.length > 0) {
      return objectives.slice(0, 5);
    }

    // Generate objectives based on topic category
    return [
      `Understand ${topic.title.toLowerCase()}`,
      `Learn key concepts and best practices`,
      `Try hands-on examples`,
      `Apply knowledge to your workflow`
    ];
  };

  const objectives = extractObjectives(topic.sections.find(s => s.type === 'overview')?.content);

  // Check if topic is in a path and get step info
  const pathStep = path?.steps.find(step => step.topicId === topic.id);
  const stepIndex = pathStep && path ? path.steps.findIndex(step => step.topicId === topic.id) : -1;
  const hasPrerequisites = pathStep?.prerequisites && pathStep.prerequisites.length > 0;
  const unmetPrerequisites = pathStep?.prerequisites?.filter(prereq => !completedTopics.includes(prereq)) || [];

  return (
    <Card className="p-4 border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-pink-950/20">
      {/* Step Indicator */}
      {stepNumber && totalSteps && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-500/20">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            {stepNumber}
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-0.5">Step {stepNumber} of {totalSteps}</div>
            <div className="text-sm font-semibold text-white">{path?.title}</div>
          </div>
          <Badge variant="outline" className="bg-purple-500/10 border-purple-400/30 text-xs">
            {Math.round((stepNumber / totalSteps) * 100)}%
          </Badge>
        </div>
      )}

      {/* Prerequisites Warning */}
      {hasPrerequisites && unmetPrerequisites.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-yellow-400 mb-1">Prerequisites Required</div>
              <div className="text-xs text-gray-300">
                Complete these topics first: {unmetPrerequisites.map(id => {
                  const prereqTopic = topics.find(t => t.id === id);
                  return prereqTopic?.title || id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                }).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Objectives */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold">What You'll Learn</h3>
        </div>
        <div className="space-y-2">
          {objectives.map((objective, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-300">{objective}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Info */}
      <div className="flex items-center gap-4 pt-3 border-t border-purple-500/20 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{topic.estimatedTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="capitalize">{topic.difficulty}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          <span>{topic.sections.length} sections</span>
        </div>
      </div>
    </Card>
  );
}

