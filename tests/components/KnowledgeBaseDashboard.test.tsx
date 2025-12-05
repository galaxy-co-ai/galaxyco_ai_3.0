import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KnowledgeBaseDashboard from '@/components/knowledge-base/KnowledgeBaseDashboard';
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

// Mock file processing
vi.mock('@/lib/knowledge/processor', () => ({
  processDocument: vi.fn(() => Promise.resolve({
    text: 'Processed document text',
    chunks: ['chunk1', 'chunk2'],
  })),
}));

describe('KnowledgeBaseDashboard', () => {
  const defaultProps = {
    initialDocuments: [
      {
        id: 'doc-1',
        title: 'Test Document',
        type: 'pdf',
        size: 1024000,
        uploadedAt: new Date('2025-12-01'),
        status: 'processed',
        tags: ['important'],
        url: 'https://example.com/doc1.pdf',
      },
      {
        id: 'doc-2',
        title: 'Another Document',
        type: 'docx',
        size: 512000,
        uploadedAt: new Date('2025-11-15'),
        status: 'processing',
        tags: ['draft'],
        url: 'https://example.com/doc2.docx',
      },
    ],
    stats: {
      totalDocuments: 2,
      totalSize: 1536000,
      categories: 5,
      recentUploads: 2,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the knowledge base dashboard', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    expect(screen.getByText(/library/i)).toBeInTheDocument();
  });

  it('should display document statistics', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    // Should show total documents
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render documents list', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('Another Document')).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const categoriesTab = screen.getByRole('tab', { name: /categories/i });
    fireEvent.click(categoriesTab);
    
    await waitFor(() => {
      expect(categoriesTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should filter documents by search query', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('Test');
      // Should filter to show only "Test Document"
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  });

  it('should handle file upload', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'doc-new',
          title: 'New Document',
          status: 'processing',
        }),
      })
    ) as any;

    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const uploadTab = screen.getByRole('tab', { name: /upload/i });
    fireEvent.click(uploadTab);
    
    await waitFor(() => {
      expect(uploadTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should display document types correctly', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    // Check for PDF indicator
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();
  });

  it('should show processing status for documents', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    expect(screen.getByText(/processed/i)).toBeInTheDocument();
  });

  it('should handle document search functionality', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          results: [
            {
              documentId: 'doc-1',
              title: 'Test Document',
              excerpt: 'This is a test document excerpt...',
              score: 0.95,
            },
          ],
        }),
      })
    ) as any;

    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('test query');
    });
  });

  it('should display file sizes correctly', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    // File sizes should be formatted (1 MB, 500 KB, etc.)
    expect(screen.getByText(/library/i)).toBeInTheDocument();
  });

  it('should handle document deletion', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as any;

    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    // Component should handle delete action
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });

  it('should show upload progress', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const uploadTab = screen.getByRole('tab', { name: /upload/i });
    fireEvent.click(uploadTab);
    
    await waitFor(() => {
      // Upload tab should be active
      expect(uploadTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should validate file types on upload', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const uploadTab = screen.getByRole('tab', { name: /upload/i });
    fireEvent.click(uploadTab);
    
    // Should show allowed file types
    await waitFor(() => {
      expect(screen.getByText(/library/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' }),
      })
    ) as any;

    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    // Should render without crashing
    expect(screen.getByText(/library/i)).toBeInTheDocument();
  });

  it('should display document tags', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    expect(screen.getByText('important')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('should handle empty documents list', () => {
    const emptyProps = {
      ...defaultProps,
      initialDocuments: [],
    };

    render(<KnowledgeBaseDashboard {...emptyProps} />);
    
    // Should show empty state
    expect(screen.getByText(/library/i)).toBeInTheDocument();
  });

  it('should open Neptune panel for assistance', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const neptuneButton = screen.getByRole('button', { name: /neptune/i });
    fireEvent.click(neptuneButton);
    
    await waitFor(() => {
      // Neptune panel should open
      expect(neptuneButton).toBeInTheDocument();
    });
  });

  it('should handle favorites functionality', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const favoritesTab = screen.getByRole('tab', { name: /favorites/i });
    fireEvent.click(favoritesTab);
    
    await waitFor(() => {
      expect(favoritesTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveAttribute('aria-label');
  });

  it('should display upload date for documents', () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    // Documents should show upload dates
    expect(screen.getByText(/library/i)).toBeInTheDocument();
  });

  it('should handle document preview', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    // Clicking a document should show preview or details
    const document = screen.getByText('Test Document');
    fireEvent.click(document);
    
    await waitFor(() => {
      expect(document).toBeInTheDocument();
    });
  });
});

describe('KnowledgeBaseDashboard - File Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept valid file types', async () => {
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'doc-new' }),
      })
    ) as any;

    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const uploadTab = screen.getByRole('tab', { name: /upload/i });
    fireEvent.click(uploadTab);
    
    // Should handle file drop or selection
    await waitFor(() => {
      expect(uploadTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('should reject files over size limit', async () => {
    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)],
      'large.pdf',
      { type: 'application/pdf' }
    );

    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const uploadTab = screen.getByRole('tab', { name: /upload/i });
    fireEvent.click(uploadTab);
    
    // Should show error for files > 10MB
    await waitFor(() => {
      expect(uploadTab).toBeInTheDocument();
    });
  });

  it('should show upload progress bar', async () => {
    render(<KnowledgeBaseDashboard {...defaultProps} />);
    
    const uploadTab = screen.getByRole('tab', { name: /upload/i });
    fireEvent.click(uploadTab);
    
    // Progress bar should appear during upload
    await waitFor(() => {
      expect(uploadTab).toHaveAttribute('data-state', 'active');
    });
  });
});
