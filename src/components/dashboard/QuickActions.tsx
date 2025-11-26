"use client";

import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, BookOpen, Plug, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

const actions = [
  {
    title: "Create New Agent",
    description: "Set up a new AI agent for your workflow",
    icon: Plus,
    color: "bg-blue-500/10 text-blue-500",
    href: "/studio",
  },
  {
    title: "View Knowledge Base",
    description: "Access and manage your documentation",
    icon: BookOpen,
    color: "bg-green-500/10 text-green-500",
    href: "/knowledge-base",
  },
  {
    title: "Manage Integrations",
    description: "Connect your tools and services",
    icon: Plug,
    color: "bg-purple-500/10 text-purple-500",
    href: "/integrations",
  },
  {
    title: "Talk to AI Assistant",
    description: "Get help from your AI assistant",
    icon: MessageSquare,
    color: "bg-orange-500/10 text-orange-500",
    href: "/assistant",
  },
];

export function QuickActions() {
  const router = useRouter();

  const handleClick = (href: string) => {
    router.push(href);
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Card 
            key={action.title} 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleClick(action.href)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(action.href);
              }
            }}
            aria-label={`${action.title}: ${action.description}`}
          >
            <div className={`rounded-lg p-3 w-fit ${action.color} mb-4`}>
              <action.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mb-2 font-semibold">{action.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {action.description}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleClick(action.href);
              }}
            >
              Get Started
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
