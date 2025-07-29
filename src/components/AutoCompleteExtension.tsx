import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface AutoCompleteOptions {
  getSuggestions: (text: string) => Promise<string[]>;
  onAcceptSuggestion?: (suggestion: string) => void;
}

export const AutoCompleteExtension = Extension.create<AutoCompleteOptions>({
  name: 'autoComplete',

  addOptions() {
    return {
      getSuggestions: async () => [],
      onAcceptSuggestion: () => {},
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        key: new PluginKey('autoComplete'),
        state: {
          init() {
            return {
              suggestion: '',
              decorations: DecorationSet.empty,
            };
          },
          apply(tr, value, oldState, newState) {
            // Get current text
            const text = newState.doc.textContent;
            const lastChar = text[text.length - 1];
            
            // Trigger suggestion on space or punctuation
            if (lastChar === ' ' || lastChar === '。' || lastChar === '，') {
              // This is where we would fetch suggestions
              // For now, return empty state
              return {
                suggestion: '',
                decorations: DecorationSet.empty,
              };
            }
            
            return value;
          },
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state);
            return pluginState ? pluginState.decorations : DecorationSet.empty;
          },
          handleKeyDown(view, event) {
            const pluginState = this.getState(view.state);
            if (!pluginState) return false;
            const { suggestion } = pluginState;
            
            // Accept suggestion with Tab
            if (event.key === 'Tab' && suggestion) {
              event.preventDefault();
              const { tr } = view.state;
              view.dispatch(tr.insertText(suggestion));
              extension.options.onAcceptSuggestion?.(suggestion);
              return true;
            }
            
            return false;
          },
        },
      }),
    ];
  },
});