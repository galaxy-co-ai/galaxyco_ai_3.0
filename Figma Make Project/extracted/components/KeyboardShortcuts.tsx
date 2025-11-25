import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  Keyboard,
  Command,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Move,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Save,
  Play,
  Search
} from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  icon: any;
}

interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    name: "Canvas Navigation",
    shortcuts: [
      {
        keys: ["Space", "+", "Drag"],
        description: "Pan canvas",
        icon: Move
      },
      {
        keys: ["Scroll"],
        description: "Zoom in/out",
        icon: ZoomIn
      },
      {
        keys: ["Cmd/Ctrl", "+", "0"],
        description: "Reset zoom to 100%",
        icon: ZoomOut
      },
      {
        keys: ["Cmd/Ctrl", "+", "F"],
        description: "Fit all nodes to screen",
        icon: MousePointer2
      }
    ]
  },
  {
    name: "Node Operations",
    shortcuts: [
      {
        keys: ["Click"],
        description: "Select node",
        icon: MousePointer2
      },
      {
        keys: ["Cmd/Ctrl", "+", "C"],
        description: "Copy selected node",
        icon: Copy
      },
      {
        keys: ["Cmd/Ctrl", "+", "V"],
        description: "Paste node",
        icon: Copy
      },
      {
        keys: ["Delete"],
        description: "Delete selected node",
        icon: Trash2
      },
      {
        keys: ["Cmd/Ctrl", "+", "D"],
        description: "Duplicate node",
        icon: Copy
      }
    ]
  },
  {
    name: "Workflow Actions",
    shortcuts: [
      {
        keys: ["Cmd/Ctrl", "+", "S"],
        description: "Save workflow",
        icon: Save
      },
      {
        keys: ["Cmd/Ctrl", "+", "Z"],
        description: "Undo",
        icon: Undo2
      },
      {
        keys: ["Cmd/Ctrl", "+", "Shift", "+", "Z"],
        description: "Redo",
        icon: Redo2
      },
      {
        keys: ["Cmd/Ctrl", "+", "Enter"],
        description: "Run workflow",
        icon: Play
      },
      {
        keys: ["Cmd/Ctrl", "+", "K"],
        description: "Search nodes",
        icon: Search
      }
    ]
  }
];

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const renderKey = (key: string) => {
    return (
      <Badge 
        variant="outline" 
        className="px-2 py-1 font-mono text-xs bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-sm"
      >
        {key}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 shadow-[0_2px_8px_rgb(0,0,0,0.04)] border-0 bg-white hover:shadow-[0_4px_16px_rgb(0,0,0,0.08)]"
        >
          <Keyboard className="h-3.5 w-3.5 mr-1.5" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Speed up your workflow with these keyboard commands
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
            {shortcutCategories.map((category, idx) => (
              <div key={category.name}>
                {idx > 0 && <Separator className="mb-6" />}
                
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  {category.name}
                </h3>

                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, shortcutIdx) => (
                    <div
                      key={shortcutIdx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center flex-shrink-0">
                          <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{shortcut.description}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {shortcut.keys.map((key, keyIdx) => (
                          <div key={keyIdx} className="flex items-center gap-1.5">
                            {renderKey(key)}
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Tip */}
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
          <div className="flex items-start gap-3">
            <Command className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Pro Tip</p>
              <p className="text-xs text-blue-700 mt-1">
                Press <Badge variant="outline" className="mx-1 text-xs font-mono">?</Badge> anytime to show this dialog
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
