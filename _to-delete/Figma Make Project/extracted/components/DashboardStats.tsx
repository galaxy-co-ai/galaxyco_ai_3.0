import { Card } from "./ui/card";
import { CheckCircle2, Bot, Clock, TrendingUp } from "lucide-react";

const stats = [
  {
    label: "Active Agents",
    value: "12",
    icon: Bot,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    label: "Tasks Completed",
    value: "1,247",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    label: "Hours Saved",
    value: "342",
    icon: Clock,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    label: "Success Rate",
    value: "98.5%",
    icon: TrendingUp,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <h3 className="mt-2 text-3xl">{stat.value}</h3>
            </div>
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
