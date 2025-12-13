import * as React from "react";
import { toast as sonnerToast, ExternalToast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions extends ExternalToast {
  title?: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Enhanced toast notification system built on sonner
 * Provides consistent toast notifications with icons, actions, and queue management
 */
class ToastManager {
  private readonly defaultDuration = 4000; // 4 seconds
  private readonly errorDuration = 6000; // 6 seconds for errors
  private readonly loadingDuration = Infinity; // Loading toasts don't auto-dismiss

  /**
   * Show a success toast
   */
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, {
      ...this.buildOptions(options, "success"),
      duration: options?.duration ?? this.defaultDuration,
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    });
  }

  /**
   * Show an error toast
   */
  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, {
      ...this.buildOptions(options, "error"),
      duration: options?.duration ?? this.errorDuration,
      icon: <XCircle className="h-5 w-5 text-destructive" />,
    });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, {
      ...this.buildOptions(options, "warning"),
      duration: options?.duration ?? this.defaultDuration,
      icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
    });
  }

  /**
   * Show an info toast
   */
  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, {
      ...this.buildOptions(options, "info"),
      duration: options?.duration ?? this.defaultDuration,
      icon: <Info className="h-5 w-5 text-blue-600" />,
    });
  }

  /**
   * Show a loading toast
   * Returns a function to dismiss the toast when complete
   */
  loading(message: string, options?: Omit<ToastOptions, "action">) {
    const toastId = sonnerToast.loading(message, {
      description: options?.description,
      duration: this.loadingDuration,
      icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
      dismissible: options?.dismissible ?? false,
    });

    return {
      id: toastId,
      success: (successMessage: string, successOptions?: ToastOptions) => {
        sonnerToast.success(successMessage, {
          ...this.buildOptions(successOptions, "success"),
          id: toastId,
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        });
      },
      error: (errorMessage: string, errorOptions?: ToastOptions) => {
        sonnerToast.error(errorMessage, {
          ...this.buildOptions(errorOptions, "error"),
          id: toastId,
          icon: <XCircle className="h-5 w-5 text-destructive" />,
        });
      },
      dismiss: () => sonnerToast.dismiss(toastId),
    };
  }

  /**
   * Show a promise toast
   * Automatically transitions from loading to success/error based on promise result
   */
  promise<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
      description?: string;
      action?: ToastAction;
    }
  ) {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      description: options.description,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  /**
   * Show a custom toast with full control
   */
  custom(content: (id: string | number) => React.ReactElement, options?: ExternalToast) {
    return sonnerToast.custom(content, options);
  }

  /**
   * Dismiss a specific toast by ID
   */
  dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    sonnerToast.dismiss();
  }

  /**
   * Build options for toast with action button if provided
   */
  private buildOptions(
    options?: ToastOptions,
    type?: "success" | "error" | "warning" | "info"
  ): ExternalToast {
    const baseOptions: ExternalToast = {
      description: options?.description,
      dismissible: options?.dismissible ?? true,
      closeButton: options?.closeButton,
      ...options,
    };

    if (options?.action) {
      baseOptions.action = {
        label: options.action.label,
        onClick: options.action.onClick,
      };
    }

    return baseOptions;
  }
}

// Export singleton instance
export const toast = new ToastManager();

// Export convenience functions for common patterns
export const showSuccessToast = (message: string, options?: ToastOptions) => 
  toast.success(message, options);

export const showErrorToast = (message: string, options?: ToastOptions) => 
  toast.error(message, options);

export const showWarningToast = (message: string, options?: ToastOptions) => 
  toast.warning(message, options);

export const showInfoToast = (message: string, options?: ToastOptions) => 
  toast.info(message, options);

export const showLoadingToast = (message: string, options?: Omit<ToastOptions, "action">) => 
  toast.loading(message, options);

export const showPromiseToast = <T,>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
    description?: string;
    action?: ToastAction;
  }
) => toast.promise(promise, options);
