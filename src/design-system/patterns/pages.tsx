/**
 * GalaxyCo.ai Page Patterns
 * Pre-built page layouts for instant consistency
 * 
 * Usage:
 * 1. Copy the pattern you need
 * 2. Replace placeholder content
 * 3. Ship in 5 minutes
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ============================================================================
// PATTERN 1: Dashboard Page
// ============================================================================

/**
 * Standard dashboard layout with stats cards and content sections
 * Used in: Main Dashboard, CRM Dashboard, Analytics pages
 */
export function DashboardPattern() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Title</h1>
          <p className="text-muted-foreground mt-2">
            Brief description of what this dashboard shows
          </p>
        </div>
        <Button>Primary Action</Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Metric Name
              </p>
              <Badge variant="secondary">+12%</Badge>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground mt-1">
                vs last period
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Section Title</h3>
          {/* Content goes here */}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Section Title</h3>
          {/* Content goes here */}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// PATTERN 2: List/Table Page
// ============================================================================

/**
 * Standard list view with filters and actions
 * Used in: Contacts, Deals, Agents, Documents
 */
export function ListPattern() {
  return (
    <div className="space-y-6 p-6">
      {/* Header with Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Search, Filters, Actions */}
          <Button variant="outline">Filter</Button>
          <Button>Create New</Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">All Items (234)</Badge>
        <Badge variant="outline">Category 1 (45)</Badge>
        <Badge variant="outline">Category 2 (67)</Badge>
      </div>

      {/* Content Card */}
      <Card>
        <div className="p-6">
          {/* EnhancedDataTable or custom list goes here */}
          <p className="text-muted-foreground text-center py-12">
            Table content goes here
          </p>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// PATTERN 3: Detail/Profile Page
// ============================================================================

/**
 * Detail view with sidebar and tabbed content
 * Used in: Contact Details, Agent Details, Deal Details
 */
export function DetailPattern() {
  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Back to List</span>
          <span>/</span>
          <span className="text-foreground font-medium">Item Name</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {/* Avatar/Icon */}
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-2xl font-bold text-white">
            AB
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Item Name</h1>
            <p className="text-muted-foreground mt-1">
              Brief description or subtitle
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge>Status</Badge>
              <Badge variant="outline">Type</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Info</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Field Name</p>
              <p className="font-medium">Value</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Field Name</p>
              <p className="font-medium">Value</p>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Overview</h3>
            {/* Content */}
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Activity</h3>
            {/* Content */}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PATTERN 4: Settings Page
// ============================================================================

/**
 * Settings layout with sidebar navigation
 * Used in: Settings, Preferences, Configuration pages
 */
export function SettingsPattern() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <Card className="p-6 lg:col-span-1">
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              Section 1
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Section 2
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Section 3
            </Button>
          </nav>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Section Title</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Description of what this section controls
            </p>
            {/* Form fields go here */}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PATTERN 5: Wizard/Multi-Step Form
// ============================================================================

/**
 * Multi-step wizard pattern
 * Used in: Onboarding, Agent Creation, Setup Wizards
 */
export function WizardPattern() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div className="h-[2px] w-12 bg-border"></div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="h-[2px] w-12 bg-border"></div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Step Title</h2>
            <p className="text-muted-foreground mt-2">
              Brief description of this step
            </p>
          </div>

          {/* Form fields go here */}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <Button variant="outline">Back</Button>
            <Button>Continue</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// PATTERN 6: Empty State
// ============================================================================

/**
 * Empty state pattern for when there's no data
 * Used throughout app when lists/tables are empty
 */
export function EmptyStatePattern() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        {/* Icon/Illustration */}
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>

        <h3 className="text-lg font-semibold mb-2">No items yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Get started by creating your first item. It only takes a minute.
        </p>

        <Button>Create Your First Item</Button>
      </div>
    </Card>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const pagePatterns = {
  DashboardPattern,
  ListPattern,
  DetailPattern,
  SettingsPattern,
  WizardPattern,
  EmptyStatePattern,
};

export default pagePatterns;
