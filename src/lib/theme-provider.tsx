"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type AccentColor = "indigo" | "purple" | "blue" | "teal" | "pink" | "amber";
type FontSize = "small" | "medium" | "large";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultAccentColor?: AccentColor;
  defaultFontSize?: FontSize;
}

interface ThemeProviderState {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultAccentColor = "indigo",
  defaultFontSize = "medium",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [accentColor, setAccentColorState] = React.useState<AccentColor>(defaultAccentColor);
  const [fontSize, setFontSizeState] = React.useState<FontSize>(defaultFontSize);
  const [mounted, setMounted] = React.useState(false);

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    const storedTheme = localStorage.getItem("galaxyco-theme") as Theme;
    const storedAccent = localStorage.getItem("galaxyco-accent") as AccentColor;
    const storedFontSize = localStorage.getItem("galaxyco-font-size") as FontSize;

    if (storedTheme) setThemeState(storedTheme);
    if (storedAccent) setAccentColorState(storedAccent);
    if (storedFontSize) setFontSizeState(storedFontSize);
    
    setMounted(true);
  }, []);

  // Apply theme to document root
  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let effectiveTheme = theme;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      effectiveTheme = systemTheme;
    }

    root.classList.add(effectiveTheme);
  }, [theme, mounted]);

  // Apply accent color to document root
  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.dataset.accentColor = accentColor;
  }, [accentColor, mounted]);

  // Apply font size to document root
  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.dataset.fontSize = fontSize;
  }, [fontSize, mounted]);

  // Listen to system theme changes when theme is "system"
  React.useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("galaxyco-theme", newTheme);
    setThemeState(newTheme);
  };

  const setAccentColor = (color: AccentColor) => {
    localStorage.setItem("galaxyco-accent", color);
    setAccentColorState(color);
  };

  const setFontSize = (size: FontSize) => {
    localStorage.setItem("galaxyco-font-size", size);
    setFontSizeState(size);
  };

  const value = {
    theme,
    accentColor,
    fontSize,
    setTheme,
    setAccentColor,
    setFontSize,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
