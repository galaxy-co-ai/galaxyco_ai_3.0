import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  isConnected: boolean;
  isConnecting?: boolean;
  category: "essential" | "recommended" | "optional";
  onConnect: () => void;
  onDisconnect?: () => void;
  features?: string[];
}

export function IntegrationCard({
  id,
  name,
  description,
  icon,
  gradient,
  isConnected,
  isConnecting = false,
  category,
  onConnect,
  onDisconnect,
  features = []
}: IntegrationCardProps) {
  const [showFeatures, setShowFeatures] = useState(false);

  const categoryColors = {
    essential: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-0 shadow-sm",
    recommended: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-0 shadow-sm",
    optional: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-0 shadow-sm"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <Card className={`p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all border ${
        isConnected 
          ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-green-50/30 shadow-[0_4px_20px_rgb(34,197,94,0.1)]' 
          : category === 'essential'
          ? 'border-orange-200 bg-gradient-to-br from-orange-50/30 to-white shadow-[0_4px_20px_rgb(249,115,22,0.06)]'
          : 'border-border/50 shadow-[0_2px_10px_rgb(0,0,0,0.03)]'
      }`}>
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className={`${categoryColors[category]} flex-shrink-0 px-2 py-0.5 text-xs`}>
            {category === 'essential' && <Sparkles className="h-2.5 w-2.5 mr-1" />}
            {category}
          </Badge>
        </div>

        {/* Connected Indicator */}
        {isConnected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute top-3 left-3"
          >
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="flex flex-col items-center gap-3 pt-4">
          {/* Icon */}
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-[0_4px_12px_rgb(0,0,0,0.15)]`}>
            {icon}
          </div>

          {/* Name */}
          <h4 className="text-center text-base leading-tight">{name}</h4>

          {/* Features Toggle */}
          {features.length > 0 && (
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Show features
              <ArrowRight className={`h-3 w-3 transition-transform ${showFeatures ? 'rotate-90' : ''}`} />
            </button>
          )}

          {/* Action Button */}
          <div className="w-full mt-2">
            {isConnected ? (
              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100 h-8 text-sm rounded-full"
                  disabled
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Connected
                </Button>
                {onDisconnect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDisconnect}
                    className="w-full text-xs h-7"
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={onConnect}
                disabled={isConnecting}
                size="sm"
                className="w-full bg-[#007AFF] hover:bg-[#0051D5] text-white h-8 text-sm rounded-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Features Popover */}
      {showFeatures && features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 z-20"
        >
          <Card className="p-3 shadow-lg border-blue-200">
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
