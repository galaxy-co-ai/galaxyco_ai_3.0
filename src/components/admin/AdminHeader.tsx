"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Rocket, 
  ArrowLeft,
  Activity,
  FileText,
  MessageSquareWarning,
  Users,
  Mail
} from "lucide-react";
import AdminTabs from "./AdminTabs";

interface AdminHeaderProps {
  userName: string;
  counts?: {
    content?: number;
    feedback?: number;
  };
  stats?: {
    posts?: number;
    feedback?: number;
    users?: number;
    subscribers?: number;
  };
}

export default function AdminHeader({ userName, counts = {}, stats }: AdminHeaderProps) {
  return (
    <div className="border-b bg-background px-6 py-4">
      <div className="space-y-4">
        {/* Top Row - Title and Back Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Back to App Button */}
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to App</span>
              </Button>
            </Link>
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {userName}
                </p>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge variant="outline" className="text-xs gap-1.5 py-1.5 px-3">
            <Activity className="h-3 w-3 text-green-500" />
            System Healthy
          </Badge>
        </div>

        {/* Stats Bar - Centered (shown if stats provided) */}
        {stats && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
              <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span className="font-semibold">{stats.posts ?? 0}</span>
              <span className="ml-1 text-blue-600/70 font-normal">Posts</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
              <MessageSquareWarning className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
              <span className="font-semibold">{stats.feedback ?? 0}</span>
              <span className="ml-1 text-amber-600/70 font-normal">Feedback</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
              <Users className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              <span className="font-semibold">{stats.users ?? 0}</span>
              <span className="ml-1 text-green-600/70 font-normal">Users</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
              <Mail className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              <span className="font-semibold">{stats.subscribers ?? 0}</span>
              <span className="ml-1 text-purple-600/70 font-normal">Subscribers</span>
            </Badge>
          </div>
        )}

        {/* Floating Tab Bar */}
        <div className="mt-2">
          <AdminTabs counts={counts} />
        </div>
      </div>
    </div>
  );
}
