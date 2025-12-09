import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * AICommands Extension
 * 
 * Provides AI command palette functionality for the Tiptap editor.
 * - Triggers on / at line start or Cmd/Ctrl+J anywhere
 * - Opens command palette with AI writing actions
 * - Commands: Continue, Rephrase, Expand, Shorten, Find Source, Suggest Image
 */

export type AICommand = {
  id: string;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  action: () => void;
};

export interface AICommandsOptions {
  onOpenPalette: (position: { x: number; y: number }) => void;
  onClosePalette: () => void;
  commands?: AICommand[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiCommands: {
      /**
       * Open the AI command palette
       */
      openAICommandPalette: () => ReturnType;
      /**
       * Close the AI command palette
       */
      closeAICommandPalette: () => ReturnType;
    };
  }
}

export const aiCommandsPluginKey = new PluginKey('aiCommands');

export const AICommands = Extension.create<AICommandsOptions>({
  name: 'aiCommands',

  addOptions() {
    return {
      onOpenPalette: () => {},
      onClosePalette: () => {},
      commands: [],
    };
  },

  addStorage() {
    return {
      isOpen: false,
      position: { x: 0, y: 0 },
      triggerChar: null as string | null,
    };
  },

  addCommands() {
    return {
      openAICommandPalette: () => ({ editor }) => {
        // Get cursor position for palette positioning
        const { view } = editor;
        const { selection } = view.state;
        const coords = view.coordsAtPos(selection.from);
        
        this.storage.isOpen = true;
        this.storage.position = {
          x: coords.left,
          y: coords.bottom + 8,
        };
        
        this.options.onOpenPalette(this.storage.position);
        return true;
      },

      closeAICommandPalette: () => () => {
        this.storage.isOpen = false;
        this.options.onClosePalette();
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Cmd/Ctrl+J to open command palette
      'Mod-j': () => {
        if (this.storage.isOpen) {
          this.editor.commands.closeAICommandPalette();
        } else {
          this.editor.commands.openAICommandPalette();
        }
        return true;
      },
      // Escape to close palette
      Escape: () => {
        if (this.storage.isOpen) {
          this.editor.commands.closeAICommandPalette();
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: aiCommandsPluginKey,
        props: {
          handleKeyDown: (view, event) => {
            // Check for / at line start to trigger command palette
            if (event.key === '/') {
              const { state } = view;
              const { selection, doc } = state;
              const { $from } = selection;
              
              // Check if we're at the start of a line or after only whitespace
              const lineStart = $from.start();
              const textBeforeCursor = doc.textBetween(lineStart, $from.pos);
              
              if (textBeforeCursor.trim() === '') {
                // Delay slightly to let the / character be inserted first
                // Then the palette will show
                setTimeout(() => {
                  extension.storage.triggerChar = '/';
                  extension.editor.commands.openAICommandPalette();
                }, 10);
                // Don't prevent default - let / be typed
                return false;
              }
            }
            
            return false;
          },
        },
      }),
    ];
  },
});

export default AICommands;

