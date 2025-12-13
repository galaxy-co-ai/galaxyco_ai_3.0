import * as React from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * Optimized Image Component
 * Wrapper around Next.js Image with additional optimizations
 */

interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string;
  alt: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide" | number;
  fallbackSrc?: string;
  showLoader?: boolean;
  loaderClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  aspectRatio,
  fallbackSrc = "/images/placeholder.png",
  showLoader = true,
  loaderClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(src);

  // Handle image load error
  const handleError = () => {
    if (!error && fallbackSrc) {
      setError(true);
      setImageSrc(fallbackSrc);
    }
  };

  // Get aspect ratio class
  const getAspectRatioClass = () => {
    if (!aspectRatio) return "";
    
    if (typeof aspectRatio === "number") {
      return "";
    }

    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "video":
        return "aspect-video"; // 16:9
      case "portrait":
        return "aspect-[3/4]";
      case "wide":
        return "aspect-[21/9]";
      default:
        return "";
    }
  };

  return (
    <div className={cn("relative overflow-hidden", getAspectRatioClass(), className)}>
      {/* Loading state */}
      {showLoader && isLoading && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            loaderClassName
          )}
        />
      )}

      {/* Image */}
      <Image
        src={imageSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Responsive Image Set
 * Automatically generates responsive image sizes
 */
export function ResponsiveImage({
  src,
  alt,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  ...props
}: OptimizedImageProps & { sizes?: string; priority?: boolean }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      sizes={sizes}
      priority={priority}
      {...props}
    />
  );
}

/**
 * Avatar Image with circular crop and fallback
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  fallbackInitials,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
  fallbackInitials?: string;
  className?: string;
}) {
  const [imageError, setImageError] = React.useState(!src);

  if (imageError || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold",
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallbackInitials || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-full overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

/**
 * Background Image with gradient overlay
 */
export function BackgroundImage({
  src,
  alt,
  overlay = true,
  overlayOpacity = 0.4,
  children,
  className,
}: {
  src: string;
  alt: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

/**
 * Lazy loaded image with intersection observer
 * Only loads when image is near viewport
 */
export function LazyImage({
  src,
  alt,
  threshold = 0.1,
  rootMargin = "50px",
  ...props
}: OptimizedImageProps & { threshold?: number; rootMargin?: string }) {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={imgRef}>
      {shouldLoad ? (
        <OptimizedImage src={src} alt={alt} {...props} />
      ) : (
        <div className={cn("bg-muted animate-pulse", props.className)} />
      )}
    </div>
  );
}
