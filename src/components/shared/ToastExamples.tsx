"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

/**
 * Toast Examples Component
 * Demonstrates all toast notification types and features
 * Can be used in development or as a reference
 */
export function ToastExamples() {
  const handleSuccess = () => {
    toast.success("Changes saved successfully!", {
      description: "Your settings have been updated.",
    });
  };

  const handleError = () => {
    toast.error("Failed to save changes", {
      description: "Please try again or contact support.",
    });
  };

  const handleWarning = () => {
    toast.warning("Low storage space", {
      description: "You have less than 10% storage remaining.",
    });
  };

  const handleInfo = () => {
    toast.info("New feature available", {
      description: "Check out the new dashboard widgets!",
    });
  };

  const handleWithAction = () => {
    toast.success("File uploaded successfully", {
      description: "Your file is ready to view.",
      action: {
        label: "View File",
        onClick: () => console.log("Opening file..."),
      },
    });
  };

  const handleLoading = () => {
    const loadingToast = toast.loading("Processing your request...", {
      description: "This may take a few moments.",
    });

    // Simulate async operation
    setTimeout(() => {
      loadingToast.success("Request completed!", {
        description: "All data has been processed.",
      });
    }, 3000);
  };

  const handlePromise = () => {
    const mockAsyncOperation = () => 
      new Promise<{ count: number }>((resolve) => {
        setTimeout(() => resolve({ count: 42 }), 2000);
      });

    toast.promise(mockAsyncOperation(), {
      loading: "Loading data...",
      success: (data) => `Successfully loaded ${data.count} items`,
      error: "Failed to load data",
      description: "Processing your request",
    });
  };

  const handleCustomDuration = () => {
    toast.info("This toast stays for 10 seconds", {
      duration: 10000,
    });
  };

  const handleDismissAll = () => {
    toast.dismissAll();
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Toast Notifications</h2>
        <p className="text-muted-foreground mb-6">
          Examples of all toast notification types
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Types */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Basic Types</h3>
          <Button onClick={handleSuccess} variant="default" className="w-full">
            Success Toast
          </Button>
          <Button onClick={handleError} variant="destructive" className="w-full">
            Error Toast
          </Button>
          <Button onClick={handleWarning} variant="outline" className="w-full">
            Warning Toast
          </Button>
          <Button onClick={handleInfo} variant="outline" className="w-full">
            Info Toast
          </Button>
        </div>

        {/* Advanced Features */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Advanced Features</h3>
          <Button onClick={handleWithAction} variant="outline" className="w-full">
            With Action Button
          </Button>
          <Button onClick={handleLoading} variant="outline" className="w-full">
            Loading Toast
          </Button>
          <Button onClick={handlePromise} variant="outline" className="w-full">
            Promise Toast
          </Button>
          <Button onClick={handleCustomDuration} variant="outline" className="w-full">
            Custom Duration
          </Button>
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Controls</h3>
          <Button onClick={handleDismissAll} variant="outline" className="w-full">
            Dismiss All Toasts
          </Button>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Usage Examples</h3>
        <pre className="text-xs overflow-x-auto">
{`// Basic usage
import { toast } from "@/lib/toast";

toast.success("Saved!");
toast.error("Failed to save");
toast.warning("Low storage");
toast.info("New feature");

// With description and action
toast.success("File uploaded", {
  description: "Your file is ready",
  action: {
    label: "View",
    onClick: () => console.log("View file")
  }
});

// Loading toast
const loading = toast.loading("Processing...");
// Later: loading.success("Done!");

// Promise toast (auto-transitions)
toast.promise(apiCall(), {
  loading: "Saving...",
  success: "Saved!",
  error: "Failed to save"
});`}
        </pre>
      </div>
    </div>
  );
}
