import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * AIAutocomplete Extension
 * 
 * Provides AI-powered autocomplete functionality for the Tiptap editor.
 * - Triggers on Cmd/Ctrl+Enter to continue writing from cursor
 * - Shows inline ghost text suggestions
 * - Supports Tab to accept or Escape to dismiss
 */

export interface AIAutocompleteOptions {
  onContinue: (content: string, cursorPosition: number) => void;
  onAccept: (suggestion: string) => void;
  onReject: () => void;
  getSuggestion: () => string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiAutocomplete: {
      /**
       * Trigger AI autocomplete at current cursor position
       */
      triggerAIAutocomplete: () => ReturnType;
      /**
       * Accept the current AI suggestion
       */
      acceptAISuggestion: () => ReturnType;
      /**
       * Reject/dismiss the current AI suggestion
       */
      rejectAISuggestion: () => ReturnType;
      /**
       * Set AI suggestion text (from streaming response)
       */
      setAISuggestion: (text: string) => ReturnType;
      /**
       * Clear AI suggestion
       */
      clearAISuggestion: () => ReturnType;
    };
  }
}

export const aiAutocompletePluginKey = new PluginKey('aiAutocomplete');

export const AIAutocomplete = Extension.create<AIAutocompleteOptions>({
  name: 'aiAutocomplete',

  addOptions() {
    return {
      onContinue: () => {},
      onAccept: () => {},
      onReject: () => {},
      getSuggestion: () => null,
    };
  },

  addStorage() {
    return {
      suggestion: null as string | null,
      isLoading: false,
      cursorPos: null as number | null,
    };
  },

  addCommands() {
    return {
      triggerAIAutocomplete: () => ({ editor, state }) => {
        const { selection } = state;
        const cursorPos = selection.from;
        const content = editor.getHTML();
        
        this.storage.isLoading = true;
        this.storage.cursorPos = cursorPos;
        this.options.onContinue(content, cursorPos);
        
        return true;
      },

      acceptAISuggestion: () => ({ editor, chain }) => {
        const suggestion = this.storage.suggestion;
        if (!suggestion) return false;

        const cursorPos = this.storage.cursorPos;
        if (cursorPos === null) return false;

        // Insert the suggestion at the stored cursor position
        chain()
          .focus()
          .insertContentAt(cursorPos, suggestion)
          .run();

        this.options.onAccept(suggestion);
        this.storage.suggestion = null;
        this.storage.isLoading = false;
        this.storage.cursorPos = null;

        return true;
      },

      rejectAISuggestion: () => () => {
        if (!this.storage.suggestion) return false;

        this.options.onReject();
        this.storage.suggestion = null;
        this.storage.isLoading = false;
        this.storage.cursorPos = null;

        return true;
      },

      setAISuggestion: (text: string) => () => {
        this.storage.suggestion = text;
        this.storage.isLoading = false;
        return true;
      },

      clearAISuggestion: () => () => {
        this.storage.suggestion = null;
        this.storage.isLoading = false;
        this.storage.cursorPos = null;
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Cmd/Ctrl+Enter to trigger autocomplete
      'Mod-Enter': () => {
        this.editor.commands.triggerAIAutocomplete();
        return true;
      },
      // Tab to accept suggestion
      Tab: () => {
        if (this.storage.suggestion) {
          this.editor.commands.acceptAISuggestion();
          return true;
        }
        return false;
      },
      // Escape to reject suggestion
      Escape: () => {
        if (this.storage.suggestion) {
          this.editor.commands.rejectAISuggestion();
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
        key: aiAutocompletePluginKey,
        props: {
          decorations: (state) => {
            const suggestion = extension.storage.suggestion;
            const cursorPos = extension.storage.cursorPos;

            if (!suggestion || cursorPos === null) {
              return DecorationSet.empty;
            }

            // Create a decoration to show the ghost text
            const widget = document.createElement('span');
            widget.className = 'ai-suggestion-ghost';
            widget.textContent = suggestion;
            widget.style.cssText = `
              color: #9ca3af;
              opacity: 0.6;
              font-style: italic;
              pointer-events: none;
            `;

            const decoration = Decoration.widget(cursorPos, widget, {
              side: 1,
              key: 'ai-suggestion',
            });

            return DecorationSet.create(state.doc, [decoration]);
          },
        },
      }),
    ];
  },
});

export default AIAutocomplete;

