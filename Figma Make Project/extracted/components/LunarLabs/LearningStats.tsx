import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Clock, Target, Flame } from 'lucide-react';

interface LearningStatsProps {
  stats: {
    demosCompleted: number;
    totalDemos: number;
    timeSpent: number;
    topicsExplored: number;
    streak: number;
  };
}

export function LearningStats({ stats }: LearningStatsProps) {
  const completionRate = Math.round((stats.demosCompleted / stats.totalDemos) * 100);
  const hoursSpent = Math.floor(stats.timeSpent / 60);
  const minutesSpent = stats.timeSpent % 60;

  return (
    <Card className="p-2.5 border-purple-500/20">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs">Learning Stats</h3>
        <Badge variant="outline" className="bg-purple-500/10 text-[10px] h-4">
          Lvl {Math.floor(stats.demosCompleted / 3) + 1}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {/* Demos Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-purple-400" />
              <span>Demos</span>
            </div>
            <span className="text-purple-400 text-[10px]">{stats.demosCompleted}/{stats.totalDemos}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-center">
            <TrendingUp className="w-3 h-3 text-blue-400 mx-auto mb-0.5" />
            <div className="text-xs text-blue-400">{stats.topicsExplored}</div>
            <div className="text-[9px] text-gray-400">Topics</div>
          </div>

          <div className="p-1.5 bg-green-500/10 border border-green-500/20 rounded text-center">
            <Clock className="w-3 h-3 text-green-400 mx-auto mb-0.5" />
            <div className="text-xs text-green-400">
              {hoursSpent > 0 ? `${hoursSpent}h` : `${minutesSpent}m`}
            </div>
            <div className="text-[9px] text-gray-400">Time</div>
          </div>

          <div className="p-1.5 bg-orange-500/10 border border-orange-500/20 rounded text-center">
            <Flame className="w-3 h-3 text-orange-400 mx-auto mb-0.5" />
            <div className="text-xs text-orange-400">{stats.streak}</div>
            <div className="text-[9px] text-gray-400">Streak</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
