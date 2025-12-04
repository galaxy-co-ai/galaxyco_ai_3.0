"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to error reporting service
    logger.error("App error", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertTriangle className="w-12 h-12 text-red-500" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="gap-2"
            aria-label="Try again"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard" className="gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
