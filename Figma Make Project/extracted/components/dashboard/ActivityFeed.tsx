import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { 
  Mail, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from "lucide-react";

const activities = [
  {
    id: 1,
    agent: "Email Triage Agent",
    action: "Processed 12 new emails",
    status: "completed",
    time: "2 min ago",
    icon: Mail,
    color: "text-green-500",
  },
  {
    id: 2,
    agent: "CRM Agent",
    action: "Updated contact record for Acme Corp",
    status: "completed",
    time: "5 min ago",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    id: 3,
    agent: "AI Assistant",
    action: "Scheduled follow-up meeting",
    status: "completed",
    time: "8 min ago",
    icon: Calendar,
    color: "text-purple-500",
  },
  {
    id: 4,
    agent: "Invoice Agent",
    action: "Processing invoice #INV-2847",
    status: "processing",
    time: "12 min ago",
    icon: Clock,
    color: "text-orange-500",
  },
  {
    id: 5,
    agent: "Knowledge Base Agent",
    action: "Indexed 47 new documents",
    status: "completed",
    time: "15 min ago",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  {
    id: 6,
    agent: "Email Triage Agent",
    action: "Flagged urgent email from client",
    status: "attention",
    time: "18 min ago",
    icon: AlertCircle,
    color: "text-red-500",
  },
  {
    id: 7,
    agent: "CRM Agent",
    action: "Transcribed sales call with TechStart Inc",
    status: "completed",
    time: "22 min ago",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    id: 8,
    agent: "AI Assistant",
    action: "Created task list from meeting notes",
    status: "completed",
    time: "25 min ago",
    icon: CheckCircle2,
    color: "text-green-500",
  },
];

const statusColors = {
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  processing: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  attention: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function ActivityFeed() {
  return (
    <Card className="flex flex-col">
      <div className="border-b border-border p-4">
        <h3>Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Live agent updates</p>
      </div>
      <ScrollArea className="flex-1 h-[400px]">
        <div className="p-4 space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-4 items-start pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className={`rounded-lg p-2 bg-muted ${activity.color}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{activity.agent}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={statusColors[activity.status as keyof typeof statusColors]}
                  >
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
