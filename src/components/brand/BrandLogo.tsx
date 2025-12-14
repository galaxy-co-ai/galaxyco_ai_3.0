import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoVariant = "wordmark" | "wordmarkGlow" | "icon";
type BrandLogoTone = "onLight" | "onDark";

type BrandLogoSize = "header" | "nav" | "footer" | "hero" | "icon";

const logoSources: Record<BrandLogoVariant, Record<BrandLogoTone, string>> = {
  wordmark: {
    // Dark mark intended for light backgrounds (nav/footer/content)
    onLight: "/assets/brand/logos/1ae0cec6-7678-42b8-9154-7af87df89f46.png",
    // Light mark intended for dark backgrounds (hero/dark sections)
    onDark: "/assets/brand/logos/810729f1-240f-4d5a-9435-04d6c9cc2da8.png",
  },
  wordmarkGlow: {
    onLight: "/assets/brand/logos/029fc3eb-141c-4de7-8f24-a126978e0d33.png",
    onDark: "/assets/brand/logos/029fc3eb-141c-4de7-8f24-a126978e0d33.png",
  },
  icon: {
    onLight: "/assets/brand/logos/8e0f0c40-c80f-416c-8f66-99bae47f8630.png",
    onDark: "/assets/brand/logos/8e0f0c40-c80f-416c-8f66-99bae47f8630.png",
  },
};

const sizeToPixels: Record<BrandLogoSize, { width: number; height: number; className: string }> = {
  // Header size: strictly constrained for navigation bars (max 40px height)
  header: { width: 160, height: 40, className: "h-10 max-h-10 w-auto" },
  nav: { width: 140, height: 32, className: "h-7 w-auto" },
  footer: { width: 160, height: 40, className: "h-8 w-auto" },
  hero: { width: 520, height: 180, className: "h-32 w-auto" },
  icon: { width: 40, height: 40, className: "h-10 w-10" },
};

export interface BrandLogoProps
  extends Omit<
    React.ComponentProps<typeof Image>,
    "src" | "alt" | "width" | "height" | "priority"
  > {
  variant?: BrandLogoVariant;
  tone?: BrandLogoTone;
  size?: BrandLogoSize;
  alt?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "wordmark",
  tone = "onLight",
  size = "nav",
  alt = "GalaxyCo",
  className,
  priority,
  ...props
}: BrandLogoProps) {
  const src = logoSources[variant][tone];
  const dims = sizeToPixels[size];

  return (
    <Image
      src={src}
      alt={alt}
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={cn("object-contain", dims.className, className)}
      {...props}
    />
  );
}
