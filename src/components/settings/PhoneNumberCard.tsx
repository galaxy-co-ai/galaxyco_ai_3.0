'use client';

import { useState } from 'react';
import { Phone, Copy, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  phoneNumberSid: string;
  friendlyName: string | null;
  numberType: 'primary' | 'sales' | 'support' | 'custom';
  status: 'active' | 'suspended' | 'released';
  monthlyCost: number;
  provisionedAt: string;
}

interface PhoneNumberCardProps {
  phoneNumber: PhoneNumber;
  onEdit?: (phoneNumber: PhoneNumber) => void;
  onDelete?: (phoneNumber: PhoneNumber) => void;
}

const NUMBER_TYPE_LABELS: Record<string, string> = {
  primary: 'Primary',
  sales: 'Sales',
  support: 'Support',
  custom: 'Custom',
};

const NUMBER_TYPE_COLORS: Record<string, string> = {
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  sales: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  support: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

export function PhoneNumberCard({ phoneNumber, onEdit, onDelete }: PhoneNumberCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber.phoneNumber);
      setCopied(true);
      toast.success('Phone number copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPhoneNumber = (number: string) => {
    // Format +14055551234 as (405) 555-1234
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const areaCode = cleaned.slice(1, 4);
      const prefix = cleaned.slice(4, 7);
      const line = cleaned.slice(7);
      return `(${areaCode}) ${prefix}-${line}`;
    }
    return number;
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header with Number and Type */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">
                  {formatPhoneNumber(phoneNumber.phoneNumber)}
                </h3>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Copy number"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {phoneNumber.friendlyName && (
                <p className="text-sm text-muted-foreground">
                  {phoneNumber.friendlyName}
                </p>
              )}
            </div>
          </div>

          {/* Number Type Badge */}
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              NUMBER_TYPE_COLORS[phoneNumber.numberType]
            }`}
          >
            {NUMBER_TYPE_LABELS[phoneNumber.numberType]}
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <div className="flex items-center space-x-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  phoneNumber.status === 'active'
                    ? 'bg-green-500'
                    : phoneNumber.status === 'suspended'
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium capitalize">
                {phoneNumber.status}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Monthly Cost</p>
            <p className="text-sm font-medium">
              ${(phoneNumber.monthlyCost / 100).toFixed(2)}
            </p>
          </div>

          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Provisioned</p>
            <p className="text-sm font-medium">
              {formatDate(phoneNumber.provisionedAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {phoneNumber.status === 'active' && (onEdit || onDelete) && (
          <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
            {onEdit && (
              <button
                onClick={() => onEdit(phoneNumber)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-muted transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && phoneNumber.numberType !== 'primary' && (
              <button
                onClick={() => onDelete(phoneNumber)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Release</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
