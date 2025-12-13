/**
 * Browser Push Notifications Utility
 * Handles permission requests, settings, and displaying browser notifications
 */

export type NotificationPermission = "default" | "granted" | "denied";

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: unknown;
  requireInteraction?: boolean;
  silent?: boolean;
}

class PushNotificationManager {
  private permission: NotificationPermission = "default";

  constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Check if browser supports notifications
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   * Returns the new permission status
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn("Push notifications are not supported in this browser");
      return "denied";
    }

    if (this.permission === "granted") {
      return "granted";
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return "denied";
    }
  }

  /**
   * Show a browser notification
   * Will request permission if not already granted
   */
  async show(options: PushNotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn("Push notifications are not supported");
      return null;
    }

    // Request permission if needed
    if (this.permission !== "granted") {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied");
        return null;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
      });

      return notification;
    } catch (error) {
      console.error("Failed to show notification:", error);
      return null;
    }
  }

  /**
   * Show a simple notification with just title and body
   */
  async showSimple(title: string, body: string, icon?: string): Promise<Notification | null> {
    return this.show({ title, body, icon });
  }

  /**
   * Check if user has previously denied permission
   */
  isBlocked(): boolean {
    return this.getPermission() === "denied";
  }

  /**
   * Check if notifications are enabled (permission granted)
   */
  isEnabled(): boolean {
    return this.getPermission() === "granted";
  }

  /**
   * Get user-friendly message about notification status
   */
  getStatusMessage(): string {
    const permission = this.getPermission();
    
    switch (permission) {
      case "granted":
        return "Notifications are enabled";
      case "denied":
        return "Notifications are blocked. Please enable them in your browser settings.";
      default:
        return "Click to enable notifications";
    }
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationManager();

// Export convenience functions
export const requestNotificationPermission = () => 
  pushNotifications.requestPermission();

export const showPushNotification = (options: PushNotificationOptions) =>
  pushNotifications.show(options);

export const showSimplePushNotification = (title: string, body: string, icon?: string) =>
  pushNotifications.showSimple(title, body, icon);

export const isPushNotificationSupported = () =>
  pushNotifications.isSupported();

export const isPushNotificationEnabled = () =>
  pushNotifications.isEnabled();

export const isPushNotificationBlocked = () =>
  pushNotifications.isBlocked();

export const getPushNotificationStatus = () =>
  pushNotifications.getStatusMessage();
