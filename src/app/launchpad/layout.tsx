import Link from 'next/link';
import { Rocket, Search, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to App</span>
                </Button>
              </Link>
            )}
            <Link href="/launchpad" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Launchpad</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/launchpad/search">
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </Link>
            {!user && (
              <Link href="/sign-in">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-purple-600">
                <Rocket className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">
                Launchpad by GalaxyCo.ai
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Practical AI guidance for small business owners
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
