'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, DollarSign, Calendar } from 'lucide-react';

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  company: z.string().optional(),
  estimatedValue: z.number().nonnegative('Value must be positive').optional(),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  score: z.number().min(0).max(100).optional(),
  nextFollowUpAt: z.string().optional(),
  notes: z.string().optional(),
});

type DealForm = z.infer<typeof dealSchema>;

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: any; // Existing deal for edit mode
  onSuccess: () => void;
}

const STAGE_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export function DealDialog({ open, onOpenChange, deal, onSuccess }: DealDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!deal;
  
  const form = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: '',
      company: '',
      estimatedValue: 0,
      stage: 'new',
      score: 50,
      nextFollowUpAt: '',
      notes: '',
    },
  });
  
  // Update form when deal prop changes
  useEffect(() => {
    if (deal && open) {
      // Convert cents to dollars for display
      const valueInDollars = deal.estimatedValue ? deal.estimatedValue / 100 : 0;
      
      form.reset({
        name: deal.name || '',
        company: deal.company || '',
        estimatedValue: valueInDollars,
        stage: deal.stage || 'new',
        score: deal.score || 50,
        nextFollowUpAt: deal.nextFollowUpAt 
          ? new Date(deal.nextFollowUpAt).toISOString().split('T')[0]
          : '',
        notes: deal.notes || '',
      });
    } else if (!open) {
      form.reset({
        name: '',
        company: '',
        estimatedValue: 0,
        stage: 'new',
        score: 50,
        nextFollowUpAt: '',
        notes: '',
      });
    }
  }, [deal, open, form]);
  
  const onSubmit = async (data: DealForm) => {
    setIsLoading(true);
    try {
      const url = isEditMode 
        ? `/api/crm/deals/${deal.id}`
        : '/api/crm/deals';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save deal');
      }
      
      toast.success(isEditMode ? 'Deal updated successfully!' : 'Deal created successfully!');
      onOpenChange(false);
      onSuccess();
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save deal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto" aria-describedby="deal-dialog-description">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        <p id="deal-dialog-description" className="sr-only">
          {isEditMode ? 'Edit the deal information below' : 'Fill in the form to create a new deal'}
        </p>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Deal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Acme Corp - Enterprise Plan"
              {...form.register('name')}
              aria-invalid={!!form.formState.errors.name}
              disabled={isLoading}
              className="rounded-xl"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Acme Corporation"
              {...form.register('company')}
              disabled={isLoading}
              className="rounded-xl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Estimated Value */}
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...form.register('estimatedValue', { valueAsNumber: true })}
                  disabled={isLoading}
                  className="rounded-xl pl-9"
                />
              </div>
              {form.formState.errors.estimatedValue && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.estimatedValue.message}
                </p>
              )}
            </div>
            
            {/* Stage */}
            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select
                value={form.watch('stage')}
                onValueChange={(value) => form.setValue('stage', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger id="stage" className="rounded-xl">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Score/Probability */}
            <div className="space-y-2">
              <Label htmlFor="score">Win Probability (%)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                placeholder="50"
                {...form.register('score', { valueAsNumber: true })}
                disabled={isLoading}
                className="rounded-xl"
              />
              {form.formState.errors.score && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.score.message}
                </p>
              )}
            </div>
            
            {/* Next Follow-Up Date */}
            <div className="space-y-2">
              <Label htmlFor="nextFollowUpAt">Next Follow-Up</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="nextFollowUpAt"
                  type="date"
                  {...form.register('nextFollowUpAt')}
                  disabled={isLoading}
                  className="rounded-xl pl-9"
                />
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information about this deal..."
              rows={4}
              {...form.register('notes')}
              disabled={isLoading}
              className="rounded-xl resize-none"
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{isEditMode ? 'Update Deal' : 'Create Deal'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
