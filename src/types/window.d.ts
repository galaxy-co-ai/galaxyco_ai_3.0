/**
 * Global window type extensions
 */

interface Window {
  analytics?: {
    track: (eventName: string, properties?: Record<string, unknown>) => void;
    identify: (userId: string, traits?: Record<string, unknown>) => void;
    page: (name?: string, properties?: Record<string, unknown>) => void;
  };
}
