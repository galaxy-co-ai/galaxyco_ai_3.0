import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════
        // NEBULA BRAND PALETTE - Premium, Muted, Sophisticated
        // ═══════════════════════════════════════════════════════════════
        
        // Foundation
        'nebula-void': '#0A0A0F',
        'nebula-deep': '#13111C',
        'nebula-dark': '#1A1625',
        'nebula-frost': '#F0F0F5',
        
        // Nebula Accents - Muted & Sophisticated
        'nebula-teal': '#5B8A8A',
        'nebula-violet': '#7C6B9E',
        'nebula-rose': '#9E7B8A',
        'nebula-blue': '#5A6B8A',
        
        // Legacy aliases (for backwards compatibility during migration)
        'void-black': '#0A0A0F',
        'deep-space': '#13111C',
        'ice-white': '#F0F0F5',
        'electric-cyan': '#5B8A8A',
        'creamsicle': '#9E7B8A',
        
        // Soft colors for status/tags
        'soft-hot': '#D4A5A5',
        'soft-warm': '#D4C4A5',
        'soft-cold': '#A5B4D4',
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'soft-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.06)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Tailwind v4 config format requires CommonJS
  plugins: [require('@tailwindcss/typography')],
};

export default config;

