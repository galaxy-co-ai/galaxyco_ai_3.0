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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Helper function
const formatPhoneNumber = (value: string) => value;

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['hot', 'warm', 'cold']).optional(),
});

type ContactForm = z.infer<typeof contactSchema>;

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: any; // Existing contact for edit mode
  onSuccess: () => void;
}

export function ContactDialog({ open, onOpenChange, contact, onSuccess }: ContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!contact;
  
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      title: '',
      tags: [],
      status: 'warm',
    },
  });
  
  // Update form when contact prop changes
  useEffect(() => {
    if (contact && open) {
      form.reset({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        company: contact.company || '',
        phone: contact.phone || '',
        title: contact.title || '',
        tags: contact.tags || [],
        status: contact.status || 'warm',
      });
    } else if (!open) {
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        phone: '',
        title: '',
        tags: [],
        status: 'warm',
      });
    }
  }, [contact, open, form]);
  
  const onSubmit = async (data: ContactForm) => {
    setIsLoading(true);
    try {
      const url = isEditMode 
        ? `/api/crm/contacts/${contact.id}`
        : '/api/crm/contacts';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save contact');
      }
      
      toast.success(isEditMode ? 'Contact updated successfully!' : 'Contact created successfully!');
      onOpenChange(false);
      onSuccess();
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save contact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl" aria-describedby="contact-dialog-description">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        <p id="contact-dialog-description" className="sr-only">
          {isEditMode ? 'Edit the contact information below' : 'Fill in the form to create a new contact'}
        </p>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...form.register('firstName')}
                aria-invalid={!!form.formState.errors.firstName}
                disabled={isLoading}
                className="rounded-xl"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...form.register('lastName')}
                disabled={isLoading}
                className="rounded-xl"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                {...form.register('email')}
                aria-invalid={!!form.formState.errors.email}
                disabled={isLoading}
                className="rounded-xl"
              />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Inc"
                {...form.register('company')}
                disabled={isLoading}
                className="rounded-xl"
              />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="123-456-7890"
                {...form.register('phone', {
                  onChange: (e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    form.setValue('phone', formatted, { shouldValidate: false });
                  }
                })}
                disabled={isLoading}
                className="rounded-xl"
                maxLength={12}
              />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="VP of Sales"
                {...form.register('title')}
                disabled={isLoading}
                className="rounded-xl"
              />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as 'hot' | 'warm' | 'cold')}
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">🔥 Hot - Active & Engaged</SelectItem>
                <SelectItem value="warm">⚡ Warm - Interested</SelectItem>
                <SelectItem value="cold">❄️ Cold - Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update Contact' : 'Create Contact'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

