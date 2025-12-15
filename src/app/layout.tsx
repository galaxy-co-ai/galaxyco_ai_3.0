import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/lib/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "GalaxyCo.ai - AI-Native Workspace Platform",
    template: "%s | GalaxyCo.ai",
  },
  description:
    "AI agents, workflow automation, and intelligent CRM in one seamless platform. Save 10+ hours weekly with Neptune AI.",
  keywords: [
    "AI",
    "automation",
    "CRM",
    "workflow",
    "AI agents",
    "business platform",
  ],
  authors: [{ name: "GalaxyCo" }],
  creator: "GalaxyCo",
  metadataBase: new URL("https://galaxyco.ai"),
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Galaxy",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://galaxyco.ai",
    siteName: "GalaxyCo.ai",
    title: "GalaxyCo.ai - AI-Native Workspace Platform",
    description:
      "AI agents, workflow automation, and intelligent CRM in one seamless platform.",
    images: [
      { url: "/assets/brand/logos/og-image_1.png", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GalaxyCo.ai - AI-Native Workspace Platform",
    description:
      "AI agents, workflow automation, and intelligent CRM in one seamless platform.",
    images: ["/assets/brand/logos/og-image_1.png"],
    creator: "@galaxyco_ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} antialiased`}
        >
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
