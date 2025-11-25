import { Card } from "../ui/card";
import { Bot, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const tickerItems = [
  {
    id: "1",
    icon: Bot,
    label: "Active Agents",
    value: "12",
    description: "Your AI workforce in action",
    color: "from-blue-500/10 to-blue-500/20",
    iconColor: "text-blue-500"
  },
  {
    id: "2",
    icon: CheckCircle2,
    label: "Tasks Completed",
    value: "1,247",
    description: "Successfully automated tasks",
    color: "from-green-500/10 to-green-500/20",
    iconColor: "text-green-500"
  },
  {
    id: "3",
    icon: Clock,
    label: "Hours Saved",
    value: "342",
    description: "Time saved this month",
    color: "from-purple-500/10 to-purple-500/20",
    iconColor: "text-purple-500"
  },
  {
    id: "4",
    icon: TrendingUp,
    label: "Success Rate",
    value: "98.5%",
    description: "Agent task completion rate",
    color: "from-orange-500/10 to-orange-500/20",
    iconColor: "text-orange-500"
  }
];

// Standalone ticker for landing page (no sidebar dependency)
export function StockTickerStandalone() {
  // Duplicate items for seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-xl py-3 shadow-lg backdrop-blur-sm">
      <div className="animate-ticker flex gap-2">
        {duplicatedItems.map((item, index) => (
          <Card
            key={`${item.id}-${index}`}
            className="flex-shrink-0 px-4 py-2 shadow-[0_2px_10px_rgb(0,0,0,0.03)] border-0 rounded-lg bg-white"
          >
            <div className="flex items-center gap-2.5">
              <div className={`h-7 w-7 rounded-md bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</p>
                <p className="whitespace-nowrap">{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
