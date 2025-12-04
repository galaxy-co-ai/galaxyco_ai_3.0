"use client";

import { useState } from "react";
import { Bell, Check, Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NotifyMeForm() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          source: "lunar-labs-coming-soon"
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setIsSuccess(false);
    setError(null);
    setEmail("");
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
        aria-label="Get notified when Lunar Labs launches"
      >
        <Bell className="w-4 h-4" />
        <span>Notify Me</span>
      </button>

      <Dialog open={showModal} onOpenChange={resetForm}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-400" />
              Get Notified
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Be the first to know when Lunar Labs launches. We&apos;ll send you one email—no spam, ever.
            </DialogDescription>
          </DialogHeader>

          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">You&apos;re on the list!</h3>
              <p className="text-slate-400 text-sm">
                We&apos;ll notify you as soon as Lunar Labs is ready.
              </p>
              <button
                onClick={resetForm}
                className="mt-6 px-6 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
                    disabled={isLoading}
                    aria-label="Email address"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Notify Me
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
