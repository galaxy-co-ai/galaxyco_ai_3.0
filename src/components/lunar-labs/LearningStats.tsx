import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Clock, Target, Flame, Award, BookOpen } from 'lucide-react';
import { type LearningPath } from '../../data/lunarLabsContent';

interface LearningStatsProps {
  stats: {
    demosCompleted: number;
    totalDemos: number;
    timeSpent: number;
    topicsExplored: number;
    streak: number;
  };
  path?: LearningPath | null;
  completedTopics?: string[];
}

export function LearningStats({ stats, path, completedTopics = [] }: LearningStatsProps) {
  const completionRate = Math.round((stats.demosCompleted / stats.totalDemos) * 100);
  const hoursSpent = Math.floor(stats.timeSpent / 60);
  const minutesSpent = stats.timeSpent % 60;

  // Path-specific stats
  const pathProgress = path ? {
    completed: path.steps.filter(s => s.required !== false && completedTopics.includes(s.topicId)).length,
    total: path.steps.filter(s => s.required !== false).length,
    percentage: (() => {
      const requiredSteps = path.steps.filter(s => s.required !== false);
      const completedSteps = requiredSteps.filter(step => completedTopics.includes(step.topicId));
      return requiredSteps.length > 0 
        ? Math.round((completedSteps.length / requiredSteps.length) * 100)
        : 0;
    })()
  } : null;

  const level = Math.floor(stats.demosCompleted / 3) + 1;

  return (
    <Card className="p-3 border-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold">Learning Stats</h3>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-xs px-2 py-0.5">
          Level {level}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Path Progress - If path exists */}
        {path && pathProgress && (
          <div className="space-y-1.5 p-2.5 bg-purple-500/5 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-purple-400" />
                <span className="font-medium">Path Progress</span>
              </div>
              <span className="text-purple-400 font-semibold">{pathProgress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${pathProgress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{pathProgress.completed} of {pathProgress.total} steps</span>
              <span>{path.title}</span>
            </div>
          </div>
        )}

        {/* Demos Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium">Demos Completed</span>
            </div>
            <span className="text-purple-400 text-xs font-semibold">{stats.demosCompleted}/{stats.totalDemos}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
            <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-blue-400">{stats.topicsExplored}</div>
            <div className="text-[10px] text-gray-400">Topics</div>
          </div>

          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <Clock className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-green-400">
              {hoursSpent > 0 ? `${hoursSpent}h` : `${minutesSpent}m`}
            </div>
            <div className="text-[10px] text-gray-400">Time</div>
          </div>

          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-orange-400">{stats.streak}</div>
            <div className="text-[10px] text-gray-400">Streak</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
