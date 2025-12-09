import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * AISelectionMenu Extension
 * 
 * Provides a floating menu on text selection with AI actions.
 * - Shows 4 icons: Improve, Rephrase, Shorten, Source
 * - Appears when user selects text
 * - Triggers corresponding AI rewrite actions
 */

export interface SelectionMenuAction {
  id: string;
  label: string;
  icon: string;
  action: (selectedText: string) => void;
}

export interface AISelectionMenuOptions {
  onShowMenu: (position: { x: number; y: number }, selectedText: string) => void;
  onHideMenu: () => void;
  actions?: SelectionMenuAction[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiSelectionMenu: {
      /**
       * Show the AI selection menu
       */
      showAISelectionMenu: () => ReturnType;
      /**
       * Hide the AI selection menu
       */
      hideAISelectionMenu: () => ReturnType;
      /**
       * Get the currently selected text
       */
      getSelectedText: () => ReturnType;
    };
  }
}

export const aiSelectionMenuPluginKey = new PluginKey('aiSelectionMenu');

export const AISelectionMenu = Extension.create<AISelectionMenuOptions>({
  name: 'aiSelectionMenu',

  addOptions() {
    return {
      onShowMenu: () => {},
      onHideMenu: () => {},
      actions: [],
    };
  },

  addStorage() {
    return {
      isVisible: false,
      position: { x: 0, y: 0 },
      selectedText: '',
      selectionFrom: 0,
      selectionTo: 0,
    };
  },

  addCommands() {
    return {
      showAISelectionMenu: () => ({ editor }) => {
        const { view } = editor;
        const { state } = view;
        const { selection } = state;
        const { from, to } = selection;
        
        if (from === to) {
          // No selection, hide menu
          this.storage.isVisible = false;
          this.options.onHideMenu();
          return false;
        }

        // Get selected text
        const selectedText = state.doc.textBetween(from, to, ' ');
        if (!selectedText.trim()) {
          return false;
        }

        // Get position for menu (above selection)
        const coords = view.coordsAtPos(from);
        const endCoords = view.coordsAtPos(to);
        
        // Position menu above and centered on selection
        this.storage.position = {
          x: (coords.left + endCoords.left) / 2,
          y: coords.top - 8,
        };
        this.storage.selectedText = selectedText;
        this.storage.selectionFrom = from;
        this.storage.selectionTo = to;
        this.storage.isVisible = true;

        this.options.onShowMenu(this.storage.position, selectedText);
        return true;
      },

      hideAISelectionMenu: () => () => {
        this.storage.isVisible = false;
        this.options.onHideMenu();
        return true;
      },

      getSelectedText: () => () => {
        return this.storage.selectedText;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    let showMenuTimeout: ReturnType<typeof setTimeout> | null = null;

    return [
      new Plugin({
        key: aiSelectionMenuPluginKey,
        props: {
          handleDOMEvents: {
            mouseup: (view) => {
              // Clear any pending timeout
              if (showMenuTimeout) {
                clearTimeout(showMenuTimeout);
              }

              // Delay slightly to ensure selection is finalized
              showMenuTimeout = setTimeout(() => {
                const { state } = view;
                const { selection } = state;
                const { from, to } = selection;

                if (from !== to) {
                  const selectedText = state.doc.textBetween(from, to, ' ');
                  if (selectedText.trim().length > 2) {
                    extension.editor.commands.showAISelectionMenu();
                  }
                } else {
                  extension.editor.commands.hideAISelectionMenu();
                }
              }, 200);

              return false;
            },
            keydown: (view, event) => {
              // Hide menu on certain key presses
              if (extension.storage.isVisible) {
                const hideKeys = ['Escape', 'Delete', 'Backspace', 'Enter'];
                if (hideKeys.includes(event.key)) {
                  extension.editor.commands.hideAISelectionMenu();
                }
              }
              return false;
            },
          },
        },
        view() {
          return {
            update: (view) => {
              const { state } = view;
              const { selection } = state;
              const { from, to } = selection;

              // Hide menu if selection is cleared
              if (from === to && extension.storage.isVisible) {
                extension.editor.commands.hideAISelectionMenu();
              }
            },
            destroy: () => {
              if (showMenuTimeout) {
                clearTimeout(showMenuTimeout);
              }
            },
          };
        },
      }),
    ];
  },
});

export default AISelectionMenu;

