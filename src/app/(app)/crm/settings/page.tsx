import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, FormInput, GitBranch, Settings2 } from "lucide-react";

export const metadata: Metadata = {
  title: "CRM Settings | GalaxyCo",
  description: "Configure your CRM settings",
};

const settingsItems = [
  {
    title: "Custom Fields",
    description: "Create and manage custom data fields for contacts, companies, and deals",
    icon: FormInput,
    href: "/crm/settings/custom-fields",
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Deal Pipelines",
    description: "Configure sales pipelines and customize deal stages",
    icon: GitBranch,
    href: "/crm/settings/pipelines",
    color: "text-violet-600 bg-violet-50",
  },
];

export default function CRMSettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM Settings</h1>
        <p className="text-muted-foreground">
          Configure your CRM to match your business processes
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg mt-3">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Tips */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • <strong>Custom Fields</strong> let you track unique data points specific to your business
          </p>
          <p>
            • <strong>Pipelines</strong> represent your sales process - customize stages and win probabilities for accurate forecasting
          </p>
          <p>
            • Changes to settings apply immediately across your CRM
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
