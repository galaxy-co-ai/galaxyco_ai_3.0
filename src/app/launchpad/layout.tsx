import Link from 'next/link';
import { Rocket, Search, ArrowLeft, Twitter, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Launchpad Layout
 * 
 * Public blog layout with minimal navigation.
 * Users can access without authentication.
 */
export default async function LaunchpadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to App</span>
                </Button>
              </Link>
            )}
            <Link href="/launchpad" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-soft">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg">Launchpad</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/launchpad/search">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </Link>
            {!user && (
              <Link href="/sign-in">
                <Button size="sm" className="rounded-full px-4">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-lg">Launchpad</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Practical AI guidance for small business owners. Learn how to leverage AI without 
                the technical complexity.
              </p>
              <div className="flex items-center gap-2 mt-6">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Explore</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/launchpad" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    All Articles
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/category/getting-started" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/category/tutorials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="/launchpad/category/use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Use Cases
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">GalaxyCo.ai</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} GalaxyCo.ai. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
