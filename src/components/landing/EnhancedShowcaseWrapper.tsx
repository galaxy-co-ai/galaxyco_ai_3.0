import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Play } from "lucide-react";
import { ReactNode } from "react";

interface EnhancedShowcaseWrapperProps {
  title: string;
  description: string;
  url: string;
  badges: string[];
  children: ReactNode;
  onTryDemo?: () => void;
  gradient?: string;
}

export function EnhancedShowcaseWrapper({
  title,
  description,
  url,
  badges,
  children,
  onTryDemo,
  gradient = "from-blue-500 to-purple-500"
}: EnhancedShowcaseWrapperProps) {
  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
          {badges.map((badge, i) => (
            <Badge
              key={i}
              className="px-3 py-1.5 bg-white/90 backdrop-blur-xl text-primary border border-primary/20 shadow-sm"
            >
              {badge}
            </Badge>
          ))}
        </div>
        <h3 className="text-2xl lg:text-3xl mb-3">{title}</h3>
        <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      {/* Enhanced Browser Window */}
      <motion.div
        className="relative group/showcase"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        whileHover={{ y: -4 }}
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-0 group-hover/showcase:opacity-100 transition-opacity duration-500" />
        
        {/* Browser Chrome */}
        <div className="relative">
          <div className="bg-white rounded-t-2xl border border-b-0 border-gray-200 px-5 py-4 flex items-center gap-3 shadow-sm">
            {/* Window Controls */}
            <div className="flex items-center gap-2">
              <motion.div 
                className="h-3.5 w-3.5 rounded-full bg-red-500"
                whileHover={{ scale: 1.2 }}
              />
              <motion.div 
                className="h-3.5 w-3.5 rounded-full bg-yellow-500"
                whileHover={{ scale: 1.2 }}
              />
              <motion.div 
                className="h-3.5 w-3.5 rounded-full bg-green-500"
                whileHover={{ scale: 1.2 }}
              />
            </div>
            
            {/* URL Bar */}
            <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600 font-mono flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs lg:text-sm truncate">{url}</span>
            </div>

            {/* Try Demo Button */}
            {onTryDemo && (
              <Button
                size="sm"
                className={`rounded-full bg-gradient-to-r ${gradient} text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hidden lg:flex`}
                onClick={onTryDemo}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Try Demo
              </Button>
            )}
          </div>

          {/* Content Area with Enhanced Shadow - FIXED HEIGHT */}
          <div className="relative bg-white rounded-b-2xl border border-t-0 border-gray-200 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.12)] group-hover/showcase:shadow-[0_30px_100px_rgba(0,0,0,0.16)] transition-shadow duration-500">
            {/* Subtle Top Gradient */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-60`} />
            
            {/* The Actual Showcase Content - FIXED HEIGHT 600px */}
            <div className="relative h-[600px] overflow-hidden">
              {children}
            </div>
          </div>
        </div>

        {/* Bottom Shine Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
      </motion.div>

      {/* Mobile Try Demo Button */}
      {onTryDemo && (
        <div className="flex justify-center lg:hidden">
          <Button
            size="sm"
            className={`rounded-full bg-gradient-to-r ${gradient} text-white border-0 shadow-md hover:shadow-lg transition-all duration-300`}
            onClick={onTryDemo}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Try Interactive Demo
          </Button>
        </div>
      )}
    </div>
  );
}
