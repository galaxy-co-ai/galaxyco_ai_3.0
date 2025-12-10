import { VisualGridBuilder } from "../components/VisualGridBuilder";
import { Sparkles, MousePointer2 } from "lucide-react";

export function Studio() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-center space-y-2">
          <h1>Studio</h1>
          <p className="text-muted-foreground">
            Build AI workflows visually or describe what you want using the AI assistant
          </p>
        </div>

        {/* AI Assistant Hint */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">💡 Pro tip:</span> Use the AI assistant to build workflows faster! Try saying{" "}
                <span className="font-medium text-purple-700">"Create a workflow that..."</span> or drag nodes from the palette.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
              <MousePointer2 className="h-3.5 w-3.5" />
              <span>Click the floating button →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Workflow Builder */}
      <div className="h-[calc(100vh-18rem)]">
        <VisualGridBuilder />
      </div>
    </div>
  );
}
