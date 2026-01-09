'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { PhoneNumberCard } from '@/components/settings/PhoneNumberCard';
import { useWorkspace } from '@/hooks/useWorkspace';

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

export default function PhoneNumbersPage() {
  const { workspace } = useWorkspace();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNumber, setEditingNumber] = useState<PhoneNumber | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace?.id) {
      fetchPhoneNumbers();
    }
  }, [workspace?.id]);

  const fetchPhoneNumbers = async () => {
    if (!workspace?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/workspaces/${workspace.id}/phone-numbers`);
      if (!response.ok) throw new Error('Failed to fetch phone numbers');
      const data = await response.json();
      setPhoneNumbers(data.phoneNumbers);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionNumber = async (numberType: string = 'primary', areaCode: string = '405') => {
    if (!workspace?.id) return;

    try {
      setProvisioning(true);
      const response = await fetch(`/api/workspaces/${workspace.id}/phone-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberType, areaCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to provision phone number');
      }

      const data = await response.json();
      setPhoneNumbers([...phoneNumbers, data.phoneNumber]);
      toast.success('Phone number provisioned successfully');
      setShowAddModal(false);
    } catch (error: unknown) {
      console.error('Error provisioning phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to provision phone number');
    } finally {
      setProvisioning(false);
    }
  };

  const handleEditNumber = async (phoneNumber: PhoneNumber) => {
    setEditingNumber(phoneNumber);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (friendlyName: string, numberType: string) => {
    if (!workspace?.id || !editingNumber) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/workspaces/${workspace.id}/phone-numbers/${editingNumber.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendlyName, numberType }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update phone number');
      }

      const data = await response.json();
      setPhoneNumbers(
        phoneNumbers.map((p) => (p.id === editingNumber.id ? data.phoneNumber : p))
      );
      toast.success('Phone number updated successfully');
      setShowEditModal(false);
      setEditingNumber(null);
    } catch (error: unknown) {
      console.error('Error updating phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update phone number');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNumber = async (phoneNumber: PhoneNumber) => {
    if (!workspace?.id) return;
    if (!confirm(`Are you sure you want to release ${phoneNumber.phoneNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/phone-numbers/${phoneNumber.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to release phone number');
      }

      setPhoneNumbers(phoneNumbers.filter((p) => p.id !== phoneNumber.id));
      toast.success('Phone number released successfully');
    } catch (error: unknown) {
      console.error('Error releasing phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to release phone number');
    }
  };

  const canAddNumber =
    workspace?.subscriptionTier === 'professional' && phoneNumbers.length < 1 ||
    workspace?.subscriptionTier === 'enterprise' && phoneNumbers.length < 10;

  const isStarterPlan = workspace?.subscriptionTier === 'starter';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phone Numbers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace phone numbers for calls and messaging
          </p>
        </div>

        {!isStarterPlan && canAddNumber && (
          <button
            onClick={() => setShowAddModal(true)}
            disabled={provisioning}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Add Number</span>
          </button>
        )}
      </div>

      {/* Starter Plan Upgrade Banner */}
      {isStarterPlan && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Upgrade to Pro for Your Own Phone Number
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Get a dedicated phone number for professional branding. Messages will be sent from your own number instead of the shared platform number.
              </p>
              <a
                href="/billing"
                className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* No Numbers State */}
      {!isStarterPlan && phoneNumbers.length === 0 && (
        <div className="bg-card border rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
            <Phone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Phone Numbers Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Provision your first phone number to start sending and receiving calls and messages.
          </p>
          <button
            onClick={() => handleProvisionNumber()}
            disabled={provisioning}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {provisioning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Provisioning...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Provision Phone Number</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Phone Numbers Grid */}
      {phoneNumbers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phoneNumbers.map((phoneNumber) => (
            <PhoneNumberCard
              key={phoneNumber.id}
              phoneNumber={phoneNumber}
              onEdit={handleEditNumber}
              onDelete={handleDeleteNumber}
            />
          ))}
        </div>
      )}

      {/* Add Number Modal (Simple Version) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Add Phone Number</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number Type</label>
                <select
                  id="numberType"
                  className="w-full h-10 px-3 border rounded-lg bg-background"
                  defaultValue="sales"
                >
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Area Code</label>
                <input
                  type="text"
                  id="areaCode"
                  placeholder="405"
                  defaultValue="405"
                  className="w-full h-10 px-3 border rounded-lg bg-background"
                  maxLength={3}
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Cost:</strong> $5.00/month
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={provisioning}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const numberType = (document.getElementById('numberType') as HTMLSelectElement).value;
                  const areaCode = (document.getElementById('areaCode') as HTMLInputElement).value;
                  handleProvisionNumber(numberType, areaCode);
                }}
                disabled={provisioning}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {provisioning ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Provision Number'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Number Modal */}
      {showEditModal && editingNumber && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Phone Number</h2>
            
            <div className="space-y-4">
              {/* Phone Number Display */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                <p className="text-base font-medium">{editingNumber.phoneNumber}</p>
              </div>

              {/* Friendly Name Input */}
              <div>
                <label htmlFor="editFriendlyName" className="block text-sm font-medium mb-2">
                  Friendly Name
                </label>
                <input
                  type="text"
                  id="editFriendlyName"
                  placeholder="e.g., Main Office, Sales Team, Support Line"
                  defaultValue={editingNumber.friendlyName || ''}
                  className="w-full h-10 px-3 border rounded-lg bg-background"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Add a memorable name for this number
                </p>
              </div>

              {/* Number Type Select */}
              <div>
                <label htmlFor="editNumberType" className="block text-sm font-medium mb-2">
                  Number Type
                </label>
                <select
                  id="editNumberType"
                  className="w-full h-10 px-3 border rounded-lg bg-background"
                  defaultValue={editingNumber.numberType}
                  disabled={editingNumber.numberType === 'primary'}
                >
                  <option value="primary">Primary</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="custom">Custom</option>
                </select>
                {editingNumber.numberType === 'primary' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Primary number type cannot be changed
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingNumber(null);
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const friendlyName = (document.getElementById('editFriendlyName') as HTMLInputElement).value;
                  const numberType = (document.getElementById('editNumberType') as HTMLSelectElement).value;
                  handleSaveEdit(friendlyName, numberType);
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
