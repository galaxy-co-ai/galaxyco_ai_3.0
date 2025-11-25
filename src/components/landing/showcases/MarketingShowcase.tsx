import { DemoWrapper } from "../../shared/DemoWrapper";
import MarketingDashboard from "../../marketing/MarketingDashboard";

const mockCampaigns = [
  {
    id: '1',
    name: 'Q4 Product Launch',
    status: 'active',
    budget: 5000000,
    spent: 2500000,
    impressions: 125000,
    clicks: 5000,
    conversions: 250,
    roi: 125,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    channels: ['email', 'social', 'ads'],
  },
  {
    id: '2',
    name: 'Holiday Campaign',
    status: 'active',
    budget: 3000000,
    spent: 1500000,
    impressions: 85000,
    clicks: 3200,
    conversions: 180,
    roi: 95,
    startDate: new Date('2024-11-15'),
    endDate: new Date('2024-12-25'),
    channels: ['email', 'social'],
  },
  {
    id: '3',
    name: 'Brand Awareness',
    status: 'paused',
    budget: 2000000,
    spent: 800000,
    impressions: 45000,
    clicks: 1800,
    conversions: 90,
    roi: 75,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-10-31'),
    channels: ['ads', 'social'],
  },
];

const mockContent = [
  {
    id: '1',
    title: '10 Ways to Improve Your Marketing ROI',
    type: 'blog',
    status: 'published',
    views: 12500,
    engagement: 8.5,
    publishedAt: new Date('2024-11-01'),
    author: 'Sarah Johnson',
  },
];

const mockChannels = [
  {
    id: '1',
    name: 'Email Marketing',
    type: 'email',
    status: 'active',
    performance: 85,
    budget: 1000000,
    reach: 50000,
  },
  {
    id: '2',
    name: 'Social Media',
    type: 'social',
    status: 'active',
    performance: 92,
    budget: 2000000,
    reach: 150000,
  },
];

const mockStats = {
  activeCampaigns: 2,
  totalBudget: 10000000,
  totalImpressions: 255000,
  avgROI: 98,
};

export function MarketingShowcase() {
  return (
    <DemoWrapper scale={0.6} height={600} needsSidebar={false}>
      <MarketingDashboard
        initialCampaigns={mockCampaigns}
        initialContent={mockContent}
        initialChannels={mockChannels}
        stats={mockStats}
      />
    </DemoWrapper>
  );
}
