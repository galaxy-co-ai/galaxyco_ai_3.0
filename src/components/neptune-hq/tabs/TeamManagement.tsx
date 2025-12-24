"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@clerk/nextjs';
import { 
  Users2, 
  UserPlus, 
  Mail, 
  Shield, 
  Clock,
  Search,
  MoreVertical,
  Crown,
  Activity,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'online' | 'offline' | 'away';
  lastActive: string;
  conversationsThisWeek: number;
  messagesThisWeek: number;
}

interface TeamStats {
  totalMembers: number;
  activeToday: number;
  totalConversations: number;
  avgResponseTime: number;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export function TeamManagement() {
  const { orgId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useSWR<{
    stats: TeamStats;
    members: TeamMember[];
    recentActivity: ActivityItem[];
  }>(
    orgId ? `/api/neptune-hq/team?workspaceId=${orgId}` : null,
    fetcher
  );

  const filteredMembers = data?.members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <Badge className="bg-amber-100 text-amber-700 text-[9px] h-4"><Crown className="h-2.5 w-2.5 mr-0.5" />Owner</Badge>;
      case 'admin': return <Badge className="bg-blue-100 text-blue-700 text-[9px] h-4"><Shield className="h-2.5 w-2.5 mr-0.5" />Admin</Badge>;
      default: return <Badge variant="secondary" className="text-[9px] h-4">Member</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-amber-500';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.stats ? (
          <>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Members</span>
                </div>
                <p className="text-2xl font-semibold mt-1">{data.stats.totalMembers}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Active Today</span>
                </div>
                <p className="text-2xl font-semibold mt-1">{data.stats.activeToday}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Conversations</span>
                </div>
                <p className="text-2xl font-semibold mt-1">{data.stats.totalConversations}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Avg Response</span>
                </div>
                <p className="text-2xl font-semibold mt-1">{data.stats.avgResponseTime}s</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members List */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  Team Members
                </CardTitle>
                <Button size="sm" className="h-7 text-xs gap-1">
                  <UserPlus className="h-3 w-3" />
                  Invite
                </Button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMembers.length > 0 ? (
                <div className="divide-y">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          {member.avatar && <AvatarImage src={member.avatar} />}
                          <AvatarFallback className="text-[10px] bg-muted">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                          getStatusColor(member.status)
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium truncate">{member.name}</p>
                          {getRoleBadge(member.role)}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-muted-foreground">{member.conversationsThisWeek} convos</p>
                        <p className="text-[10px] text-muted-foreground">{member.messagesThisWeek} msgs this week</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="divide-y">
                {data.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="p-3">
                    <p className="text-xs">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
