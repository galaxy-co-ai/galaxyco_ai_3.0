import { useState, useEffect, useMemo } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { SearchCommand } from '../components/LunarLabs/SearchCommand';
import { TopicExplorer } from '../components/LunarLabs/TopicExplorer';
import { ContentStage } from '../components/LunarLabs/ContentStage';
import { QuickActionPanel } from '../components/LunarLabs/QuickActionPanel';
import { RoleSelector } from '../components/LunarLabs/RoleSelector';
import { AchievementBadges } from '../components/LunarLabs/AchievementBadges';
import { LearningStats } from '../components/LunarLabs/LearningStats';
import { WhatsNewFeed } from '../components/LunarLabs/WhatsNewFeed';
import { LabNotebook } from '../components/LunarLabs/LabNotebook';
import { SmartSuggestions } from '../components/LunarLabs/SmartSuggestions';
import { Settings, Bookmark, BarChart3, Sparkles } from 'lucide-react';
import { rolePersonalization } from '../data/lunarLabsContent';

export default function LunarLabs() {
  const [selectedRole, setSelectedRole] = useState('sales');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState<'suggestions' | 'stats' | 'notebook'>('suggestions');
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Pre-calculate animation values to avoid React warnings
  const starAnimations = useMemo(() => ({
    large: [...Array(8)].map(() => ({
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 5,
      top: Math.random() * 100,
      left: Math.random() * 100
    })),
    medium: [...Array(15)].map(() => ({
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 3,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.5 + Math.random() * 0.5
    })),
    small: [...Array(30)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.4
    })),
    shooting: [...Array(3)].map((_, i) => ({
      duration: 8 + Math.random() * 4,
      delay: i * 4,
      top: 20 + Math.random() * 60
    })),
    particles: [...Array(6)].map(() => ({
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 5,
      top: Math.random() * 100,
      left: Math.random() * 100
    }))
  }), []);
  
  // User progress tracking
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>(['first-demo']);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([
    {
      id: '1',
      type: 'topic',
      title: 'Gmail Integration',
      category: 'Integrations',
      date: '2 days ago'
    }
  ]);
  const [stats, setStats] = useState({
    demosCompleted: 8,
    totalDemos: 15,
    timeSpent: 127, // minutes
    topicsExplored: 12,
    streak: 3
  });

  // Get personalized suggestions based on role
  const getSuggestions = () => {
    const roleData = rolePersonalization[selectedRole as keyof typeof rolePersonalization];
    
    return [
      {
        id: 'sug-1',
        title: 'Complete CRM Deep Dive',
        reason: 'Based on your sales role, this will help you close deals faster',
        topicId: 'crm-deep-dive',
        priority: 'high' as const
      },
      {
        id: 'sug-2',
        title: 'Set Up Email Automation',
        reason: 'Save 5+ hours per week on follow-ups',
        topicId: 'workflows-basics',
        priority: 'high' as const
      },
      {
        id: 'sug-3',
        title: 'Explore AI Agents',
        reason: 'Let AI handle repetitive tasks automatically',
        topicId: 'ai-agents-intro',
        priority: 'medium' as const
      }
    ];
  };

  const handleSearchResult = (topicId: string, demoId?: string) => {
    setSelectedTopicId(topicId);
    setActiveDemoId(demoId || null);
  };

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setActiveDemoId(null);
  };

  const handleActionComplete = (actionId: string) => {
    setCompletedActions(prev => [...prev, actionId]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      demosCompleted: prev.demosCompleted + 1
    }));

    // Check for new achievements
    if (completedActions.length + 1 >= 3 && !earnedAchievements.includes('integration-master')) {
      setEarnedAchievements(prev => [...prev, 'integration-master']);
    }
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setSelectedTopicId(null); // Reset topic when role changes
  };

  // Auto-select first suggested topic for new users
  useEffect(() => {
    if (!selectedTopicId) {
      const roleData = rolePersonalization[selectedRole as keyof typeof rolePersonalization];
      if (roleData && roleData.suggestedTopics.length > 0) {
        // Don't auto-select, let user explore
      }
    }
  }, [selectedRole]);

  return (
    <div className="min-h-screen">
      {/* Main Container with Cosmic Background */}
      <div className="relative overflow-hidden min-h-screen">
        {/* Multi-Layer Background Effects - Full Page */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-pink-900/20 to-blue-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(147,51,234,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.2),transparent_60%)]" />
        
        {/* Mesh Gradient Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        
        {/* Enhanced Star Field - Multiple Layers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Stars with Glow */}
          {starAnimations.large.map((star, i) => (
            <div
              key={`large-${i}`}
              className="absolute bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.3)]"
              style={{
                width: '3px',
                height: '3px',
                top: `${star.top}%`,
                left: `${star.left}%`,
                animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              }}
            />
          ))}
          
          {/* Medium Stars */}
          {starAnimations.medium.map((star, i) => (
            <div
              key={`medium-${i}`}
              className="absolute w-[2px] h-[2px] bg-white rounded-full"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                opacity: star.opacity,
                animation: `pulse ${star.duration}s cubic-bezier(0.4, 0, 0.6, 1) ${star.delay}s infinite`,
              }}
            />
          ))}
          
          {/* Small Stars */}
          {starAnimations.small.map((star, i) => (
            <div
              key={`small-${i}`}
              className="absolute w-[1px] h-[1px] bg-white/60 rounded-full"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                opacity: star.opacity
              }}
            />
          ))}

          {/* Shooting Stars */}
          {starAnimations.shooting.map((star, i) => (
            <div
              key={`shooting-${i}`}
              className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"
              style={{
                width: '100px',
                top: `${star.top}%`,
                left: '-100px',
                opacity: 0.6,
                animation: `shootingStar ${star.duration}s linear ${star.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {starAnimations.particles.map((particle, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-purple-300/30 rounded-full"
              style={{
                top: `${particle.top}%`,
                left: `${particle.left}%`,
                animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-[1800px] mx-auto">
          {/* Hero Section */}
          <div className="relative text-center w-full py-12 px-4">
            {/* Top Bar - Search and What's New */}
            <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between gap-4" style={{ animation: 'fadeInDown 1s ease-out 0.3s backwards' }}>
              {/* Left spacer for balance */}
              <div className="flex-1" />
              
              {/* Center Search */}
              <div className="flex-1 max-w-2xl">
                <SearchCommand onSelectResult={handleSearchResult} />
              </div>
              
              {/* Right - What's New Button */}
              <div className="flex-1 flex justify-end">
                <Button
                  onClick={() => setShowWhatsNew(true)}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 group"
                >
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  See What's New
                </Button>
              </div>
            </div>

            {/* Premium Moon Icon */}
            <div className="mb-5 inline-block group cursor-pointer">
              <div className="relative">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700" style={{ transform: 'scale(1.5)' }} />
                
                {/* Middle Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 blur-xl opacity-50" style={{ transform: 'scale(1.2)' }} />
                
                {/* Moon Container */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 flex items-center justify-center shadow-2xl shadow-purple-500/50 group-hover:scale-110 transition-transform duration-700" style={{ animation: 'gentlePulse 4s ease-in-out infinite' }}>
                  {/* Inner Moon Glow */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400/40 via-pink-400/40 to-transparent" />
                  <span className="text-5xl relative z-10 drop-shadow-lg">🌙</span>
                </div>
              </div>
            </div>

            {/* Main Title with Enhanced Typography */}
            <h1 className="text-6xl mb-3 relative inline-block" style={{ animation: 'fadeInUp 1s ease-out' }}>
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent relative z-10" 
                    style={{ 
                      textShadow: '0 0 40px rgba(168, 85, 247, 0.3), 0 0 80px rgba(236, 72, 153, 0.2)',
                      fontWeight: '700',
                      letterSpacing: '-0.02em'
                    }}>
                Lunar Labs
              </span>
              {/* Text Glow Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent blur-sm opacity-50" style={{ fontWeight: '700', letterSpacing: '-0.02em' }}>
                Lunar Labs
              </span>
            </h1>

            {/* Subtitle with Glass Effect */}
            <p className="text-xl text-gray-200 mb-4 tracking-wide" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              R&D Knowledge Center
            </p>

            {/* Role Badge with Glass Morphism */}
            <div className="flex items-center justify-center gap-3">
              <Badge variant="outline" className="backdrop-blur-xl bg-purple-500/10 border-purple-400/30 text-sm px-5 py-2 shadow-lg shadow-purple-500/10 hover:bg-purple-500/20 transition-all duration-300">
                <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {rolePersonalization[selectedRole as keyof typeof rolePersonalization]?.welcomeMessage.split('!')[0].replace('Welcome, ', '')}
                </span>
              </Badge>
              <Button variant="ghost" size="sm" className="h-9 backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

        <style jsx>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            
            @keyframes shootingStar {
              0% { transform: translateX(0) translateY(0); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateX(1000px) translateY(500px); opacity: 0; }
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0) translateX(0); }
              25% { transform: translateY(-20px) translateX(10px); }
              50% { transform: translateY(-10px) translateX(-10px); }
              75% { transform: translateY(-15px) translateX(5px); }
            }
            
            @keyframes gentlePulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
        `}</style>

        {/* What's New Floating Card */}
        <WhatsNewFeed 
          isOpen={showWhatsNew} 
          onClose={() => setShowWhatsNew(false)} 
          onSelectTopic={handleSelectTopic} 
        />

          {/* Content Area */}
          <div className="p-3 space-y-2">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
            {/* Left Sidebar - Topics & Role */}
            <div className="lg:col-span-3 space-y-2">
              <RoleSelector selectedRole={selectedRole} onRoleChange={handleRoleChange} />
              <TopicExplorer 
                selectedTopicId={selectedTopicId}
                onSelectTopic={handleSelectTopic}
                roleFilter={selectedRole}
              />
            </div>

            {/* Center Stage - Main Content */}
            <div className="lg:col-span-6">
              <ContentStage topicId={selectedTopicId} activeDemoId={activeDemoId} />
            </div>

            {/* Right Sidebar - Context Actions & Stats */}
            <div className="lg:col-span-3 space-y-2">
            {/* Panel Switcher */}
            <div className="flex gap-1.5">
              <Button
                variant={showRightPanel === 'suggestions' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setShowRightPanel('suggestions')}
              >
                💡 For You
              </Button>
              <Button
                variant={showRightPanel === 'stats' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8"
                onClick={() => setShowRightPanel('stats')}
              >
                <BarChart3 className="w-3 h-3" />
              </Button>
              <Button
                variant={showRightPanel === 'notebook' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8"
                onClick={() => setShowRightPanel('notebook')}
              >
                <Bookmark className="w-3 h-3" />
              </Button>
            </div>

              {/* Dynamic Right Panel Content */}
              {showRightPanel === 'suggestions' && (
                <>
                  <SmartSuggestions 
                    suggestions={getSuggestions()}
                    onSelectSuggestion={handleSelectTopic}
                  />
                  {selectedTopicId && (
                    <QuickActionPanel 
                      topicId={selectedTopicId}
                      onActionComplete={handleActionComplete}
                    />
                  )}
                </>
              )}

              {showRightPanel === 'stats' && (
                <>
                  <LearningStats stats={stats} />
                  <AchievementBadges earned={earnedAchievements} />
                </>
              )}

              {showRightPanel === 'notebook' && (
                <LabNotebook 
                  bookmarks={bookmarks}
                  onRemove={handleRemoveBookmark}
                  onOpen={(id, type) => {
                    // Handle opening bookmarked item
                    const bookmark = bookmarks.find(b => b.id === id);
                    if (bookmark && bookmark.topicId) {
                      handleSelectTopic(bookmark.topicId);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
