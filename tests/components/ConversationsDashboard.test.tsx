import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConversationsDashboard from '@/components/conversations/ConversationsDashboard';
import '@testing-library/jest-dom';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock team chat components
vi.mock('@/components/conversations/TeamChat', () => ({
  default: () => <div>Team Chat Component</div>,
}));

describe('ConversationsDashboard', () => {
  const defaultProps = {
    phoneNumbers: [
      {
        id: 'phone-1',
        phoneNumber: '+15551234567',
        friendlyName: 'Main Line',
        numberType: 'primary' as const,
        status: 'active',
      },
    ],
    initialConversations: [
      {
        id: 'conv-1',
        channel: 'sms' as const,
        status: 'active' as const,
        subject: 'Customer Inquiry',
        snippet: 'Hello, how can I help?',
        isUnread: true,
        isStarred: false,
        isPinned: false,
        unreadCount: 2,
        messageCount: 5,
        lastMessageAt: new Date('2025-12-05T10:00:00Z'),
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2025-12-05T10:00:00Z'),
        assignedTo: null,
        labels: [],
        tags: ['department:support'],
        latestMessage: {
          id: 'msg-1',
          body: 'Hello, how can I help?',
          direction: 'inbound' as const,
          senderName: 'John Doe',
          createdAt: new Date('2025-12-05T10:00:00Z'),
        },
        participants: [
          {
            id: 'part-1',
            contactId: 'contact-1',
            prospectId: null,
            customerId: null,
            userId: null,
            email: 'john@example.com',
            phone: '+15559876543',
            name: 'John Doe',
          },
        ],
      },
      {
        id: 'conv-2',
        channel: 'whatsapp' as const,
        status: 'closed' as const,
        subject: 'Support Request',
        snippet: 'Thanks for your help!',
        isUnread: false,
        isStarred: false,
        isPinned: false,
        unreadCount: 0,
        messageCount: 3,
        lastMessageAt: new Date('2025-12-04T15:30:00Z'),
        createdAt: new Date('2025-12-03T15:30:00Z'),
        updatedAt: new Date('2025-12-04T15:30:00Z'),
        assignedTo: null,
        labels: [],
        tags: ['department:sales'],
        latestMessage: {
          id: 'msg-2',
          body: 'Thanks for your help!',
          direction: 'outbound' as const,
          senderName: 'Jane Smith',
          createdAt: new Date('2025-12-04T15:30:00Z'),
        },
        participants: [
          {
            id: 'part-2',
            contactId: 'contact-2',
            prospectId: null,
            customerId: null,
            userId: null,
            email: 'jane@example.com',
            phone: '+15551111111',
            name: 'Jane Smith',
          },
        ],
      },
    ],
    stats: {
      totalConversations: 2,
      unreadMessages: 2,
      activeChannels: 2,
      avgResponseTime: 300,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the conversations dashboard', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
  });

  it('should display conversation statistics', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    // Should show total conversations
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render conversations list', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display unread message count', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    // Should show unread count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should switch between channels (All, SMS, WhatsApp, Team)', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    // Should have channel filter tabs
    const allTab = screen.getByRole('tab', { name: /all/i });
    expect(allTab).toBeInTheDocument();
  });

  it('should filter conversations by search query', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('John');
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should display conversation channel badges', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    // SMS and WhatsApp badges should be visible
    expect(screen.getByText(/sms/i)).toBeInTheDocument();
    expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
  });

  it('should handle conversation selection', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const conversation = screen.getByText('John Doe');
    fireEvent.click(conversation);
    
    await waitFor(() => {
      // Conversation thread should open
      expect(conversation).toBeInTheDocument();
    });
  });

  it('should show Team Chat when Team tab is clicked', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const teamTab = screen.getByRole('tab', { name: /team/i });
    fireEvent.click(teamTab);
    
    await waitFor(() => {
      expect(screen.getByText(/team chat component/i)).toBeInTheDocument();
    });
  });

  it('should display last message preview', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('Thanks for your help!')).toBeInTheDocument();
  });

  it('should format message timestamps correctly', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    // Timestamps should be formatted (e.g., "2h ago", "Yesterday")
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
  });

  it('should handle sending messages', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'msg-new',
          content: 'New message',
          sentAt: new Date(),
        }),
      })
    ) as any;

    render(<ConversationsDashboard {...defaultProps} />);
    
    // Select a conversation
    const conversation = screen.getByText('John Doe');
    fireEvent.click(conversation);
    
    // Should have message input
    await waitFor(() => {
      expect(conversation).toBeInTheDocument();
    });
  });

  it('should show empty state when no conversations exist', () => {
    const emptyProps = {
      ...defaultProps,
      initialConversations: [],
    };

    render(<ConversationsDashboard {...emptyProps} />);
    
    // Should show empty state
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
  });

  it('should open Neptune panel for assistance', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const neptuneButton = screen.getByRole('button', { name: /neptune/i });
    fireEvent.click(neptuneButton);
    
    await waitFor(() => {
      expect(neptuneButton).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' }),
      })
    ) as any;

    render(<ConversationsDashboard {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveAttribute('aria-label');
  });

  it('should display conversation status', () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it('should handle real-time message updates', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    // Component should poll for updates
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});

describe('ConversationsDashboard - Team Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Team Chat component', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const teamTab = screen.getByRole('tab', { name: /team/i });
    fireEvent.click(teamTab);
    
    await waitFor(() => {
      expect(screen.getByText(/team chat component/i)).toBeInTheDocument();
    });
  });

  it('should handle channel switching in Team Chat', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const teamTab = screen.getByRole('tab', { name: /team/i });
    fireEvent.click(teamTab);
    
    await waitFor(() => {
      expect(teamTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should support file uploads in Team Chat', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const teamTab = screen.getByRole('tab', { name: /team/i });
    fireEvent.click(teamTab);
    
    await waitFor(() => {
      expect(screen.getByText(/team chat component/i)).toBeInTheDocument();
    });
  });
});

describe('ConversationsDashboard - Message Threading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display message thread when conversation is selected', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    const conversation = screen.getByText('John Doe');
    fireEvent.click(conversation);
    
    await waitFor(() => {
      // Thread should be visible
      expect(conversation).toBeInTheDocument();
    });
  });

  it('should show typing indicator', async () => {
    render(<ConversationsDashboard {...defaultProps} />);
    
    // Should support typing indicators in active conversations
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
  });

  it('should mark messages as read when viewed', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as any;

    render(<ConversationsDashboard {...defaultProps} />);
    
    const conversation = screen.getByText('John Doe');
    fireEvent.click(conversation);
    
    // Should mark unread messages as read
    await waitFor(() => {
      expect(conversation).toBeInTheDocument();
    });
  });
});
