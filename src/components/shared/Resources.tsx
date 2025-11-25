"use client";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { FileText, Code, Users, Video, ExternalLink } from "lucide-react";

const resources = [
  {
    title: "Documentation",
    description: "Learn how to use GalaxyCo.ai",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "API Reference",
    description: "Integrate with our API",
    icon: Code,
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Community Forum",
    description: "Connect with other users",
    icon: Users,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step guides",
    icon: Video,
    color: "bg-orange-500/10 text-orange-500",
  },
];

export function Resources() {
  return (
    <div>
      <h2 className="mb-4">Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((resource) => (
          <Card key={resource.title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className={`rounded-lg p-3 w-fit ${resource.color} mb-4`}>
              <resource.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2">{resource.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {resource.description}
            </p>
            <Button variant="ghost" size="sm" className="w-full">
              Learn More
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

