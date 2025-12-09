/**
 * Public Shared Document Page
 * 
 * Displays documents shared via public links.
 * No authentication required.
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Lock,
  AlertCircle,
  Clock,
  Eye,
  Rocket,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

interface DocumentContent {
  sections: Array<{
    id: string;
    type: string;
    content: string;
    editable?: boolean;
  }>;
}

interface SharedDocument {
  id: string;
  title: string;
  type: string;
  content: DocumentContent;
  metadata: Record<string, string>;
  createdAt: string;
}

interface ShareInfo {
  permission: string;
  accessCount: number;
}

type PageState = 'loading' | 'password' | 'expired' | 'not-found' | 'error' | 'success';

export default function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [state, setState] = useState<PageState>('loading');
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch document on mount
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/creator/share/${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setState('not-found');
          } else if (response.status === 410) {
            setState('expired');
          } else {
            setError(data.error || 'Failed to load document');
            setState('error');
          }
          return;
        }

        if (data.requiresPassword) {
          setState('password');
          return;
        }

        setDocument(data.document);
        setShareInfo(data.share);
        setState('success');
      } catch {
        setError('Failed to load document');
        setState('error');
      }
    };

    fetchDocument();
  }, [token]);

  // Handle password verification
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/creator/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Incorrect password');
        setIsVerifying(false);
        return;
      }

      setDocument(data.document);
      setShareInfo(data.share);
      setState('success');
    } catch {
      setError('Failed to verify password');
    } finally {
      setIsVerifying(false);
    }
  };

  // Document type display info
  const typeInfo: Record<string, { label: string; color: string }> = {
    newsletter: { label: 'Newsletter', color: 'bg-blue-100 text-blue-700' },
    blog: { label: 'Blog Post', color: 'bg-green-100 text-green-700' },
    social: { label: 'Social Post', color: 'bg-pink-100 text-pink-700' },
    proposal: { label: 'Proposal', color: 'bg-purple-100 text-purple-700' },
    document: { label: 'Document', color: 'bg-orange-100 text-orange-700' },
    presentation: { label: 'Presentation', color: 'bg-cyan-100 text-cyan-700' },
  };

  // Render document content
  const renderContent = () => {
    if (!document?.content?.sections) return null;

    return document.content.sections.map((section, index) => {
      switch (section.type) {
        case 'title':
          return (
            <h1
              key={section.id || index}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
            >
              {section.content}
            </h1>
          );
        case 'heading':
          return (
            <h2
              key={section.id || index}
              className="text-xl md:text-2xl font-semibold text-gray-800 mt-8 mb-4"
            >
              {section.content}
            </h2>
          );
        case 'paragraph':
          return (
            <p
              key={section.id || index}
              className="text-gray-600 leading-relaxed mb-4"
            >
              {section.content}
            </p>
          );
        case 'list':
          return (
            <ul
              key={section.id || index}
              className="list-disc list-inside space-y-2 text-gray-600 mb-4 pl-4"
            >
              {section.content.split('\n').map((item, i) => (
                <li key={i}>{item.replace(/^[•\-]\s*/, '')}</li>
              ))}
            </ul>
          );
        case 'cta':
          return (
            <div
              key={section.id || index}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 my-6 text-center"
            >
              <p className="text-lg font-medium text-indigo-900">{section.content}</p>
            </div>
          );
        default:
          return (
            <p key={section.id || index} className="text-gray-600 mb-4">
              {section.content}
            </p>
          );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-semibold text-sm tracking-wide">GalaxyCo.ai</span>
          </Link>
          {state === 'success' && (
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" aria-hidden="true" />
              {shareInfo?.accessCount} view{shareInfo?.accessCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Loading State */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500">Loading document...</p>
          </div>
        )}

        {/* Password Required State */}
        {state === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-indigo-600" aria-hidden="true" />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900 mb-2">
                    Protected Document
                  </h1>
                  <p className="text-gray-500">
                    This document is password protected. Enter the password to view.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-label="Password"
                      className="text-center"
                    />
                    {error && (
                      <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isVerifying || !password.trim()}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                        Verifying...
                      </>
                    ) : (
                      'View Document'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Expired State */}
        {state === 'expired' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-20"
          >
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-amber-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Link Expired
            </h1>
            <p className="text-gray-500 mb-6">
              This share link has expired and is no longer available.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Go to GalaxyCo.ai
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Not Found State */}
        {state === 'not-found' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-20"
          >
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Document Not Found
            </h1>
            <p className="text-gray-500 mb-6">
              This document doesn&apos;t exist or has been removed.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Go to GalaxyCo.ai
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-20"
          >
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Success State - Document Content */}
        {state === 'success' && document && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Document Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              </div>
              <div>
                <Badge className={typeInfo[document.type]?.color || 'bg-gray-100 text-gray-700'}>
                  {typeInfo[document.type]?.label || document.type}
                </Badge>
              </div>
            </div>

            {/* Document Content */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 md:p-12">
                <article className="prose prose-slate max-w-none">
                  {renderContent()}
                </article>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                Shared via{' '}
                <Link href="/" className="text-indigo-600 hover:underline">
                  GalaxyCo.ai
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

