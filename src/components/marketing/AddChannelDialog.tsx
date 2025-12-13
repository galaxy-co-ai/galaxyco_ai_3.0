'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


import { toast } from 'sonner';
import { Loader2, Mail, Share2, Megaphone, FileText, Search, Users } from 'lucide-react';

// Validation schema for input
const channelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  type: z.enum(['email', 'social', 'ads', 'content', 'seo', 'affiliate']),
  description: z.string().max(500, 'Description is too long').optional(),
  budget: z.string().optional(),
});

type ChannelForm = z.infer<typeof channelSchema>;

// Channel type info for display
const channelTypes = [
  { value: 'email', label: 'Email Marketing', icon: Mail, color: 'bg-blue-100 text-blue-600' },
  { value: 'social', label: 'Social Media', icon: Share2, color: 'bg-pink-100 text-pink-600' },
  { value: 'ads', label: 'Paid Ads', icon: Megaphone, color: 'bg-orange-100 text-orange-600' },
  { value: 'content', label: 'Content Marketing', icon: FileText, color: 'bg-emerald-100 text-emerald-600' },
  { value: 'seo', label: 'SEO', icon: Search, color: 'bg-purple-100 text-purple-600' },
  { value: 'affiliate', label: 'Affiliate', icon: Users, color: 'bg-cyan-100 text-cyan-600' },
] as const;

interface AddChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddChannelDialog({ open, onOpenChange, onSuccess }: AddChannelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const form = useForm<ChannelForm>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      name: '',
      type: 'email',
      description: '',
      budget: '',
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedType(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: ChannelForm) => {
    setIsLoading(true);

    // Parse budget from string to number
    const budgetValue = data.budget ? parseFloat(data.budget) : undefined;
    const budget = budgetValue && !isNaN(budgetValue) ? budgetValue : undefined;

    try {
      const response = await fetch('/api/marketing/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          description: data.description || undefined,
          budget,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create channel');
      }

      toast.success('Channel created successfully');
      handleClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    form.setValue('type', type as ChannelForm['type']);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Marketing Channel</DialogTitle>
          <DialogDescription>
            Connect a new marketing channel to track performance and manage campaigns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Channel Type Selector */}
          <div className="space-y-3">
            <Label>Channel Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {channelTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value || form.watch('type') === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    aria-label={`Select ${type.label}`}
                    aria-pressed={isSelected}
                  >
                    <div className={`p-2 rounded-md ${type.color}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-medium text-center">{type.label}</span>
                  </button>
                );
              })}
            </div>
            {form.formState.errors.type && (
              <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              placeholder="e.g., Mailchimp, Facebook Ads, Blog"
              {...form.register('name')}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this channel's purpose"
              rows={2}
              {...form.register('description')}
              aria-invalid={!!form.formState.errors.description}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Budget Field */}
          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                {...form.register('budget')}
                aria-invalid={!!form.formState.errors.budget}
              />
            </div>
            {form.formState.errors.budget && (
              <p className="text-sm text-destructive">{form.formState.errors.budget.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                'Create Channel'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddChannelDialog;

