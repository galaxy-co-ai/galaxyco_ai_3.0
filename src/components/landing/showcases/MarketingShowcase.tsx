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
    name: 'Holiday Email Blast',
    status: 'active',
    budget: 2500000,
    spent: 1800000,
    impressions: 85000,
    clicks: 4200,
    conversions: 380,
    roi: 165,
    startDate: new Date('2024-11-15'),
    endDate: new Date('2024-12-25'),
    channels: ['email'],
  },
  {
    id: '3',
    name: 'LinkedIn Lead Gen',
    status: 'active',
    budget: 3500000,
    spent: 2100000,
    impressions: 95000,
    clicks: 3800,
    conversions: 210,
    roi: 145,
    startDate: new Date('2024-10-15'),
    endDate: new Date('2024-12-15'),
    channels: ['social', 'ads'],
  },
  {
    id: '4',
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
  {
    id: '5',
    name: 'Webinar Promotion',
    status: 'active',
    budget: 1500000,
    spent: 650000,
    impressions: 32000,
    clicks: 2100,
    conversions: 450,
    roi: 210,
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-11-30'),
    channels: ['email', 'social'],
  },
];

const mockContent = [
  {
    id: '1',
    title: '10 Ways AI is Transforming Sales in 2025',
    type: 'blog',
    status: 'published',
    views: 12500,
    engagement: 8.5,
    publishedAt: new Date('2024-11-01'),
    author: 'Sarah Johnson',
  },
  {
    id: '2',
    title: 'The Complete Guide to Marketing Automation',
    type: 'ebook',
    status: 'published',
    views: 8200,
    engagement: 12.3,
    publishedAt: new Date('2024-10-15'),
    author: 'Michael Chen',
  },
  {
    id: '3',
    title: 'Q4 Product Demo Video',
    type: 'video',
    status: 'published',
    views: 25400,
    engagement: 15.8,
    publishedAt: new Date('2024-10-20'),
    author: 'Creative Team',
  },
  {
    id: '4',
    title: 'Customer Success Story: TechCorp',
    type: 'case-study',
    status: 'published',
    views: 6800,
    engagement: 9.2,
    publishedAt: new Date('2024-11-10'),
    author: 'Emily Rodriguez',
  },
];

const mockChannels = [
  {
    id: '1',
    name: 'Email Marketing',
    type: 'email',
    status: 'active',
    performance: 85,
    budget: 2500000,
    reach: 125000,
  },
  {
    id: '2',
    name: 'LinkedIn Ads',
    type: 'social',
    status: 'active',
    performance: 92,
    budget: 3000000,
    reach: 180000,
  },
  {
    id: '3',
    name: 'Google Ads',
    type: 'ads',
    status: 'active',
    performance: 78,
    budget: 4000000,
    reach: 320000,
  },
  {
    id: '4',
    name: 'Twitter/X',
    type: 'social',
    status: 'active',
    performance: 65,
    budget: 1000000,
    reach: 95000,
  },
];

const mockStats = {
  activeCampaigns: 4,
  totalBudget: 14500000,
  totalImpressions: 382000,
  avgROI: 144,
};

export function MarketingShowcase() {
  return (
    <DemoWrapper scale={0.6} height={600} needsSidebar={false}>
      <MarketingDashboard
        disableLiveData
        initialCampaigns={mockCampaigns}
        initialContent={mockContent}
        initialChannels={mockChannels}
        stats={mockStats}
      />
    </DemoWrapper>
  );
}
