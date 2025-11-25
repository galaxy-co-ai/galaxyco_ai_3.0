import { ReactNode, useEffect, useRef, useState } from "react";
import { SidebarProvider } from "./ui/sidebar";

interface DemoWrapperProps {
  children: ReactNode;
  scale?: number;
  height?: number;
  needsSidebar?: boolean;
}

/**
 * DemoWrapper scales down real page components to fit in showcase windows
 * without scrolling, giving visitors an exact view of the actual product.
 */
export function DemoWrapper({ children, scale = 0.6, height = 600, needsSidebar = true }: DemoWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate the scaled height to prevent overflow
  const scaledHeight = height / scale;

  const content = (
    <div 
      ref={containerRef}
      className="relative overflow-hidden bg-white"
      style={{ height: `${height}px` }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${containerWidth / scale}px`,
          height: `${scaledHeight}px`,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );

  // Wrap with SidebarProvider if needed (for Dashboard and other pages that use sidebar hooks)
  if (needsSidebar) {
    return (
      <SidebarProvider defaultOpen={false}>
        {content}
      </SidebarProvider>
    );
  }

  return content;
}
