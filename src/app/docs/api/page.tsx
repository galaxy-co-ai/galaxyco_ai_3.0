'use client';

/**
 * Interactive API Documentation Page
 * 
 * Simple iframe-based Scalar UI integration
 */
export default function ApiDocsPage() {
  return (
    <div className="h-screen w-full bg-[#0f0f23]">
      <iframe
        src={`https://api.scalar.com/sandbox?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/api/openapi' : '/api/openapi')}&theme=purple`}
        className="w-full h-full border-0"
        title="API Documentation"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
