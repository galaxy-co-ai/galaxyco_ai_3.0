import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Sparkles, Zap, TrendingUp, Lightbulb, X, Calendar } from 'lucide-react';
import { whatsNewFeed, type WhatsNew } from '../../data/lunarLabsContent';

interface WhatsNewFeedProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic?: (topicId: string) => void;
}

export function WhatsNewFeed({ isOpen, onClose, onSelectTopic }: WhatsNewFeedProps) {
  const categoryIcons = {
    feature: Sparkles,
    integration: Zap,
    improvement: TrendingUp,
    tip: Lightbulb
  };

  const categoryColors = {
    feature: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', hover: 'hover:border-purple-400' },
    integration: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', hover: 'hover:border-blue-400' },
    improvement: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', hover: 'hover:border-green-400' },
    tip: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', hover: 'hover:border-orange-400' }
  };

  const handleExplore = (item: WhatsNew) => {
    if (item.topicId && onSelectTopic) {
      onSelectTopic(item.topicId);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Floating Card */}
      <div className="fixed top-24 right-6 w-96 max-h-[calc(100vh-200px)] z-50 animate-in slide-in-from-right duration-300">
        <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900">What's New</h3>
                  <p className="text-xs text-gray-500">Latest updates & features</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={onClose}
              >
                <X className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Updates List */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
            {whatsNewFeed.map((item, index) => {
              const Icon = categoryIcons[item.category];
              const colors = categoryColors[item.category];
              
              return (
                <div
                  key={item.id}
                  className={`p-3 border rounded-lg ${colors.bg} ${colors.border} ${colors.hover} transition-all cursor-pointer group`}
                  onClick={() => handleExplore(item)}
                  style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.1}s backwards` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-white border ${colors.border} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm text-gray-900">{item.title}</h4>
                        <Badge variant="outline" className={`text-xs capitalize flex-shrink-0 ${colors.border} text-gray-700`}>
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-center text-gray-500">
              {whatsNewFeed.length} update{whatsNewFeed.length !== 1 ? 's' : ''} this week
            </p>
          </div>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
