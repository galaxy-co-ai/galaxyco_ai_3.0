import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CRMDashboard from '@/components/crm/CRMDashboard';
import type { Lead, Organization, Contact, Deal } from '@/components/crm/CRMDashboard';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CRMDashboard Component', () => {
  const mockLeads: Lead[] = [
    {
      id: 'lead-1',
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Test Corp',
      title: 'CEO',
      phone: '555-0100',
      stage: 'hot',
      score: 90,
      estimatedValue: 100000,
      lastContactedAt: new Date('2025-01-15'),
      nextFollowUpAt: new Date('2025-01-20'),
      interactionCount: 5,
      source: 'website',
      tags: ['enterprise', 'hot-lead'],
      notes: 'Very interested in our product',
    },
    {
      id: 'lead-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      company: 'Another Corp',
      stage: 'warm',
      score: 70,
      estimatedValue: 50000,
      lastContactedAt: null,
      nextFollowUpAt: null,
      interactionCount: 2,
      tags: [],
    },
  ];

  const mockOrganizations: Organization[] = [
    {
      id: 'org-1',
      name: 'Test Corporation',
      email: 'contact@testcorp.com',
      phone: '555-1000',
      website: 'https://testcorp.com',
      status: 'customer',
      industry: 'Technology',
      size: '100-500',
      revenue: 5000000,
      tags: ['enterprise'],
      lastContactedAt: new Date('2025-01-10'),
    },
  ];

  const mockContacts: Contact[] = [
    {
      id: 'contact-1',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      company: 'Enterprise Inc',
      title: 'VP Sales',
      phone: '555-2000',
      tags: ['decision-maker'],
    },
  ];

  const mockDeals: Deal[] = [
    {
      id: 'deal-1',
      title: 'Q1 Enterprise Deal',
      company: 'Big Corp',
      value: 250000,
      stage: 'proposal',
      probability: 75,
      closeDate: new Date('2025-03-31'),
      source: 'referral',
      tags: ['high-value'],
    },
  ];

  const mockStats = {
    totalLeads: 10,
    hotLeads: 3,
    totalOrgs: 5,
    totalValue: 500000,
  };

  it('should render leads tab by default', () => {
    render(
      <CRMDashboard
        initialLeads={mockLeads}
        initialOrganizations={mockOrganizations}
        initialContacts={mockContacts}
        initialDeals={mockDeals}
        stats={mockStats}
      />
    );

    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display correct stats badges', () => {
    render(
      <CRMDashboard
        initialLeads={mockLeads}
        initialOrganizations={mockOrganizations}
        initialContacts={mockContacts}
        initialDeals={mockDeals}
        stats={mockStats}
      />
    );

    expect(screen.getByText(/10 Total Leads/i)).toBeInTheDocument();
    expect(screen.getByText(/3 Hot Leads/i)).toBeInTheDocument();
    expect(screen.getByText(/5 Organizations/i)).toBeInTheDocument();
  });

  it('should filter leads by search query', async () => {
    render(
      <CRMDashboard
        initialLeads={mockLeads}
        initialOrganizations={mockOrganizations}
        initialContacts={mockContacts}
        initialDeals={mockDeals}
        stats={mockStats}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search leads/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('should switch to contacts tab', async () => {
    render(
      <CRMDashboard
        initialLeads={mockLeads}
        initialOrganizations={mockOrganizations}
        initialContacts={mockContacts}
        initialDeals={mockDeals}
        stats={mockStats}
      />
    );

    const contactsTab = screen.getByRole('button', { name: /contacts/i });
    fireEvent.click(contactsTab);

    await waitFor(() => {
      // Check for contact email (more specific than name)
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});

