import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";
import { Bot, CheckCircle2, Clock, TrendingUp, Mail, Users, FileText, Sparkles, Database, Bell, Activity, MessageSquare, CalendarDays, Zap, Lightbulb } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";

const stats = [
  {
    label: "Active Agents",
    value: 12,
    icon: Bot,
    gradient: "from-blue-500/10 to-blue-500/20",
    textColor: "text-blue-600",
  },
  {
    label: "Tasks Completed",
    value: "1,247",
    icon: CheckCircle2,
    gradient: "from-green-500/10 to-green-500/20",
    textColor: "text-green-600",
  },
  {
    label: "Hours Saved",
    value: "342",
    icon: Clock,
    gradient: "from-purple-500/10 to-purple-500/20",
    textColor: "text-purple-600",
  },
  {
    label: "Success Rate",
    value: "98.5%",
    icon: TrendingUp,
    gradient: "from-orange-500/10 to-orange-500/20",
    textColor: "text-orange-600",
  },
];

const activeAgents = [
  { id: "1", name: "Email Triage Agent", status: "processing", tasksCompleted: 342, lastActive: "2 min ago", icon: Mail, color: "text-blue-600" },
  { id: "2", name: "CRM Data Sync", status: "active", tasksCompleted: 156, lastActive: "5 min ago", icon: Database, color: "text-cyan-600" },
  { id: "3", name: "Meeting Notes Generator", status: "active", tasksCompleted: 89, lastActive: "12 min ago", icon: FileText, color: "text-purple-600" },
  { id: "4", name: "Lead Qualifier", status: "processing", tasksCompleted: 426, lastActive: "Just now", icon: Users, color: "text-green-600" },
];

const recentActivity = [
  { id: "1", agent: "Email Triage Agent", action: "Processed 12 high-priority emails", time: "2 min ago", icon: Mail },
  { id: "2", agent: "Lead Qualifier", action: "Qualified 3 new leads from website", time: "5 min ago", icon: Users },
  { id: "3", agent: "Meeting Notes Generator", action: "Generated notes for TechCorp call", time: "15 min ago", icon: FileText },
  { id: "4", agent: "CRM Data Sync", action: "Synced 24 contacts to Salesforce", time: "30 min ago", icon: Database },
];

const aiInsights = [
  { id: "1", title: "Email processing efficiency up 45%", metric: "+45%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  { id: "2", title: "2.5 hours saved today", metric: "2.5h", icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
  { id: "3", title: "3 high-value leads need attention", metric: "3 leads", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
];

export function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState("snapshot");
  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));

  useEffect(() => {
    // Animate stats counting up
    const timers = stats.map((stat, index) => {
      return setTimeout(() => {
        const value = typeof stat.value === 'number' ? stat.value : parseFloat(stat.value.replace(/[^0-9.]/g, ''));
        let current = 0;
        const increment = value / 30;
        const interval = setInterval(() => {
          current += increment;
          if (current >= value) {
            current = value;
            clearInterval(interval);
          }
          setAnimatedStats(prev => {
            const newStats = [...prev];
            newStats[index] = current;
            return newStats;
          });
        }, 30);
      }, index * 100);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const formatStatValue = (index: number) => {
    const stat = stats[index];
    const value = animatedStats[index];
    
    if (typeof stat.value === 'string') {
      if (stat.value.includes('%')) {
        return `${value.toFixed(1)}%`;
      }
      if (stat.value.includes(',')) {
        return Math.floor(value).toLocaleString();
      }
    }
    return Math.floor(value);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-8 overflow-hidden">
      {/* Hero Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-4">
          Welcome back! Here's an overview of your AI agents and workflows.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="outline" className="bg-gradient-to-br from-blue-500/10 to-blue-500/20 text-blue-600 border-0 rounded-full px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {activeAgents.filter(a => a.status !== "idle").length} Active Agents
          </Badge>
          <Badge variant="outline" className="bg-gradient-to-br from-green-500/10 to-green-500/20 text-green-600 border-0 rounded-full px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            1,247 Tasks Completed
          </Badge>
          <Badge variant="outline" className="bg-gradient-to-br from-purple-500/10 to-purple-500/20 text-purple-600 border-0 rounded-full px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            342 Hours Saved
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className={`p-4 bg-gradient-to-br ${stat.gradient} border-0 hover:shadow-lg transition-shadow`}>
                <div className="flex items-center gap-3">
                  <div className={`${stat.textColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-xl ${stat.textColor}`}>
                      {formatStatValue(index)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Toolbar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="bg-background/80 backdrop-blur-lg border border-border rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 grid grid-cols-6 gap-1">
            <TabsTrigger value="tips" className="text-xs rounded-full px-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Lightbulb className="h-3 w-3 mr-1" />
              Tips
            </TabsTrigger>
            <TabsTrigger value="snapshot" className="text-xs rounded-full px-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              Snapshot
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs rounded-full px-3 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Bot className="h-3 w-3 mr-1" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="planner" className="text-xs rounded-full px-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <CalendarDays className="h-3 w-3 mr-1" />
              Planner
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs rounded-full px-3 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <MessageSquare className="h-3 w-3 mr-1" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs rounded-full px-3 data-[state=active]:bg-emerald-400 data-[state=active]:text-white">
              <Bot className="h-3 w-3 mr-1" />
              Agents
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content Card */}
        <Card className="p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-0 rounded-2xl">
          <TabsContent value="snapshot" className="m-0">
          <div className="space-y-4">
            <h3 className="text-lg mb-4">AI Intelligence Brief</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {aiInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className={`p-4 ${insight.bg} border-0`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${insight.color} flex-shrink-0 mt-0.5`} />
                        <div>
                          <p className="text-sm mb-1">{insight.title}</p>
                          <p className={`text-lg ${insight.color}`}>{insight.metric}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Active Agents */}
              <div>
                <h4 className="text-sm mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Active Agents
                </h4>
                <div className="space-y-2">
                  {activeAgents.map((agent, index) => {
                    const Icon = agent.icon;
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Card className="p-3 hover:shadow-md transition-shadow border border-gray-100">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${agent.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">{agent.name}</p>
                              <p className="text-[10px] text-muted-foreground">{agent.tasksCompleted} tasks • {agent.lastActive}</p>
                            </div>
                            {agent.status === "processing" && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="text-sm mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Card className="p-3 hover:shadow-md transition-shadow border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">{activity.action}</p>
                              <p className="text-[10px] text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tips" className="m-0">
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Pro Tips & Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Get instant help and one-click solutions</p>
          </div>
        </TabsContent>

        <TabsContent value="automations" className="m-0">
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Active Automations</h3>
            <p className="text-sm text-muted-foreground">Manage your workflow automations</p>
          </div>
        </TabsContent>

        <TabsContent value="planner" className="m-0">
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Smart Planner</h3>
            <p className="text-sm text-muted-foreground">AI-organized tasks and calendar</p>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="m-0">
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-cyan-500 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Team Messages</h3>
            <p className="text-sm text-muted-foreground">Collaborate with your team</p>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="m-0">
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Agent Conversations</h3>
            <p className="text-sm text-muted-foreground">Chat with your AI agents</p>
          </div>
        </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
