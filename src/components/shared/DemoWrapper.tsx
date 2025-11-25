"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { SidebarProvider } from "../ui/sidebar";

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
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Calculate dimensions - use a standard page width that matches container
  const contentWidth = 1400; // Slightly larger to fill the max-w-7xl container better
  const scaledHeight = height / scale;
  
  const content = (
    <div 
      ref={containerRef}
      className="relative overflow-hidden bg-white w-full"
      style={{ height: `${height}px` }}
    >
      <div
        className="absolute top-0 left-1/2"
        style={{
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
          width: `${contentWidth}px`,
          height: `${scaledHeight}px`,
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

