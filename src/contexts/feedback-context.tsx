"use client";

import * as React from "react";

interface FeedbackContextType {
  isOpen: boolean;
  openFeedback: () => void;
  closeFeedback: () => void;
}

const FeedbackContext = React.createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const openFeedback = React.useCallback(() => setIsOpen(true), []);
  const closeFeedback = React.useCallback(() => setIsOpen(false), []);

  return (
    <FeedbackContext.Provider value={{ isOpen, openFeedback, closeFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = React.useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}

