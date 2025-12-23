import { 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Wand2
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface AIActionCardProps {
  title: string;
  description: string;
  type: "email" | "task" | "research" | "schedule";
  confidence: number;
  onExecute: () => Promise<void>;
  onDismiss: () => void;
}

export function AIActionCard({ 
  title, 
  description, 
  type, 
  confidence, 
  onExecute,
  onDismiss
}: AIActionCardProps) {
  const [status, setStatus] = useState<"idle" | "executing" | "success" | "error">("idle");

  const handleExecute = async () => {
    setStatus("executing");
    try {
      await onExecute();
      setStatus("success");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case "email":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "task":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "research":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "schedule":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <Card className="relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all group">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 p-20 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="p-5 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getTypeStyles()} capitalize`}>
              {type}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
              {confidence}% Match
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-slate-900" onClick={onDismiss}>
            <span className="sr-only">Dismiss</span>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <Button 
                  onClick={handleExecute}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md transition-all"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Execute Action
                </Button>
              </motion.div>
            )}

            {status === "executing" && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <Button disabled className="w-full bg-slate-100 text-slate-500 border border-slate-200">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI Processing...
                </Button>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="w-full flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-md border border-green-200"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Action Completed</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Bottom Progress/Loading Bar */}
      {status === "executing" && (
        <motion.div 
          layoutId="loading-bar"
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      )}
    </Card>
  );
}














































































