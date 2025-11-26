"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Plus, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function GalaxyIntegrationCard({
  id,
  name,
  description,
  icon,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative flex flex-col p-6 rounded-3xl border transition-all duration-300 overflow-hidden",
        isConnected
          ? "bg-primary/5 border-primary/20 shadow-[0_0_30px_-10px_rgba(var(--primary),0.2)]"
          : "bg-background/40 border-white/10 hover:border-primary/20 hover:bg-background/60 hover:shadow-xl"
      )}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-background/50 border border-white/10 shadow-inner backdrop-blur-md">
          {icon}
        </div>
        {isConnected && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 space-y-2">
        <h3 className="font-semibold text-lg tracking-tight">{name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      <div className="relative z-10 mt-6 pt-4 border-t border-white/5">
        {isConnected ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-background/50 border-white/10 hover:bg-background/80"
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={onConnect}
            disabled={isConnecting}
            className={cn(
              "w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-none",
              isConnecting && "opacity-80"
            )}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Connect
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}










