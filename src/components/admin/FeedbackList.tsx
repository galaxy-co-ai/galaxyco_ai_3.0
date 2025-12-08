"use client";

import { useState, useMemo } from "react";
import { 
  Bug, 
  Lightbulb, 
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquareWarning,
  AlertCircle,
  Eye,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import FeedbackStatusDropdown from './FeedbackStatusDropdown';

type FeedbackStatus = 'new' | 'in_review' | 'planned' | 'in_progress' | 'done' | 'closed' | 'wont_fix';

interface FeedbackItem {
  id: string;
  type: string;
  sentiment: string | null;
  title: string | null;
  content: string | null;
  pageUrl: string | null;
  featureArea: string | null;
  status: string;
  createdAt: Date;
  userEmail: string | null;
}

interface StatusCounts {
  all: number;
  new: number;
  in_review: number;
  planned: number;
  in_progress: number;
  done: number;
  closed: number;
  wont_fix: number;
}

interface FeedbackListProps {
  initialFeedback: FeedbackItem[];
  initialCounts: StatusCounts;
}

const statusConfig: Record<FeedbackStatus | 'all', {
  label: string;
  icon: typeof CheckCircle2;
  bgColor: string;
  textColor: string;
  borderColor: string;
  activeBg: string;
  iconColor: string;
  countBg: string;
}> = {
  all: {
    label: 'All',
    icon: Filter,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    activeBg: 'bg-slate-200',
    iconColor: 'text-slate-600',
    countBg: 'bg-slate-500',
  },
  new: {
    label: 'New',
    icon: AlertCircle,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    activeBg: 'bg-blue-200',
    iconColor: 'text-blue-600',
    countBg: 'bg-blue-500',
  },
  in_review: {
    label: 'In Review',
    icon: Eye,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    activeBg: 'bg-amber-200',
    iconColor: 'text-amber-600',
    countBg: 'bg-amber-500',
  },
  planned: {
    label: 'Planned',
    icon: Lightbulb,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    activeBg: 'bg-purple-200',
    iconColor: 'text-purple-600',
    countBg: 'bg-purple-500',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    activeBg: 'bg-indigo-200',
    iconColor: 'text-indigo-600',
    countBg: 'bg-indigo-500',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    activeBg: 'bg-green-200',
    iconColor: 'text-green-600',
    countBg: 'bg-green-500',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    bgColor: 'bg-zinc-50',
    textColor: 'text-zinc-700',
    borderColor: 'border-zinc-200',
    activeBg: 'bg-zinc-200',
    iconColor: 'text-zinc-600',
    countBg: 'bg-zinc-500',
  },
  wont_fix: {
    label: "Won't Fix",
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    activeBg: 'bg-red-200',
    iconColor: 'text-red-600',
    countBg: 'bg-red-500',
  },
};

function getTypeIcon(type: string) {
  switch (type) {
    case 'bug':
      return <Bug className="h-4 w-4 text-red-500" />;
    case 'suggestion':
      return <Lightbulb className="h-4 w-4 text-amber-500" />;
    case 'feature_request':
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    default:
      return <MessageCircle className="h-4 w-4 text-zinc-500" />;
  }
}

function getSentimentIcon(sentiment: string | null) {
  switch (sentiment) {
    case 'very_positive':
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'negative':
    case 'very_negative':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-zinc-400" />;
  }
}

export default function FeedbackList({ initialFeedback, initialCounts }: FeedbackListProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [counts, setCounts] = useState(initialCounts);
  const [activeFilter, setActiveFilter] = useState<FeedbackStatus | 'all'>('all');

  // Filter feedback based on selected status
  const filteredFeedback = useMemo(() => {
    if (activeFilter === 'all') {
      return feedback;
    }
    return feedback.filter(item => item.status === activeFilter);
  }, [feedback, activeFilter]);

  // Handle status change from dropdown
  const handleStatusChange = (feedbackId: string, oldStatus: string, newStatus: string) => {
    // Update the feedback item's status
    setFeedback(prev => 
      prev.map(item => 
        item.id === feedbackId ? { ...item, status: newStatus } : item
      )
    );

    // Update counts
    setCounts(prev => ({
      ...prev,
      [oldStatus]: Math.max(0, prev[oldStatus as keyof StatusCounts] - 1),
      [newStatus]: (prev[newStatus as keyof StatusCounts] || 0) + 1,
    }));
  };

  const filterOptions: (FeedbackStatus | 'all')[] = [
    'all', 'new', 'in_review', 'planned', 'in_progress', 'done', 'closed', 'wont_fix'
  ];

  return (
    <div className="space-y-6">
      {/* Status Filter Badges - styled like Overview page */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {filterOptions.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = status === 'all' ? counts.all : counts[status];
          const isActive = activeFilter === status;

          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs border transition-colors ${
                isActive 
                  ? `${config.activeBg} ${config.textColor} ${config.borderColor} ring-2 ring-offset-1`
                  : `${config.bgColor} ${config.textColor} ${config.borderColor} hover:opacity-80`
              }`}
              aria-pressed={isActive}
              aria-label={`Filter by ${config.label}`}
            >
              <Icon className={`h-3.5 w-3.5 mr-1.5 ${config.iconColor}`} />
              <span className="font-normal">{config.label}</span>
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  isActive 
                    ? 'bg-white/90 text-gray-700' 
                    : `${config.countBg} text-white`
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeFilter === 'all' ? 'All Feedback' : `${statusConfig[activeFilter].label} Feedback`}
          </CardTitle>
          <CardDescription>
            {filteredFeedback.length > 0 
              ? `Showing ${filteredFeedback.length} item${filteredFeedback.length !== 1 ? 's' : ''}`
              : 'No feedback matches this filter'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length > 0 ? (
            <div className="divide-y">
              {filteredFeedback.map((item) => (
                <div key={item.id} className="py-4 flex items-start gap-4">
                  <div className="mt-1">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} feedback`}
                      </span>
                      <FeedbackStatusDropdown 
                        feedbackId={item.id} 
                        currentStatus={item.status as FeedbackStatus}
                        onStatusChange={(newStatus) => handleStatusChange(item.id, item.status, newStatus)}
                      />
                    </div>
                    {item.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {item.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {getSentimentIcon(item.sentiment)}
                        {item.sentiment?.replace('_', ' ') || 'No sentiment'}
                      </span>
                      <span>📍 {item.featureArea || 'General'}</span>
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                      {item.userEmail && (
                        <span className="truncate max-w-32">{item.userEmail}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquareWarning className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">
                {activeFilter === 'all' ? 'No feedback yet' : `No ${statusConfig[activeFilter].label.toLowerCase()} feedback`}
              </h3>
              <p className="text-muted-foreground">
                {activeFilter === 'all' 
                  ? 'Feedback will appear here when users submit it via the floating button.'
                  : 'Try selecting a different status filter.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

