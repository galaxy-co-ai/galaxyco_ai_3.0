"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquareWarning, Users, TrendingUp, Mail, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BacklogTab } from "./BacklogTab";

interface AdminStats {
  posts: { total: number; published: number; drafts: number };
  feedback: { total: number; new: number };
  users: { total: number; recent: number };
  subscribers: number;
}

interface FeedbackItem {
  id: string;
  type: string;
  title: string | null;
  pageUrl: string | null;
  sentiment: string | null;
  status: string;
  createdAt: Date;
}

interface AdminDashboardClientProps {
  stats: AdminStats;
  recentFeedback: FeedbackItem[];
}

export function AdminDashboardClient({ stats, recentFeedback }: AdminDashboardClientProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Stats Bar - Centered badges */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
          <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          <span className="font-semibold">{stats.posts.total}</span>
          <span className="ml-1 text-blue-600/70 font-normal">Posts</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
          <MessageSquareWarning className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
          <span className="font-semibold">{stats.feedback.total}</span>
          <span className="ml-1 text-amber-600/70 font-normal">Feedback</span>
          {stats.feedback.new > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">{stats.feedback.new}</span>
          )}
        </Badge>
        <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <Users className="h-3.5 w-3.5 mr-1.5 text-green-600" />
          <span className="font-semibold">{stats.users.total}</span>
          <span className="ml-1 text-green-600/70 font-normal">Users</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
          <Mail className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          <span className="font-semibold">{stats.subscribers}</span>
          <span className="ml-1 text-purple-600/70 font-normal">Subscribers</span>
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="backlog" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Backlog
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <a 
                  href="/admin/content/new" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Create New Post</p>
                    <p className="text-sm text-muted-foreground">Write a new Launchpad article</p>
                  </div>
                </a>
                <a 
                  href="/admin/feedback" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <MessageSquareWarning className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Review Feedback</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.feedback.new > 0 ? `${stats.feedback.new} items need attention` : 'All caught up!'}
                    </p>
                  </div>
                </a>
                <a 
                  href="/admin/analytics" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">View Analytics</p>
                    <p className="text-sm text-muted-foreground">Check engagement metrics</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>Latest user submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentFeedback.length > 0 ? (
                  <div className="space-y-3">
                    {recentFeedback.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className={`p-1.5 rounded-lg ${
                          item.type === 'bug' ? 'bg-red-500/10' :
                          item.type === 'suggestion' ? 'bg-blue-500/10' :
                          'bg-zinc-500/10'
                        }`}>
                          <MessageSquareWarning className={`h-3 w-3 ${
                            item.type === 'bug' ? 'text-red-500' :
                            item.type === 'suggestion' ? 'text-blue-500' :
                            'text-zinc-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.title || `${item.type} feedback`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.pageUrl}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquareWarning className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No feedback yet</p>
                    <p className="text-xs">Feedback will appear here when users submit it</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backlog Tab */}
        <TabsContent value="backlog">
          <BacklogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

