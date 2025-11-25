import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface QuickIntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  isConnected: boolean;
  isConnecting?: boolean;
  onConnect: () => void;
}

export function QuickIntegrationCard({
  name,
  description,
  icon,
  gradient,
  isConnected,
  isConnecting = false,
  onConnect
}: QuickIntegrationCardProps) {
  return (
    <motion.button
      onClick={!isConnected && !isConnecting ? onConnect : undefined}
      disabled={isConnected || isConnecting}
      whileHover={!isConnected && !isConnecting ? { scale: 1.03, y: -2 } : {}}
      whileTap={!isConnected && !isConnecting ? { scale: 0.98 } : {}}
      className={`relative p-4 rounded-xl border-2 transition-all text-left w-full ${
        isConnected
          ? 'border-green-300 bg-green-50/50 cursor-default'
          : isConnecting
          ? 'border-blue-300 bg-blue-50/50 cursor-wait'
          : 'border-border bg-white hover:border-blue-300 hover:shadow-lg cursor-pointer'
      }`}
    >
      {/* Connected/Connecting Badge */}
      {(isConnected || isConnecting) && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-2 -right-2 z-10"
        >
          {isConnected ? (
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-md">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </motion.div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm mb-3`}>
        {icon}
      </div>

      {/* Content */}
      <h4 className="font-medium text-sm mb-1">{name}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </motion.button>
  );
}
