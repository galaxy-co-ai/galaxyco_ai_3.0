"use client";

import React from "react";

interface SmartMessageFormatterProps {
  content: string;
}

/**
 * Smart formatter that detects structured data patterns in user messages
 * and formats them professionally with better typography
 */
export function SmartMessageFormatter({ content }: SmartMessageFormatterProps) {
  // Parse the content and detect key-value patterns
  const lines = content.split('\n');
  const formatted: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern: "label - value" or "label: value"
    const keyValueMatch = line.match(/^(.+?)\s*[-:]\s*(.+)$/);
    
    if (keyValueMatch) {
      const [, label, value] = keyValueMatch;
      
      // Check if this looks like structured metadata
      const isMetadata = /^(my |the )?(name|company|business|type|role|title|email|phone|website)/i.test(label);
      
      if (isMetadata) {
        formatted.push(
          <div key={i} className="mb-2 last:mb-0">
            <span className="text-white/70 text-xs font-medium uppercase tracking-wide">
              {label.replace(/^(my |the )/i, '').trim()}
            </span>
            <div className="text-white font-semibold mt-0.5">
              {value.trim()}
            </div>
          </div>
        );
        continue;
      }
    }
    
    // Regular paragraph - check for blank line
    if (line.trim() === '') {
      formatted.push(<div key={i} className="h-2" />);
    } else {
      formatted.push(
        <p key={i} className="text-white leading-relaxed mb-2 last:mb-0">
          {line}
        </p>
      );
    }
  }
  
  return <div className="space-y-1">{formatted}</div>;
}
