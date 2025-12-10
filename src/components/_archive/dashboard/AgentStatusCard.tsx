import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { LucideIcon } from "lucide-react";

interface AgentStatusCardProps {
  name: string;
  description: string;
  status: "active" | "idle" | "processing";
  icon: LucideIcon;
  tasksToday: number;
  color: string;
}

const statusConfig = {
  active: { label: "Active", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  idle: { label: "Idle", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  processing: { label: "Processing", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
};

export function AgentStatusCard({
  name,
  description,
  status,
  icon: Icon,
  tasksToday,
  color,
}: AgentStatusCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <Badge variant="outline" className={statusConfig[status].className}>
          {statusConfig[status].label}
        </Badge>
      </div>
      <div className="mt-4">
        <h3>{name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tasks today</span>
          <span className="text-sm">{tasksToday}</span>
        </div>
      </div>
    </Card>
  );
}
