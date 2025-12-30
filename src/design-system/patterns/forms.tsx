/**
 * Form Patterns for GalaxyCo.ai
 * Reusable form layouts and components
 * 
 * Copy these patterns for instant professional forms
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================================
// PATTERN 1: Simple Form
// ============================================================================

/**
 * Basic form with label/input pairs
 * Used in: Quick actions, simple dialogs
 */
export function SimpleFormPattern() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Enter name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="email@example.com" />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </form>
  );
}

// ============================================================================
// PATTERN 2: Card Form
// ============================================================================

/**
 * Form inside a card container
 * Used in: Settings pages, profile edits
 */
export function CardFormPattern() {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Form Title</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Brief description of what this form does
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Acme Inc." />
            <p className="text-xs text-muted-foreground">
              Your company or organization name
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// PATTERN 3: Multi-Column Form
// ============================================================================

/**
 * Two-column form for complex data entry
 * Used in: Contact forms, deal creation, agent setup
 */
export function MultiColumnFormPattern() {
  return (
    <form className="space-y-8">
      {/* Section 1 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the essential details
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" />
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Additional Details</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Optional information
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes..."
            rows={4}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline">Cancel</Button>
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
}

// ============================================================================
// PATTERN 4: Inline Edit Form
// ============================================================================

/**
 * Inline editing pattern
 * Used in: Quick edits, table cells, property lists
 */
export function InlineEditPattern() {
  return (
    <div className="space-y-3">
      {/* Editable Field */}
      <div className="flex items-center gap-2">
        <Label className="w-32 text-sm">Name:</Label>
        <div className="flex-1 flex items-center gap-2">
          <Input defaultValue="John Doe" className="flex-1" />
          <Button size="sm">Save</Button>
        </div>
      </div>

      {/* Editable Field */}
      <div className="flex items-center gap-2">
        <Label className="w-32 text-sm">Email:</Label>
        <div className="flex-1 flex items-center gap-2">
          <Input defaultValue="john@example.com" className="flex-1" />
          <Button size="sm">Save</Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT ALL PATTERNS
// ============================================================================

const formPatterns = {
  SimpleFormPattern,
  CardFormPattern,
  MultiColumnFormPattern,
  InlineEditPattern,
};

export default formPatterns;
