import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { CustomFieldsManager } from "@/components/crm/CustomFieldsManager";

export const metadata: Metadata = {
  title: "Custom Fields | CRM Settings",
  description: "Manage custom fields for contacts, companies, and deals",
};

export default function CustomFieldsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/settings">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Fields</h1>
          <p className="text-muted-foreground">
            Create and manage custom data fields for your CRM entities
          </p>
        </div>
      </div>

      {/* Content */}
      <CustomFieldsManager />
    </div>
  );
}
