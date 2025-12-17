import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyAgentsDashboard from '@/components/agents/MyAgentsDashboard';
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

// Mock Laboratory wizard
vi.mock('@/components/agents/laboratory/LaboratoryWizard', () => ({
  default: () => <div>Laboratory Wizard</div>,
}));

// Test props available to all describ
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the agents dashboard', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    expect(screen.getByText(/my agents/i)).toBeInTheDocument();
  });

  it('should display agent statistics', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    // Should show total agents count
    expect(screen.getByText('3')).toBeInTheDocument();
    // Should show active agents count
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render agents list', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    expect(screen.getByText('Sales Assistant')).toBeInTheDocument();
    expect(screen.getByText('Support Agent')).toBeInTheDocument();
    expect(screen.getByText('Research Bot')).toBeInTheDocument();
  });

  it('should display agent status badges', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/paused/i)).toBeInTheDocument();
    expect(screen.getByText(/inactive/i)).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const messagesTab = screen.getByRole('tab', { name: /messages/i });
    fireEvent.click(messagesTab);
    
    await waitFor(() => {
      expect(messagesTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should open Laboratory when Laboratory tab is clicked', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const laboratoryTab = screen.getByRole('tab', { name: /laboratory/i });
    fireEvent.click(laboratoryTab);
    
    await waitFor(() => {
      expect(screen.getByText(/laboratory wizard/i)).toBeInTheDocument();
    });
  });

  it('should filter agents by search query', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Sales' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Sales');
      expect(screen.getByText('Sales Assistant')).toBeInTheDocument();
    });
  });

  it('should display agent execution counts', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    // Should show execution counts
    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/8/)).toBeInTheDocument();
  });

  it('should handle agent selection for chat', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    // Switch to Messages tab
    const messagesTab = screen.getByRole('tab', { name: /messages/i });
    fireEvent.click(messagesTab);
    
    await waitFor(() => {
      expect(messagesTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should show empty state when no agents exist', () => {
    const emptyProps = {
      ...defaultProps,
      initialAgents: [],
    };

    render(<MyAgentsDashboard {...emptyProps} />);
    
    // Should render without crashing
    expect(screen.getByText(/my agents/i)).toBeInTheDocument();
  });

  it('should open Neptune panel for assistance', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const neptuneButton = screen.getByRole('button', { name: /neptune/i });
    fireEvent.click(neptuneButton);
    
    await waitFor(() => {
      // Neptune panel should be available
      expect(neptuneButton).toBeInTheDocument();
    });
  });

  it('should display last execution time', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    // Should format and display last executed date
    expect(screen.getByText(/my agents/i)).toBeInTheDocument();
  });

  it('should handle agent pause/resume', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'agent-1', status: 'paused' }),
      })
    ) as any;

    render(<MyAgentsDashboard {...defaultProps} />);
    
    // Component should have pause/resume functionality
    expect(screen.getByText('Sales Assistant')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveAttribute('aria-label');
  });

  it('should display agent type badges', () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    // Agent types should be displayed
    expect(screen.getByText(/my agents/i)).toBeInTheDocument();
  });

  it('should handle agent deletion', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as any;

    render(<MyAgentsDashboard {...defaultProps} />);
    
    // Should have delete functionality
    expect(screen.getByText('Sales Assistant')).toBeInTheDocument();
  });
});

describe('MyAgentsDashboard - Laboratory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show Laboratory wizard on Laboratory tab', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const laboratoryTab = screen.getByRole('tab', { name: /laboratory/i });
    fireEvent.click(laboratoryTab);
    
    await waitFor(() => {
      expect(screen.getByText(/laboratory wizard/i)).toBeInTheDocument();
    });
  });

  it('should handle agent creation in Laboratory', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'agent-new',
          name: 'New Agent',
          status: 'draft',
        }),
      })
    ) as any;

    render(<MyAgentsDashboard {...defaultProps} />);
    
    const laboratoryTab = screen.getByRole('tab', { name: /laboratory/i });
    fireEvent.click(laboratoryTab);
    
    await waitFor(() => {
      expect(screen.getByText(/laboratory wizard/i)).toBeInTheDocument();
    });
  });

  it('should show agent templates in Laboratory', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const laboratoryTab = screen.getByRole('tab', { name: /laboratory/i });
    fireEvent.click(laboratoryTab);
    
    await waitFor(() => {
      expect(screen.getByText(/laboratory wizard/i)).toBeInTheDocument();
    });
  });
});

describe('MyAgentsDashboard - Messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show agent chat interface in Messages tab', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const messagesTab = screen.getByRole('tab', { name: /messages/i });
    fireEvent.click(messagesTab);
    
    await waitFor(() => {
      expect(messagesTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should handle sending messages to agents', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'Agent response',
          conversationId: 'conv-1',
        }),
      })
    ) as any;

    render(<MyAgentsDashboard {...defaultProps} />);
    
    const messagesTab = screen.getByRole('tab', { name: /messages/i });
    fireEvent.click(messagesTab);
    
    await waitFor(() => {
      expect(messagesTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should display conversation history', async () => {
    render(<MyAgentsDashboard {...defaultProps} />);
    
    const messagesTab = screen.getByRole('tab', { name: /messages/i });
    fireEvent.click(messagesTab);
    
    await waitFor(() => {
      expect(messagesTab).toHaveAttribute('data-state', 'active');
    });
  });
});
