"use client";

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, ArrowRight } from 'lucide-react';
import { learningPaths, type LearningPath } from '../../data/lunarLabsContent';

interface LearningPathSelectorProps {
  selectedRole: string;
  currentPathId: string | null;
  onSelectPath: (pathId: string) => void;
  onStartPath?: (pathId: string) => void;
}

export function LearningPathSelector({ 
  selectedRole, 
  currentPathId, 
  onSelectPath,
  onStartPath 
}: LearningPathSelectorProps) {
  // Get paths for the selected role
  const rolePaths = learningPaths.filter(p => p.role === selectedRole);
  
  if (rolePaths.length === 0) {
    return (
      <Card className="p-3 border-purple-500/20">
        <p className="text-sm text-gray-400 text-center">No learning paths available for this role</p>
      </Card>
    );
  }

  // If only one path, show it expanded
  const defaultPath = rolePaths.find(p => p.id === currentPathId) || rolePaths[0];

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'border-green-500/30 text-green-400';
      case 'intermediate':
        return 'border-yellow-500/30 text-yellow-400';
      case 'advanced':
        return 'border-red-500/30 text-red-400';
      default:
        return 'border-gray-500/30 text-gray-400';
    }
  };

  return (
    <Card className="p-3 border-purple-500/20">
      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-1">Your Learning Path</h3>
        <p className="text-xs text-gray-400">Follow a structured path to master GalaxyCo.ai</p>
      </div>

      <div className="space-y-2">
        {rolePaths.map((path) => {
          const isSelected = path.id === currentPathId;

          return (
            <div
              key={path.id}
              className={`p-3 rounded border transition-all ${
                isSelected
                  ? 'bg-purple-500/20 border-purple-500/40'
                  : 'bg-gray-800/50 border-gray-700 hover:border-purple-500/40 hover:bg-purple-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Path Icon */}
                <div className="text-2xl flex-shrink-0">{path.icon}</div>

                {/* Path Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{path.title}</h4>
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{path.description}</p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] capitalize ${getDifficultyBadgeClass(path.difficulty)}`}
                    >
                      {path.difficulty}
                    </Badge>
                    <span className="text-[10px] text-gray-500">•</span>
                    <span className="text-[10px] text-gray-400">{path.estimatedTime}</span>
                    <span className="text-[10px] text-gray-500">•</span>
                    <span className="text-[10px] text-gray-400">{path.steps.length} steps</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => onSelectPath(path.id)}
                >
                  {isSelected ? 'Active' : 'Select Path'}
                </Button>
                {!isSelected && onStartPath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      onSelectPath(path.id);
                      onStartPath(path.id);
                    }}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {defaultPath && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Quick Start</div>
          <Button
            variant="default"
            size="sm"
            className="w-full h-8 text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => {
              if (defaultPath.id !== currentPathId) {
                onSelectPath(defaultPath.id);
              }
              if (onStartPath) {
                onStartPath(defaultPath.id);
              }
            }}
          >
            Start {defaultPath.title}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
}

