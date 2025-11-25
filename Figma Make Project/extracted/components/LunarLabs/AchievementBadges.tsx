import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Lock } from 'lucide-react';
import { achievements } from '../../data/lunarLabsContent';

interface AchievementBadgesProps {
  earned: string[];
}

export function AchievementBadges({ earned }: AchievementBadgesProps) {
  const earnedAchievements = achievements.filter(a => earned.includes(a.id));
  const lockedAchievements = achievements.filter(a => !earned.includes(a.id));

  const totalXP = earnedAchievements.reduce((sum, a) => sum + a.xp, 0);
  const maxXP = achievements.reduce((sum, a) => sum + a.xp, 0);

  return (
    <Card className="p-2.5 border-purple-500/20">
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs">Achievements</h3>
          <Badge variant="outline" className="text-[10px] h-4">{totalXP} XP</Badge>
        </div>
        <Progress value={(totalXP / maxXP) * 100} className="h-1.5" />
      </div>

      <div className="space-y-1.5">
        {earnedAchievements.length > 0 && (
          <div>
            <h4 className="text-[10px] text-gray-400 mb-1">EARNED ({earnedAchievements.length})</h4>
            <div className="space-y-1">
              {earnedAchievements.slice(0, 2).map(achievement => (
                <div key={achievement.id} className="flex items-center gap-2 p-1.5 bg-green-500/10 border border-green-500/20 rounded">
                  <div className="text-lg">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{achievement.title}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-4">+{achievement.xp}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="text-[10px] text-gray-400 mb-1">NEXT ({lockedAchievements.length})</h4>
            <div className="space-y-1">
              {lockedAchievements.slice(0, 2).map(achievement => (
                <div key={achievement.id} className="flex items-center gap-2 p-1.5 bg-gray-800/50 border border-gray-700 rounded opacity-60">
                  <div className="text-base grayscale">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{achievement.title}</div>
                  </div>
                  <Lock className="w-3 h-3 text-gray-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
