import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
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
        
        // Nebula Accents - Full Shade Ranges for Light/Dark Mode Support
        'nebula-teal': {
          50: '#f0f7f7',
          100: '#d9eeee',
          200: '#b5dddd',
          300: '#8ac5c5',
          400: '#6aabab',
          500: '#5B8A8A', // Base color
          DEFAULT: '#5B8A8A',
          600: '#4a7272',
          700: '#3d5e5e',
          800: '#334d4d',
          900: '#2b4141',
          950: '#1a2929',
        },
        'nebula-violet': {
          50: '#f5f3f9',
          100: '#ebe7f3',
          200: '#d5cee6',
          300: '#b9aad4',
          400: '#9a84be',
          500: '#7C6B9E', // Base color
          DEFAULT: '#7C6B9E',
          600: '#685889',
          700: '#574a72',
          800: '#493f5e',
          900: '#3d354e',
          950: '#251f31',
        },
        'nebula-rose': {
          50: '#f9f5f7',
          100: '#f3ebee',
          200: '#e8d6dc',
          300: '#d6b7c1',
          400: '#c0959e',
          500: '#9E7B8A', // Base color
          DEFAULT: '#9E7B8A',
          600: '#8a6676',
          700: '#735462',
          800: '#604751',
          900: '#513d45',
          950: '#2f2227',
        },
        'nebula-blue': {
          50: '#f3f5f8',
          100: '#e5e9f0',
          200: '#cdd4e2',
          300: '#a9b5cd',
          400: '#8193b3',
          500: '#5A6B8A', // Base color
          DEFAULT: '#5A6B8A',
          600: '#4d5b76',
          700: '#404b62',
          800: '#374052',
          900: '#313845',
          950: '#1f232d',
        },
        
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

