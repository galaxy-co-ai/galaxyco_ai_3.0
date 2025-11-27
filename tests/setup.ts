import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
beforeAll(() => {
  process.env.ALLOW_DEV_BYPASS = 'true';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.NODE_ENV = 'test';
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock logger to prevent console spam in tests
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));


